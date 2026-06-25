-- 让 routine 能往词库和语法表写入（在 Supabase SQL Editor 运行一次）
-- words / grammar 之前是只读，这里补上 insert 策略与权限

create policy "public write words"   on words   for insert with check (true);
create policy "public write grammar" on grammar for insert with check (true);

grant insert on words, grammar to anon, authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;
