// 把 seed/articles.json 和 seed/culture.json 上传到 Supabase
const fs = require('fs')
const path = require('path')

const URL = 'https://bzdelpmcewjdvmgyafux.supabase.co'
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6ZGVscG1jZXdqZHZtZ3lhZnV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMjY1MDksImV4cCI6MjA4ODkwMjUwOX0.x_D0VGGmXCY9rueAh0lV4f7r9wOJIGCHs19w5S2BNpg'
const root = path.join(__dirname, '..')

async function post(table, rows) {
  const res = await fetch(`${URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      apikey: KEY, Authorization: `Bearer ${KEY}`,
      'Content-Type': 'application/json', Prefer: 'return=representation'
    },
    body: JSON.stringify(rows)
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`${table} ${res.status}: ${text}`)
  return JSON.parse(text)
}

async function exists(table) {
  const res = await fetch(`${URL}/rest/v1/${table}?select=count`, {
    headers: { apikey: KEY, Prefer: 'count=exact', Range: '0-0' }
  })
  if (!res.ok) throw new Error(`${table} 不可访问(表是否已建?) ${res.status}: ${await res.text()}`)
  return (await res.json())[0].count
}

;(async () => {
  const articles = JSON.parse(fs.readFileSync(path.join(root, 'seed/articles.json'), 'utf8'))
  const culture  = JSON.parse(fs.readFileSync(path.join(root, 'seed/culture.json'), 'utf8'))

  const aCount = await exists('articles')
  const cCount = await exists('culture')
  console.log(`当前 articles=${aCount}, culture=${cCount}`)

  if (aCount === 0) {
    const r = await post('articles', articles)
    console.log(`✓ 上传 ${r.length} 篇文章`)
  } else {
    console.log('articles 已有数据，跳过（避免重复）')
  }

  if (cCount === 0) {
    const r = await post('culture', culture)
    console.log(`✓ 上传 ${r.length} 张文化卡`)
  } else {
    console.log('culture 已有数据，跳过（避免重复）')
  }
  console.log('完成。')
})().catch(e => { console.error('错误:', e.message); process.exit(1) })
