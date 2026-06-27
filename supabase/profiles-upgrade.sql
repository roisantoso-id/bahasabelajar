-- 用户个人信息升级：头像 + 性别
-- 在 Supabase SQL Editor 中运行此文件

-- 1. profiles 表新增字段
alter table public.profiles
  add column if not exists gender     text check (gender in ('male', 'female', 'private')),
  add column if not exists avatar_url text;

-- 2. Storage 头像存储桶（public = 图片可直接访问，无需 auth）
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- 3. Storage 策略：任何人可读；登录用户可上传/覆盖自己的头像
create policy "avatars_public_read"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "avatars_auth_insert"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.role() = 'authenticated');

create policy "avatars_owner_update"
  on storage.objects for update
  using (bucket_id = 'avatars' and owner = auth.uid());

create policy "avatars_owner_delete"
  on storage.objects for delete
  using (bucket_id = 'avatars' and owner = auth.uid());
