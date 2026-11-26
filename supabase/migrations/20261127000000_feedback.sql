-- 의견 남기기(고객의 소리): 방문자는 보내기만, 팀원은 대시보드에서 확인
-- Supabase 대시보드 > SQL Editor 에 붙여 넣고 Run (한 번만)

create table public.feedback (
  id bigint generated always as identity primary key,
  rating int not null check (rating between 1 and 4),          -- 만족도 1(😞)~4(😄)
  type text not null check (type in ('불편해요', '이런 기능 원해요', '좋았어요')),
  content text not null check (char_length(content) between 1 and 500),
  view text,                                     -- 남긴 화면 (home · list · cal · fav · rec)
  policy_id text,                                -- 상세를 펼친 정책 id (있을 때만)
  device text,                                   -- mobile · desktop (화면 너비 720px 기준)
  author_id text,                                -- 이 기기의 익명 id (userService)
  created_at timestamptz not null default now()
);

-- 누구나 보내기만 가능. 읽기·수정·삭제는 대시보드(팀원)에서만
alter table public.feedback enable row level security;

create policy "누구나 의견 보내기" on public.feedback
  for insert to anon, authenticated with check (true);

grant insert on public.feedback to anon, authenticated;
