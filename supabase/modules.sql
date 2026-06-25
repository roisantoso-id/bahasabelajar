-- 新增模块：印尼文章（逐句翻译）+ 印尼文化
-- 在 Supabase SQL Editor 运行一次（anon key 无法建表，需在此创建）

-- 1. 文章（逐句对照）
create table if not exists articles (
  id        serial primary key,
  title     text not null,                 -- 印尼语标题
  title_zh  text not null,                 -- 中文标题
  level     int  not null default 1,       -- 1 入门 / 2 初级 / 3 中级
  category  text not null default '阅读',
  summary   text,                          -- 中文导读
  sentences jsonb not null default '[]'    -- [{id: 印尼语句, zh: 中文, note: 注释}]
);

-- 2. 文化卡片
create table if not exists culture (
  id        serial primary key,
  title     text not null,                 -- 中文标题
  title_id  text,                          -- 印尼语标题
  category  text not null,                 -- 艺术/饮食/节日/语言/社会 等
  emoji     text not null default '🇮🇩',
  body      text not null,                 -- 中文正文
  terms     jsonb not null default '[]'    -- [{word: 印尼语, meaning: 中文}]
);

-- 3. RLS + 权限（anon 可读；为方便我上传内容，开放 insert）
alter table articles enable row level security;
alter table culture  enable row level security;

create policy "public read articles"  on articles for select using (true);
create policy "public write articles" on articles for insert with check (true);
create policy "public read culture"   on culture  for select using (true);
create policy "public write culture"  on culture  for insert with check (true);

grant select, insert on articles, culture to anon, authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;
