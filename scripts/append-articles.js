// 上传 seed/articles-new.json 到 Supabase（追加，不清空），并合并进 articles.json
const fs = require('fs')
const path = require('path')
const URL = 'https://bzdelpmcewjdvmgyafux.supabase.co'
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6ZGVscG1jZXdqZHZtZ3lhZnV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMjY1MDksImV4cCI6MjA4ODkwMjUwOX0.x_D0VGGmXCY9rueAh0lV4f7r9wOJIGCHs19w5S2BNpg'
const root = path.join(__dirname, '..')

;(async () => {
  const neu = JSON.parse(fs.readFileSync(path.join(root, 'seed/articles-new.json'), 'utf8'))
  const res = await fetch(`${URL}/rest/v1/articles`, {
    method: 'POST',
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: JSON.stringify(neu)
  })
  const t = await res.text()
  if (!res.ok) throw new Error(`${res.status}: ${t}`)
  console.log('✓ 上传', JSON.parse(t).length, '篇新文章')

  const all = JSON.parse(fs.readFileSync(path.join(root, 'seed/articles.json'), 'utf8')).concat(neu)
  fs.writeFileSync(path.join(root, 'seed/articles.json'), JSON.stringify(all, null, 2) + '\n')
  fs.unlinkSync(path.join(root, 'seed/articles-new.json'))
  console.log('✓ articles.json 现有', all.length, '篇')

  const c = await fetch(`${URL}/rest/v1/articles?select=count`, { headers: { apikey: KEY, Prefer: 'count=exact', Range: '0-0' } })
  console.log('Supabase articles 总数:', (await c.json())[0].count)
})().catch(e => { console.error('错误:', e.message); process.exit(1) })
