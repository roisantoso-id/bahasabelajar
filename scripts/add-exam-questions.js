// 上传测评题目到 Supabase vocab_exam_bank，按 prompt 去重
// 用法：node scripts/add-exam-questions.js <json文件路径>
// JSON 格式：[{section, difficulty, prompt, options, answer, explain, passage_title?, passage_text?, sort_order?}, ...]
const fs = require('fs')
const URL = 'https://bzdelpmcewjdvmgyafux.supabase.co'
const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6ZGVscG1jZXdqZHZtZ3lhZnV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMjY1MDksImV4cCI6MjA4ODkwMjUwOX0.x_D0VGGmXCY9rueAh0lV4f7r9wOJIGCHs19w5S2BNpg'
function loadKey() {
  if (process.env.SUPABASE_SERVICE_KEY) return process.env.SUPABASE_SERVICE_KEY
  try {
    const env = fs.readFileSync(require('path').join(__dirname, '..', '.env'), 'utf8')
    const m = env.match(/^SUPABASE_SERVICE_KEY=(.+)$/m)
    if (m) return m[1].trim()
  } catch (e) {}
  try { return fs.readFileSync(require('path').join(__dirname, '..', 'supabase', 'service-key'), 'utf8').trim() } catch (e) {}
  return ANON
}
const KEY = loadKey()

const SECTIONS = ['word', 'sentence', 'reading']
const DIFFICULTIES = ['easy', 'medium', 'hard']

;(async () => {
  const file = process.argv[2]
  if (!file) throw new Error('请提供 JSON 文件路径')
  const incoming = JSON.parse(fs.readFileSync(file, 'utf8'))

  for (const q of incoming) {
    if (!SECTIONS.includes(q.section)) throw new Error(`非法 section「${q.section}」: ${q.prompt}`)
    if (!DIFFICULTIES.includes(q.difficulty)) throw new Error(`非法 difficulty「${q.difficulty}」: ${q.prompt}`)
    if (!q.prompt || !q.answer) throw new Error(`缺 prompt/answer: ${JSON.stringify(q)}`)
    if (!Array.isArray(q.options) || q.options.length < 2) throw new Error(`options 需至少 2 项: ${q.prompt}`)
    if (!q.options.includes(q.answer)) throw new Error(`answer 不在 options 里: ${q.prompt}`)
    q.sort_order = q.sort_order || 1
    q.active = q.active !== false
    q.explain = q.explain || ''
    q.passage_title = q.passage_title || null
    q.passage_text = q.passage_text || null
  }

  // 拉现有题目去重（按 prompt）
  const res0 = await fetch(`${URL}/rest/v1/vocab_exam_bank?select=prompt`, {
    headers: { apikey: KEY, Range: '0-99999' }
  })
  if (!res0.ok) throw new Error(`拉取现有题目失败: ${res0.status} ${await res0.text()}`)
  const existing = await res0.json()
  const have = new Set(existing.map(r => r.prompt))

  const seen = new Set()
  const fresh = incoming.filter(q => {
    if (have.has(q.prompt) || seen.has(q.prompt)) return false
    seen.add(q.prompt)
    return true
  })
  const skipped = incoming.length - fresh.length
  console.log(`收到 ${incoming.length} 题，去重后新题 ${fresh.length}，跳过 ${skipped}`)
  if (!fresh.length) return console.log('无新题可上传。')

  let res = await fetch(`${URL}/rest/v1/vocab_exam_bank`, {
    method: 'POST',
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: JSON.stringify(fresh)
  })
  if (res.status === 403) {
    res = await fetch(`${URL}/rest/v1/vocab_exam_bank`, {
      method: 'POST',
      headers: { apikey: ANON, Authorization: `Bearer ${ANON}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
      body: JSON.stringify(fresh)
    })
  }
  if (!res.ok) throw new Error(`上传失败 ${res.status}: ${await res.text()}`)
  const inserted = JSON.parse(await res.text())
  console.log(`✓ 上传 ${inserted.length} 道新题`)

  const total = await fetch(`${URL}/rest/v1/vocab_exam_bank?select=count`, {
    headers: { apikey: KEY, Prefer: 'count=exact', Range: '0-0' }
  })
  const ct = await total.json()
  console.log(`题库总数: ${ct[0]?.count ?? '?'}`)
})().catch(e => { console.error('错误:', e.message); process.exit(1) })
