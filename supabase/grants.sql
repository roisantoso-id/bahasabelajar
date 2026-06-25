-- 修复 anon 权限（在 Supabase SQL Editor 运行）
-- RLS 策略控制行级访问，但还需要 schema / 表级别的 GRANT 才能执行操作

grant usage on schema public to anon, authenticated;

-- 词库、语法：只读
grant select on words, grammar to anon, authenticated;

-- 学习进度、打卡、设置：单用户模式，可读写
grant select, insert, update, delete on learning, checkins, settings to anon, authenticated;

-- 序列（serial 主键自增需要）
grant usage, select on all sequences in schema public to anon, authenticated;
