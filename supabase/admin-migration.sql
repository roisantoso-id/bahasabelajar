-- ============================================================
-- BahasaBelajar：管理员 + 用户停用（soft-ban）迁移
-- 在 Supabase SQL Editor 整段运行一次。
--
-- 做了什么：
--   1. profiles 加 is_admin / banned / email 三列
--   2. is_admin() 安全函数（SECURITY DEFINER，避免 RLS 递归）
--   3. 回填现有用户的 email（从 auth.users 取）
--   4. 把你本人设成管理员（改下面那行的邮箱为你的「app 登录邮箱」）
--   5. RLS：管理员可读/改所有 profiles（用于用户管理面板）
--   6. 防提权触发器：普通用户改不了自己的 is_admin / banned
--
-- 安全模型：
--   - 「禁止登录」是软禁用：banned=true 时前端登录后立即 signOut + 提示。
--     纯静态站无法用 service_role 真正禁用 auth 账号（key 不能进前端），
--     对朋友间自用足够。RLS 保证普通用户无法给自己提权或解禁。
-- ============================================================

-- 1) 加列
alter table profiles add column if not exists is_admin boolean not null default false;
alter table profiles add column if not exists banned   boolean not null default false;
alter table profiles add column if not exists email    text;

-- 2) is_admin()：SECURITY DEFINER 绕过 RLS 读 profiles，避免「策略查自己表」递归
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce((select is_admin from profiles where user_id = auth.uid()), false)
$$;
grant execute on function public.is_admin() to authenticated, anon;

-- 3) 回填 email（SQL Editor 以 postgres 运行，可读 auth.users）
update profiles p
   set email = u.email
  from auth.users u
 where u.id = p.user_id
   and (p.email is null or p.email = '');

-- 4) 把你本人设成管理员
--    ⚠️ 改成你的「app 登录邮箱」（不一定等于 Claude 账号邮箱）
update profiles
   set is_admin = true
 where user_id = (select id from auth.users where email = 'kemayoranhabibi761@gmail.com');

-- 5) RLS：管理员可读/改所有 profiles（与已有「own profile」策略 OR 共存）
drop policy if exists "admin read profiles"   on profiles;
drop policy if exists "admin update profiles" on profiles;
create policy "admin read profiles"   on profiles for select using (public.is_admin());
create policy "admin update profiles" on profiles for update using (public.is_admin()) with check (public.is_admin());

-- 6) 防提权：普通登录用户即便能改自己的 profile，也改不动 is_admin / banned
--    auth.uid() is null = SQL Editor / 后台特权上下文，放行（方便以后用 SQL 再发管理员）
create or replace function public.protect_admin_cols()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    new.is_admin := old.is_admin;
    new.banned   := old.banned;
  end if;
  return new;
end
$$;

drop trigger if exists trg_protect_admin_cols on profiles;
create trigger trg_protect_admin_cols
  before update on profiles
  for each row execute function public.protect_admin_cols();

-- 验证：
--   select email, is_admin, banned from profiles order by created_at;
--   select public.is_admin();   -- 你自己跑应为 true（需在已登录的会话；SQL Editor 里是 false 正常）
