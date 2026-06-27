-- vocab_exam_bank 写入权限（给 routine 脚本用 anon key 上传题目）
-- 在 Supabase SQL Editor 执行一次

-- 允许 anon 插入（routine 脚本走 anon key）
grant insert on table public.vocab_exam_bank to anon;
grant usage, select on sequence public.vocab_exam_bank_id_seq to anon;

-- RLS 策略：允许 anon 插入（grant 不够，RLS 开着还得有 policy）
drop policy if exists "vocab_exam_bank_anon_insert" on public.vocab_exam_bank;
create policy "vocab_exam_bank_anon_insert"
  on public.vocab_exam_bank
  for insert
  with check (true);

-- 同时确保 vocab_exam_results 表已建好（如果没跑过 vocab-exam-results.sql）
-- 参见 supabase/vocab-exam-results.sql
