// 上传新词到 Supabase，自动跳过已存在的词（按 word 去重）
// 用法：node scripts/add-words.js <json文件路径>
// JSON 格式：[{word, pos, meaning, level, examples:[{id, zh}]}, ...]
const fs = require('fs')
const path = require('path')
const URL = 'https://bzdelpmcewjdvmgyafux.supabase.co'
// 优先用 service_role key（本地 env 或 supabase/service-key 文件，不入公开仓库），回退 anon
const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6ZGVscG1jZXdqZHZtZ3lhZnV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMjY1MDksImV4cCI6MjA4ODkwMjUwOX0.x_D0VGGmXCY9rueAh0lV4f7r9wOJIGCHs19w5S2BNpg'
function loadKey() {
  if (process.env.SUPABASE_SERVICE_KEY) return process.env.SUPABASE_SERVICE_KEY
  try { return require('fs').readFileSync(require('path').join(__dirname, '..', 'supabase', 'service-key'), 'utf8').trim() } catch (e) {}
  return ANON
}
const KEY = loadKey()

const POS = ['pron.','n.','v.','adj.','adv.','prep.','conj.','interj.','num.','短语']

async function getJSON(url, headers) {
  const r = await fetch(url, { headers: { apikey: KEY, ...headers } })
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`)
  return r.json()
}

;(async () => {
  const file = process.argv[2]
  if (!file) throw new Error('请提供 JSON 文件路径')
  const incoming = JSON.parse(fs.readFileSync(file, 'utf8'))

  // 校验
  for (const w of incoming) {
    if (!w.word || !w.pos || !w.meaning) throw new Error(`词条缺字段: ${JSON.stringify(w)}`)
    if (!POS.includes(w.pos)) throw new Error(`非法 pos「${w.pos}」(${w.word})，合法值: ${POS.join(' ')}`)
    if (![1,2,3].includes(w.level)) w.level = 2
    if (!Array.isArray(w.examples)) w.examples = []
  }

  // 拉现有词去重
  const existing = await getJSON(`${URL}/rest/v1/words?select=word`, { Range: '0-19999' })
  const have = new Set(existing.map(r => r.word.toLowerCase()))
  const seen = new Set()
  const fresh = incoming.filter(w => {
    const k = w.word.toLowerCase()
    if (have.has(k) || seen.has(k)) return false
    seen.add(k); return true
  })
  const skipped = incoming.length - fresh.length
  console.log(`收到 ${incoming.length} 词，去重后新词 ${fresh.length}，跳过 ${skipped}（已存在/重复）`)
  if (!fresh.length) return console.log('无新词可上传。')

  const res = await fetch(`${URL}/rest/v1/words`, {
    method: 'POST',
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: JSON.stringify(fresh)
  })
  if (!res.ok) throw new Error(`上传失败 ${res.status}: ${await res.text()}`)
  const inserted = JSON.parse(await res.text())
  console.log(`✓ 上传 ${inserted.length} 个新词`)

  const total = await getJSON(`${URL}/rest/v1/words?select=count`, { Prefer: 'count=exact', Range: '0-0' })
  console.log(`词库总数: ${total[0].count}`)
})().catch(e => { console.error('错误:', e.message); process.exit(1) })
