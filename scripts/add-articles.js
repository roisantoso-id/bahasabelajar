// 上传新文章到 Supabase，自动跳过同名文章（按 title 去重）
// 用法：node scripts/add-articles.js <json文件路径>
// JSON 格式：[{title, title_zh, level, category, summary, sentences:[{id, zh, note}]}, ...]
const fs = require('fs')
const URL = 'https://bzdelpmcewjdvmgyafux.supabase.co'
const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6ZGVscG1jZXdqZHZtZ3lhZnV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMjY1MDksImV4cCI6MjA4ODkwMjUwOX0.x_D0VGGmXCY9rueAh0lV4f7r9wOJIGCHs19w5S2BNpg'
function loadKey() {
  if (process.env.SUPABASE_SERVICE_KEY) return process.env.SUPABASE_SERVICE_KEY
  try {
    const env = require('fs').readFileSync(require('path').join(__dirname, '..', '.env'), 'utf8')
    const m = env.match(/^SUPABASE_SERVICE_KEY=(.+)$/m)
    if (m) return m[1].trim()
  } catch (e) {}
  try { return require('fs').readFileSync(require('path').join(__dirname, '..', 'supabase', 'service-key'), 'utf8').trim() } catch (e) {}
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
  if (!file) throw new Error('请提供 JSON 文件路径')
  const incoming = JSON.parse(fs.readFileSync(file, 'utf8'))

  for (const a of incoming) {
    if (!a.title || !a.title_zh || !Array.isArray(a.sentences)) throw new Error(`文章缺字段: ${a.title || '?'}`)
    if (![1,2,3].includes(a.level)) a.level = 3
    if (!a.category) a.category = '阅读'
    for (const s of a.sentences) if (!s.id || !s.zh) throw new Error(`「${a.title}」有句子缺 id/zh`)
  }

  const existing = await getJSON(`${URL}/rest/v1/articles?select=title`, { Range: '0-9999' })
  const have = new Set(existing.map(r => r.title))
  const fresh = incoming.filter(a => !have.has(a.title))
  console.log(`收到 ${incoming.length} 篇，新文章 ${fresh.length}，跳过 ${incoming.length - fresh.length}（同名已存在）`)
  if (!fresh.length) return console.log('无新文章可上传。')

  // articles 表 RLS 允许 anon 写入；service_role 可能缺 sequence grant，优先 KEY，403 时降级 ANON
  let res = await fetch(`${URL}/rest/v1/articles`, {
    method: 'POST',
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: JSON.stringify(fresh)
  })
  if (res.status === 403) {
    res = await fetch(`${URL}/rest/v1/articles`, {
      method: 'POST',
      headers: { apikey: ANON, Authorization: `Bearer ${ANON}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
      body: JSON.stringify(fresh)
    })
  }
  if (!res.ok) throw new Error(`上传失败 ${res.status}: ${await res.text()}`)
  console.log(`✓ 上传 ${JSON.parse(await res.text()).length} 篇新文章`)

  const total = await getJSON(`${URL}/rest/v1/articles?select=count`, { Prefer: 'count=exact', Range: '0-0' })
  console.log(`文章总数: ${total[0].count}`)
})().catch(e => { console.error('错误:', e.message); process.exit(1) })
