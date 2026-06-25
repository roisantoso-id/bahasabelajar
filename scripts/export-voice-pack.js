#!/usr/bin/env node
/**
 * 批量导出印尼语单词发音包。
 *
 * 默认使用 Qwen3.5-Omni Flash + Tina 生成 wav，再用 afconvert 转成 mp3，
 * 最后打包成 zip 方便下载和分发。
 *
 * 需要环境变量：
 *   DASHSCOPE_API_KEY   DashScope / 百炼 API Key
 * 可选：
 *   DASHSCOPE_BASE_URL   默认 https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation
 *   QWEN_MODEL           默认 qwen3.5-omni-flash
 *   QWEN_VOICE           默认 Tina
 *   OUT_DIR              默认 exports/voice-pack-<timestamp>
 *   AUDIO_FORMAT         默认 mp3
 */
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const { execFileSync } = require('child_process')

const DEFAULT_WORDS = ['saya', 'belajar', 'makan', 'orang', 'rumah', 'selamat']
const DEFAULT_BASE_URL = 'https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation'

function parseArgs(argv) {
  const args = { words: null, out: null, voice: null, model: null, format: null, baseUrl: null }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    const next = () => argv[++i]
    if (a === '--words' && argv[i + 1]) args.words = next()
    else if (a === '--out' && argv[i + 1]) args.out = next()
    else if (a === '--voice' && argv[i + 1]) args.voice = next()
    else if (a === '--model' && argv[i + 1]) args.model = next()
    else if (a === '--format' && argv[i + 1]) args.format = next()
    else if (a === '--base-url' && argv[i + 1]) args.baseUrl = next()
    else if (a === '--help' || a === '-h') args.help = true
    else if (a.startsWith('--')) throw new Error(`Unknown arg: ${a}`)
  }
  return args
}

function usage() {
  console.log(`
Usage:
  DASHSCOPE_API_KEY=... node scripts/export-voice-pack.js

Options:
  --words "saya,belajar,..."   Override the default six-word list
  --out exports/my-pack        Output directory
  --voice Tina                 Voice name (default: Tina)
  --model qwen3.5-omni-flash   Model name (default: qwen3.5-omni-flash)
  --format mp3                 Final format (default: mp3)
  --base-url URL               DashScope endpoint override
`)
}

function slugify(text) {
  return String(text).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true })
}

function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n')
}

function sha256(file) {
  const hash = crypto.createHash('sha256')
  hash.update(fs.readFileSync(file))
  return hash.digest('hex')
}

function decodeBase64Buffer(value) {
  if (!value || typeof value !== 'string') return null
  const clean = value.replace(/\s+/g, '')
  if (!clean || clean.length < 16) return null
  return Buffer.from(clean, 'base64')
}

function extractAudioCandidate(obj) {
  if (!obj || typeof obj !== 'object') return null

  const paths = [
    ['output', 'audio', 'url'],
    ['output', 'audio', 'data'],
    ['output', 'audio', 'base64'],
    ['output', 'audio'],
    ['audio', 'url'],
    ['audio', 'data'],
    ['audio', 'base64'],
    ['choices', 0, 'message', 'audio', 'url'],
    ['choices', 0, 'message', 'audio', 'data'],
    ['choices', 0, 'message', 'audio', 'base64'],
    ['choices', 0, 'delta', 'audio', 'url'],
    ['choices', 0, 'delta', 'audio', 'data'],
    ['choices', 0, 'delta', 'audio', 'base64'],
  ]

  for (const pathParts of paths) {
    let cur = obj
    let ok = true
    for (const part of pathParts) {
      if (cur == null) { ok = false; break }
      cur = cur[part]
    }
    if (!ok || cur == null) continue
    if (typeof cur === 'string') return cur
    if (typeof cur === 'object') {
      if (typeof cur.url === 'string') return cur.url
      if (typeof cur.data === 'string') return cur.data
      if (typeof cur.base64 === 'string') return cur.base64
    }
  }

  // 兜底：递归找第一段很像 base64 的字符串
  const stack = [obj]
  while (stack.length) {
    const cur = stack.pop()
    if (!cur || typeof cur !== 'object') continue
    for (const v of Object.values(cur)) {
      if (typeof v === 'string') {
        const compact = v.replace(/\s+/g, '')
        if (compact.length > 64 && /^[A-Za-z0-9+/=]+$/.test(compact)) return compact
      } else if (v && typeof v === 'object') {
        stack.push(v)
      }
    }
  }
  return null
}

