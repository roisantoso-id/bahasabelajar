-- Qwen 每用户每日用量表（防盗刷上限用）。在 SQL Editor 运行一次。
-- 只有边缘函数（service role）会写它；anon/登录用户都碰不到。

create table if not exists qwen_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  day     date not null,
  count   int  not null default 0,
  primary key (user_id, day)
);

alter table qwen_usage enable row level security;
-- 不给 anon / authenticated 任何策略：他们无法读写。
-- 边缘函数用 service role key，绕过 RLS，正常读写。
