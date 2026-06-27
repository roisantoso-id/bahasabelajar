#!/usr/bin/env node
// 预生成全部印尼语发音 → Supabase Storage（public bucket: tts-cache）
// 前端 azureSpeak() 直读 public URL，永不实时调 Azure，也不依赖登录态。
//
// 覆盖：words.word + words.examples[].id + articles.sentences[].id
// 去重：key = SHA-256(`id-ID-GadisNeural|0.75|<text>`).mp3，已存在则跳过。
//       （此算法与 h5/index.html 的 _ttsStorageURL 必须逐字节一致！）
//
// 用法：
//   AZURE_SPEECH_KEY=xxx SUPABASE_SERVICE_ROLE_KEY=xxx node scripts/gen-tts.js
//
// 可选 env：
//   AZURE_SPEECH_REGION   默认 eastus
//   SUPABASE_URL          默认本项目
//   CONCURRENCY           默认 4（Azure 免费层并发别太高）
//   DRY_RUN=1             只统计规模 + 已存在数，不调 Azure、不上传（不需要任何 key）
//
// service_role key 在哪拿：Supabase Dashboard → Project Settings → API → service_role（secret）。
// ⚠️ service_role 仅本地脚本用，切勿写进前端或提交进 git。

const crypto = require('crypto')

// 读 .env（本地，已 gitignore）；不覆盖已有环境变量
try {
  const fs = require('fs'), path = require('path')
  const envPath = path.join(__dirname, '..', '.env')
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/)
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
    }
  }
} catch {}

const SB = process.env.SUPABASE_URL || 'https://bzdelpmcewjdvmgyafux.supabase.co'
// anon key 公开只读，用于拉 words/articles
const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6ZGVscG1jZXdqZHZtZ3lhZnV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMjY1MDksImV4cCI6MjA4ODkwMjUwOX0.x_D0VGGmXCY9rueAh0lV4f7r9wOJIGCHs19w5S2BNpg'
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || ''
const AZURE_KEY = process.env.AZURE_SPEECH_KEY || ''
const AZURE_REGION = process.env.AZURE_SPEECH_REGION || 'eastus'

const VOICE = 'id-ID-GadisNeural'   // 女声（与前端一致）
const RATE = 0.8                      // 慢速（数字倍率：0.8 = 0.8倍速；切勿用百分比，Azure 会当成加速！）
const BUCKET = 'tts-cache'
const CONCURRENCY = Number(process.env.CONCURRENCY || 4)
const DRY = process.env.DRY_RUN === '1'
const MAX_LEN = 2000   // Azure 单次合成上限保护

