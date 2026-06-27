-- 排行榜 RPC 函数（security definer 绕过 RLS 做跨用户聚合）
-- 在 Supabase SQL Editor 执行一次

create or replace function public.get_leaderboard()
returns json
language plpgsql
security definer
as $$
declare
  result json;
begin
  select json_build_object(
    'exam', (
      select coalesce(json_agg(row_to_json(t)), '[]'::json)
      from (
        select r.user_id,
               coalesce(p.display_name, '同学') as name,
               p.avatar_url, p.gender,
               r.estimate, r.level_code, r.level_name
        from (
          select distinct on (user_id)
                 user_id, estimate, level_code, level_name
          from vocab_exam_results
          order by user_id, estimate desc
        ) r
        left join profiles p on p.user_id = r.user_id
        order by r.estimate desc
        limit 50
      ) t
    ),
    'streak', (
      select coalesce(json_agg(row_to_json(t)), '[]'::json)
      from (
        with user_dates as (
          select user_id, date from checkins where completed = 1
        ),
        numbered as (
          select user_id, date,
                 date - (row_number() over (partition by user_id order by date))::int as grp
          from user_dates
        ),
        current_streaks as (
          select user_id, count(*) as streak
          from numbered
          group by user_id, grp
          having max(date) >= current_date - 1
        ),
        best as (
          select distinct on (user_id) user_id, streak
          from current_streaks
          order by user_id, streak desc
        )
        select b.user_id,
               coalesce(p.display_name, '同学') as name,
               p.avatar_url, p.gender,
               b.streak
        from best b
        left join profiles p on p.user_id = b.user_id
        order by b.streak desc
        limit 50
      ) t
    ),
    'words', (
      select coalesce(json_agg(row_to_json(t)), '[]'::json)
      from (
        select l.user_id,
               coalesce(p.display_name, '同学') as name,
               p.avatar_url, p.gender,
               count(*) as words
        from learning l
        left join profiles p on p.user_id = l.user_id
        group by l.user_id, p.display_name, p.avatar_url, p.gender
        order by count(*) desc
        limit 50
      ) t
    )
  ) into result;

  return result;
end;
$$;

grant execute on function public.get_leaderboard() to anon, authenticated;