async function fetchAudioBytes(url, init) {
  const res = await fetch(url, init)
  if (!res.ok) {
    throw new Error(`Audio request failed ${res.status}: ${await res.text()}`)
  }
  const ct = (res.headers.get('content-type') || '').toLowerCase()
  if (ct.includes('audio/') || ct.includes('application/octet-stream')) {
    return Buffer.from(await res.arrayBuffer())
  }
  if (ct.includes('application/json')) {
    const data = await res.json()
    const cand = extractAudioCandidate(data)
    if (typeof cand === 'string' && /^https?:\/\//i.test(cand)) {
      const audioRes = await fetch(cand)
      if (!audioRes.ok) throw new Error(`Audio url fetch failed ${audioRes.status}`)
      return Buffer.from(await audioRes.arrayBuffer())
    }
    const buf = decodeBase64Buffer(cand)
    if (buf) return buf
    throw new Error(`No audio payload in JSON response: ${JSON.stringify(data).slice(0, 500)}`)
  }

  // 兼容 SSE / chunked JSON 输出
  const text = await res.text()
  const jsonBlocks = text
    .split(/\r?\n\r?\n/)
    .map(block => block.split(/\r?\n/).filter(line => line.startsWith('data:')).map(line => line.replace(/^data:\s*/, '')).join(''))
    .filter(Boolean)

  let collected = ''
  for (const block of jsonBlocks) {
    if (block === '[DONE]') continue
    try {
      const data = JSON.parse(block)
      const cand = extractAudioCandidate(data)
      if (typeof cand === 'string') collected += cand.replace(/\s+/g, '')
    } catch {
      // 忽略非 JSON 行
    }
  }
  const buf = decodeBase64Buffer(collected)
  if (buf) return buf

  throw new Error(`Unsupported response content-type ${ct || '(empty)'}; got ${text.slice(0, 300)}`)
}

function convertToMp3(srcWav, destMp3) {
  try {
    execFileSync('afconvert', [
      srcWav,
      '-o', destMp3,
      '-f', 'MPG3',
      '-c', '1',
      '-b', '64000',
      '-d', 'LEI16',
    ], { stdio: 'pipe' })
  } catch (err) {
    const msg = err && err.stderr ? err.stderr.toString() : String(err)
    throw new Error(`afconvert 转 mp3 失败: ${msg}`)
  }
}

async function synthesizeWord({ baseUrl, apiKey, model, voice, text }) {
  const payload = {
    model,
    stream: true,
    modalities: ['text', 'audio'],
    audio: { voice, format: 'wav' },
    messages: [
      {
        role: 'system',
        content: 'You are a pronunciation engine for Indonesian vocabulary drills. Speak exactly one Indonesian word, clearly and naturally, with no translation, no explanation, and no extra words.',
      },
      { role: 'user', content: text },
    ],
  }

  const init = {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  }

  const res = await fetch(baseUrl, init)
  const ct = (res.headers.get('content-type') || '').toLowerCase()

  if (!res.ok) {
    throw new Error(`DashScope failed ${res.status}: ${(await res.text()).slice(0, 500)}`)
  }

  if (ct.includes('audio/') || ct.includes('application/octet-stream')) {
    return Buffer.from(await res.arrayBuffer())
  }

  if (ct.includes('application/json')) {
    const data = await res.json()
    const cand = extractAudioCandidate(data)
    const buf = decodeBase64Buffer(cand)
    if (buf) return buf
    if (typeof cand === 'string' && /^https?:\/\//i.test(cand)) {
      const audioRes = await fetch(cand)
      if (!audioRes.ok) throw new Error(`Audio url fetch failed ${audioRes.status}`)
      return Buffer.from(await audioRes.arrayBuffer())
    }
    throw new Error(`No audio payload in JSON response: ${JSON.stringify(data).slice(0, 500)}`)
  }

  const raw = await res.text()
  const blocks = raw
    .split(/\r?\n\r?\n/)
    .map(block => block.split(/\r?\n/).filter(line => line.startsWith('data:')).map(line => line.replace(/^data:\s*/, '')).join(''))
    .filter(Boolean)

  let collected = ''
  for (const block of blocks) {
    if (block === '[DONE]') continue
    try {
      const data = JSON.parse(block)
      const cand = extractAudioCandidate(data)
      if (typeof cand === 'string') collected += cand.replace(/\s+/g, '')
    } catch {}
  }
  const buf = decodeBase64Buffer(collected)
  if (buf) return buf

  try {
    const parsed = JSON.parse(raw)
    const cand = extractAudioCandidate(parsed)
    const finalBuf = decodeBase64Buffer(cand)
    if (finalBuf) return finalBuf
    if (typeof cand === 'string' && /^https?:\/\//i.test(cand)) {
      const audioRes = await fetch(cand)
      if (!audioRes.ok) throw new Error(`Audio url fetch failed ${audioRes.status}`)
      return Buffer.from(await audioRes.arrayBuffer())
    }
  } catch {}

  throw new Error(`Unable to extract audio from response: ${raw.slice(0, 500)}`)
}

