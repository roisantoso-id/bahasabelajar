-- ============================================================
-- 单词本：给 words 加「领域」(topic) 列
-- 在 Supabase SQL Editor 运行一次。
--
-- 之后再运行 scripts/classify-words.js 生成的 supabase/words-topics.sql
-- 给现有 611 个词批量归类（生成的是一堆 update ... where id in(...)）。
-- 新加的词由 scripts/add-words.js 自动按 classify-topic.js 归类。
-- ============================================================

alter table words add column if not exists topic text;

-- 可选索引：按领域筛选更快
create index if not exists idx_words_topic on words(topic);

-- 验证：
--   select topic, count(*) from words group by topic order by count(*) desc;