// 路径 = `<cat>/<hash>.mp3`（cat: words | sentences）；hash 与前端 _ttsStorageURL 一致
function ttsKey(text, cat) {
  return cat + '/' + crypto.createHash('sha256').update(`${VOICE}|${RATE}|${text}`, 'utf8').digest('hex') + '.mp3'
}
function xmlEsc(s) {
  return s.replace(/[<>&'"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]))
}

// —— 拉数据（anon，公开只读，Range 分页）——
async function fetchAll(table, select) {
  const out = []
  const page = 1000
  for (let from = 0; ; from += page) {
    const r = await fetch(`${SB}/rest/v1/${table}?select=${select}`, {
      headers: { apikey: ANON, Authorization: `Bearer ${ANON}`, Range: `${from}-${from + page - 1}` },
    })
    if (!r.ok) throw new Error(`fetch ${table} ${r.status}: ${(await r.text()).slice(0, 120)}`)
    const rows = await r.json()
    out.push(...rows)
    if (rows.length < page) break
  }
  return out
}

async function collectTexts() {
  // 按 cat 分桶去重：key=`${cat}|${text}` → {text, cat}
  const map = new Map()
  const add = (t, cat) => {
    if (t && typeof t === 'string') { const s = t.trim(); if (s && s.length <= MAX_LEN) map.set(cat + '|' + s, { text: s, cat }) }
  }

  console.log('拉取 words…')
  const words = await fetchAll('words', 'word,examples')
  for (const w of words) {
    add(w.word, 'words')                                              // 单词 → words/
    if (Array.isArray(w.examples)) for (const e of w.examples) add(e && e.id, 'sentences')  // 例句 → sentences/
  }
  console.log(`  words: ${words.length} 行`)

  console.log('拉取 articles…')
  const arts = await fetchAll('articles', 'sentences')
  let sentCount = 0
  for (const a of arts) {
    if (Array.isArray(a.sentences)) for (const s of a.sentences) { add(s && s.id, 'sentences'); sentCount++ }  // 文章句 → sentences/
  }
  console.log(`  articles: ${arts.length} 篇 / ${sentCount} 句`)

  return [...map.values()]
}

// —— Storage 已存在检查（HEAD public）——
async function exists(key) {
  const r = await fetch(`${SB}/storage/v1/object/public/${BUCKET}/${key}`, { method: 'HEAD' })
  return r.ok
}

// —— Azure TTS 合成 ——
async function azureTTS(text) {
  const ssml = `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='id-ID'><voice name='${VOICE}'><prosody rate="${RATE}">${xmlEsc(text)}</prosody></voice></speak>`
  const r = await fetch(`https://${AZURE_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': AZURE_KEY,
      'Content-Type': 'application/ssml+xml',
      'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3',
      'User-Agent': 'BahasaBelajar',
    },
    body: ssml,
  })
  if (!r.ok) throw new Error(`azure ${r.status}: ${(await r.text()).slice(0, 140)}`)
  return Buffer.from(await r.arrayBuffer())
}

// —— 上传 Storage（service_role）——
async function upload(key, buf) {
  const r = await fetch(`${SB}/storage/v1/object/${BUCKET}/${key}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SERVICE}`,
      'Content-Type': 'audio/mpeg',
      'Cache-Control': '31536000',
      'x-upsert': 'true',
    },
    body: buf,
  })
  if (!r.ok) throw new Error(`upload ${r.status}: ${(await r.text()).slice(0, 140)}`)
}

async function processOne(item) {
  const { text, cat } = item
  const key = ttsKey(text, cat)
  if (await exists(key)) return 'skip'
  if (DRY) return 'todo'
  let lastErr
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const buf = await azureTTS(text)
      await upload(key, buf)
      return 'gen'
    } catch (e) {
      lastErr = e
      await new Promise(r => setTimeout(r, 400 * attempt))
    }
  }
  throw lastErr
}

async function main() {
  if (!DRY) {
    if (!AZURE_KEY) { console.error('❌ 缺 AZURE_SPEECH_KEY'); process.exit(1) }
    if (!SERVICE)   { console.error('❌ 缺 SUPABASE_SERVICE_ROLE_KEY（Dashboard → Settings → API → service_role）'); process.exit(1) }
  }
  console.log(`\n=== 预生成印尼语发音 (${VOICE} @ ${RATE}x) ${DRY ? '[DRY RUN]' : ''} ===\n`)

  const items = await collectTexts()
  const nWords = items.filter(i => i.cat === 'words').length
  const nSents = items.filter(i => i.cat === 'sentences').length
  console.log(`\n唯一文本：${items.length} 条（words/ ${nWords}，sentences/ ${nSents}）\n`)

  let gen = 0, skip = 0, todo = 0, fail = 0, done = 0
  const total = items.length
  const queue = items.slice()

  async function worker(id) {
    while (queue.length) {
      const item = queue.shift()
      try {
        const r = await processOne(item)
        if (r === 'gen') gen++; else if (r === 'skip') skip++; else if (r === 'todo') todo++
      } catch (e) {
        fail++
        console.error(`  ✗ ${item.text.slice(0, 40)}… → ${e.message}`)
      }
      done++
      if (done % 25 === 0 || done === total) {
        process.stdout.write(`\r进度 ${done}/${total}  新生成:${gen} 已存在:${skip} ${DRY ? `待生成:${todo}` : ''} 失败:${fail}   `)
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, (_, i) => worker(i)))
  console.log('\n')
  if (DRY) {
    console.log(`📊 DRY RUN：共 ${total} 条，已存在 ${skip}，待生成 ${todo}`)
    console.log('   去掉 DRY_RUN=1 并提供 AZURE_SPEECH_KEY + SUPABASE_SERVICE_ROLE_KEY 即可真正生成。')
  } else {
    console.log(`✅ 完成：新生成 ${gen}，跳过 ${skip}，失败 ${fail}`)
  }
}

main().catch(e => { console.error('\n💥', e); process.exit(1) })
