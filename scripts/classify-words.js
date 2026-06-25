// 给现有 words 批量归类领域(topic)，生成 supabase/words-topics.sql。
// anon 无 update 权限，所以不直接改库，而是产出 SQL 让你在 SQL Editor 跑一次。
// 用法：node scripts/classify-words.js
//   产出：supabase/words-topics.sql（按 topic 分组的 update ... where id in(...)）
const fs = require('fs')
const path = require('path')
const { TOPICS, classify } = require('./classify-topic.js')

const URL = 'https://bzdelpmcewjdvmgyafux.supabase.co'
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6ZGVscG1jZXdqZHZtZ3lhZnV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMjY1MDksImV4cCI6MjA4ODkwMjUwOX0.x_D0VGGmXCY9rueAh0lV4f7r9wOJIGCHs19w5S2BNpg'

;(async () => {
  const r = await fetch(`${URL}/rest/v1/words?select=id,word,pos,meaning&order=id&limit=5000`, { headers: { apikey: KEY } })
  if (!r.ok) throw new Error(`拉取失败 ${r.status}: ${await r.text()}`)
  const words = await r.json()
  console.log(`拉到 ${words.length} 个词`)

  const byTopic = {}
  TOPICS.forEach(t => byTopic[t] = [])
  words.forEach(w => byTopic[classify(w.word, w.meaning, w.pos)].push(w.id))

  let sql = '-- 由 scripts/classify-words.js 自动生成：给现有词批量归类领域\n'
  sql += '-- 先跑 supabase/words-topic-schema.sql 加好 topic 列，再在 SQL Editor 跑本文件。\n\n'
  for (const t of TOPICS) {
    const ids = byTopic[t]
    if (!ids.length) continue
    console.log(String(ids.length).padStart(4), t)
    sql += `update words set topic='${t}' where id in (${ids.join(',')});\n`
  }
  sql += '\n-- 验证： select topic, count(*) from words group by topic order by count(*) desc;\n'

  const out = path.join(__dirname, '..', 'supabase', 'words-topics.sql')
  fs.writeFileSync(out, sql)
  console.log(`\n✓ 已写出 ${out}`)
})().catch(e => { console.error('错误:', e.message); process.exit(1) })
