-- BahasaBelajar 建表 SQL（在 Supabase SQL Editor 中运行）

-- 1. 词库
create table if not exists words (
  id       serial primary key,
  word     text not null unique,
  pos      text not null,
  meaning  text not null,
  examples jsonb not null default '[]',
  level    int not null default 1
);

-- 2. 语法规则
create table if not exists grammar (
  id       serial primary key,
  lesson   int not null,
  pattern  text not null,
  meaning  text not null,
  explain  text not null,
  examples jsonb not null default '[]'
);

-- 3. 学习进度（SRS）
create table if not exists learning (
  word_id        int primary key references words(id),
  stage          int not null default 1,
  status         text not null default 'reviewing',
  next_review_at date,
  last_review_at date,
  learned_at     date not null default current_date,
  correct_count  int not null default 0,
  wrong_count    int not null default 0
);

-- 4. 每日打卡
create table if not exists checkins (
  date        date primary key default current_date,
  new_learned int not null default 0,
  reviewed    int not null default 0,
  completed   int not null default 0
);

-- 5. 设置
create table if not exists settings (
  key   text primary key,
  value text not null
);
insert into settings (key, value) values ('daily_new_words', '10') on conflict do nothing;
insert into settings (key, value) values ('daily_review_limit', '100') on conflict do nothing;

-- 6. RLS 策略（anon key 可读写，单用户模式）
alter table words enable row level security;
alter table grammar enable row level security;
alter table learning enable row level security;
alter table checkins enable row level security;
alter table settings enable row level security;

create policy "public read words" on words for select using (true);
create policy "public read grammar" on grammar for select using (true);
create policy "public all learning" on learning for all using (true);
create policy "public all checkins" on checkins for all using (true);
create policy "public all settings" on settings for all using (true);
