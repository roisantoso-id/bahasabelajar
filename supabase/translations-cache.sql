-- 翻译缓存表：划词翻译过的词/短语存这里，下次直接读，不再调 Qwen（省钱+秒出）
-- 在 SQL Editor 运行一次。

create table if not exists translations (
  src        text primary key,              -- 原文（印尼语，统一小写）
  zh         text not null,                 -- 中文翻译
  engine     text,                          -- 来源：'qwen-mt' 等
  created_at timestamptz not null default now()
);

alter table translations enable row level security;

-- 所有人可读缓存；登录用户可写入新缓存（写不是敏感操作，且 app 已要求登录）
create policy "public read translations"  on translations for select using (true);
create policy "auth insert translations"  on translations for insert with check (auth.role() = 'authenticated');

grant select on translations to anon, authenticated;
grant insert on translations to authenticated;
