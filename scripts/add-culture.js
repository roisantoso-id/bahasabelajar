// 上传新文化卡到 Supabase，自动跳过同名（按 title 去重）
// 用法：node scripts/add-culture.js <json文件路径>
// JSON 格式：[{title, title_id, category, emoji, body, terms:[{word, meaning}]}, ...]
const fs = require('fs')
const path = require('path')
const URL = 'https://bzdelpmcewjdvmgyafux.supabase.co'
const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6ZGVscG1jZXdqZHZtZ3lhZnV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMjY1MDksImV4cCI6MjA4ODkwMjUwOX0.x_D0VGGmXCY9rueAh0lV4f7r9wOJIGCHs19w5S2BNpg'
function loadKey() {
  if (process.env.SUPABASE_SERVICE_KEY) return process.env.SUPABASE_SERVICE_KEY
  try { return fs.readFileSync(path.join(__dirname, '..', 'supabase', 'service-key'), 'utf8').trim() } catch (e) {}
  return ANON
}
const KEY = loadKey()

async function getJSON(url, headers) {
  const r = await fetch(url, { headers: { apikey: KEY, ...headers } })
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`)
  return r.json()
}

;(async () => {
  const file = process.argv[2]
  if (!file) throw new Error('请提供 JSON 文件路径，例：node scripts/add-culture.js seed/culture-2.json')
  const incoming = JSON.parse(fs.readFileSync(file, 'utf8'))

  for (const c of incoming) {
    if (!c.title || !c.category || !c.body) throw new Error(`文化卡缺字段(title/category/body): ${c.title || '?'}`)
    if (!c.emoji) c.emoji = '🇮🇩'
    if (!Array.isArray(c.terms)) c.terms = []
    for (const t of c.terms) if (!t.word || !t.meaning) throw new Error(`「${c.title}」有词条缺 word/meaning`)
  }

  const existing = await getJSON(`${URL}/rest/v1/culture?select=title`, { Range: '0-9999' })
  const have = new Set(existing.map(r => r.title))
  const fresh = incoming.filter(c => !have.has(c.title))
  console.log(`收到 ${incoming.length} 张，新卡 ${fresh.length}，跳过 ${incoming.length - fresh.length}（同名已存在）`)
  if (!fresh.length) return console.log('无新文化卡可上传。')

  const res = await fetch(`${URL}/rest/v1/culture`, {
    method: 'POST',
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: JSON.stringify(fresh)
  })
  if (!res.ok) throw new Error(`上传失败 ${res.status}: ${await res.text()}`)
  console.log(`✓ 上传 ${JSON.parse(await res.text()).length} 张新文化卡`)

  const total = await getJSON(`${URL}/rest/v1/culture?select=count`, { Prefer: 'count=exact', Range: '0-0' })
  console.log(`文化卡总数: ${total[0].count}`)
})().catch(e => { console.error('错误:', e.message); process.exit(1) })