function buildManifest({ words, model, voice, baseUrl, format, outDir, files }) {
  return {
    createdAt: new Date().toISOString(),
    words,
    model,
    voice,
    baseUrl,
    format,
    files,
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (args.help) {
    usage()
    return
  }

  const apiKey = process.env.DASHSCOPE_API_KEY || ''
  if (!apiKey) throw new Error('请先设置 DASHSCOPE_API_KEY')

  const model = args.model || process.env.QWEN_MODEL || 'qwen3.5-omni-flash'
  const voice = args.voice || process.env.QWEN_VOICE || 'Tina'
  const format = (args.format || process.env.AUDIO_FORMAT || 'mp3').toLowerCase()
  const baseUrl = args.baseUrl || process.env.DASHSCOPE_BASE_URL || DEFAULT_BASE_URL
  const words = (args.words ? args.words.split(',') : DEFAULT_WORDS).map(s => s.trim()).filter(Boolean)
  if (!words.length) throw new Error('单词列表为空')

  const rootOut = args.out || process.env.OUT_DIR || path.join('exports', `voice-pack-${new Date().toISOString().replace(/[:.]/g, '-')}`)
  const outDir = path.resolve(rootOut)
  const wavDir = path.join(outDir, 'wav')
  const mp3Dir = path.join(outDir, 'mp3')
  ensureDir(wavDir)
  ensureDir(mp3Dir)

  const files = []
  for (const word of words) {
    const slug = slugify(word)
    const wavPath = path.join(wavDir, `${slug}.wav`)
    const finalPath = path.join(mp3Dir, `${slug}.mp3`)

    process.stdout.write(`→ 生成 ${word} ... `)
    const wavBuf = await synthesizeWord({ baseUrl, apiKey, model, voice, text: word })
    fs.writeFileSync(wavPath, wavBuf)

    if (format === 'mp3') {
      convertToMp3(wavPath, finalPath)
      files.push({
        word,
        wav: path.relative(outDir, wavPath),
        mp3: path.relative(outDir, finalPath),
        sha256: sha256(finalPath),
      })
      console.log('ok')
    } else {
      const otherPath = path.join(outDir, `${slug}.${format}`)
      fs.copyFileSync(wavPath, otherPath)
      files.push({
        word,
        wav: path.relative(outDir, wavPath),
        output: path.relative(outDir, otherPath),
        sha256: sha256(otherPath),
      })
      console.log('ok')
    }
  }

  const manifest = buildManifest({
    words,
    model,
    voice,
    baseUrl,
    format,
    outDir,
    files,
  })
  const manifestPath = path.join(outDir, 'manifest.json')
  writeJSON(manifestPath, manifest)

  const checksums = files.map(f => {
    const target = f.mp3 || f.output
    return `${f.sha256}  ${target}`
  }).join('\n') + '\n'
  fs.writeFileSync(path.join(outDir, 'checksums.txt'), checksums)

  const zipPath = `${outDir}.zip`
  const archiveFiles = ['manifest.json', 'checksums.txt', ...files.map(f => f.mp3 || f.output)]
  execFileSync('zip', ['-q', zipPath, ...archiveFiles], { cwd: outDir, stdio: 'pipe' })

  console.log('')
  console.log(`完成：${outDir}`)
  console.log(`压缩包：${zipPath}`)
  console.log(`清单：${manifestPath}`)
}

main().catch(err => {
  console.error(`错误: ${err.message}`)
  process.exit(1)
})
