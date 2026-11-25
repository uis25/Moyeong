-- 모두가 같이 보는 데이터: 정책 목록, 공식 공고 바로가기
-- Supabase 대시보드 > SQL Editor 에 붙여 넣고 Run (한 번만)

create table public.policies (
  id text primary key,
  sort_order int not null,                       -- 목록 기본 순서
  title text not null,
  organization text not null,
  category text[] not null default '{}',
  support_type text[] not null default '{}',
  min_age int,
  max_age int,
  age_text text,                                 -- 나이 조건 원문 (있을 때만)
  eligible_regions text[] not null default '{}',
  min_farming_years int,
  max_farming_years int,
  eligible_farmer_types text[] not null default '{}',
  requires_business_registration boolean,
  application_start date,
  application_end date,
  reg text not null default '',
  description text,
  details text[],
  details_more boolean,
  eligibility_details text[] not null default '{}',
  required_documents text[] not null default '{}',
  official_notice_url text,
  application_url text,
  source_name text not null,
  last_verified_at date not null,
  reference_links jsonb not null default '[]'    -- [{label, url}]
);

create table public.official_sources (
  id bigint generated always as identity primary key,
  sort_order int not null,
  url text not null unique,
  label text not null
);

-- 누구나 읽기만 가능. 추가·수정·삭제는 대시보드(관리자)에서만
alter table public.policies enable row level security;
alter table public.official_sources enable row level security;

create policy "누구나 정책 읽기" on public.policies
  for select to anon, authenticated using (true);
create policy "누구나 바로가기 읽기" on public.official_sources
  for select to anon, authenticated using (true);

grant select on public.policies, public.official_sources to anon, authenticated;
