-- ============================================================
-- 内容架构升级 · 第1步地基：课程主线 + 词按课/词频/来源分类
-- 在 SQL Editor 运行一次。
-- ============================================================

-- 1) 课程表
create table if not exists lessons (
  no         int primary key,          -- 第几课
  title      text not null,            -- 中文标题
  title_id   text,                     -- 印尼语标题
  summary    text,                     -- 简介
  created_at timestamptz not null default now()
);

-- 2) words / articles / grammar 加字段
--    source 默认 'routine'：以后 routine 自动插入的词无需改脚本就正确归类
alter table words    add column if not exists lesson int;
alter table words    add column if not exists freq   int;
alter table words    add column if not exists source text not null default 'routine';
alter table articles add column if not exists lesson int;
alter table articles add column if not exists source text not null default 'routine';
alter table grammar  add column if not exists source text not null default 'textbook';

-- 3) 归类现有数据（按 id 区间，已核对边界）
--    1-500 = 基础词库 core；501-553 = 课本第2课 textbook；554+ = routine 拓展（保持默认）
update words set source='core',     lesson=null where id <= 500;
update words set source='textbook', lesson=2    where id between 501 and 553;
-- 词频暂用 id 作近似（越早=越基础），后续可用真实词频表细化
update words set freq = id where freq is null;

-- 现有 6 篇文章都是 routine 生成的拓展
update articles set source='routine', lesson=null;
-- 第2课语法
update grammar set source='textbook' where lesson = 2;

-- 4) 录入课程（第1课先占位，等课本内容；第2课已有）
insert into lessons (no, title, title_id, summary) values
  (1, '第一课', 'Pelajaran 1', '待录入：把课本第一课的词 / 语法 / 对话补进来'),
  (2, '第二课', 'Pelajaran 2', '印尼的戏剧与文化——千岛之国、皮影戏 wayang、桑迪瓦拉')
on conflict (no) do nothing;

-- 5) RLS + 权限（lessons 公开只读；登录用户/后台可写）
alter table lessons enable row level security;
create policy "public read lessons" on lessons for select using (true);
create policy "auth write lessons"  on lessons for insert with check (auth.role() = 'authenticated');
create policy "auth update lessons" on lessons for update using (auth.role() = 'authenticated');
grant select on lessons to anon, authenticated;
grant insert, update on lessons to authenticated;

-- 验证：
--   select source, count(*) from words group by source;   -- core / textbook / routine 三类
--   select * from lessons order by no;
