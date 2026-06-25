-- 安全加固：撤销匿名(anon)对共享表的写权限，防止有人用公开 anon key 灌垃圾/篡改内容
-- 背景：之前为了让 routine 上传，给了 anon insert。现在收紧。
--
-- 说明：words/articles 由每日 routine 写入。撤销 anon 后，routine 需改用 service_role key
--       （见 scripts/ 的改动 + 本地 supabase/service-key 文件）。grammar/culture/settings
--       routine 不写，可直接撤销，需要时在 SQL Editor 手动加。

-- ===== 第一段：立即安全（grammar / culture / settings，routine 不写它们）=====
drop policy if exists "public write grammar" on grammar;
drop policy if exists "public write culture"  on culture;
revoke insert, update, delete on grammar  from anon;
revoke insert, update, delete on culture   from anon;
revoke insert, update, delete on settings  from anon;
revoke select on settings from anon;   -- settings 也不需要匿名读

-- ===== 第二段：words / articles —— 撤销 anon 写，改成「登录用户 + service_role」 =====
-- 跑这段【前】，先确保 routine 脚本已改用 service_role key（否则 routine 会写不进去）。
drop policy if exists "public write words"    on words;
drop policy if exists "public write articles" on articles;
revoke insert, update, delete on words    from anon;
revoke insert, update, delete on articles from anon;
-- 保留登录用户给 words 写（前端「收藏到词库」用），articles 仅 routine(service_role) 写
create policy "auth insert words" on words for insert with check (auth.role() = 'authenticated');
grant insert on words to authenticated;
-- service_role 绕过 RLS，routine 用它照常写 words/articles，无需额外策略。

-- 验证（anon 应全部 42501 被拒）：
--   curl -X POST .../rest/v1/words -H "apikey: <anon>" -d '{}'   -> 应 401/42501
