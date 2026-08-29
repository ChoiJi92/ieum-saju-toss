-- 유료 리포트 저장 테이블.
--
-- 키는 토스 IAP 의 order_id. 토스 로그인을 안 한 유저도 결제는 가능하므로
-- user_key(getAnonymousKey 해시)는 있으면 담고 없으면 null 로 둔다.
-- "이 사람이 뭘 샀는가"의 최종 근거는 우리 DB가 아니라 토스의
-- IAP.getCompletedOrRefundedOrders() 다. 이 테이블은 생성물 저장소일 뿐.

create table if not exists public.reports (
  order_id      text primary key,
  sku           text not null,
  user_key      text,
  profile_name  text not null default '고객',
  myeongsik     jsonb not null,

  -- 생성 결과
  status        text not null default 'pending'
                  check (status in ('pending', 'generating', 'done', 'failed')),
  content       text,
  model         text,
  input_tokens  int,
  output_tokens int,
  error         text,

  created_at    timestamptz not null default now(),
  completed_at  timestamptz
);

create index if not exists reports_user_key_idx on public.reports (user_key);
-- 일일 생성 상한 조회용 (status='done' + completed_at 범위)
create index if not exists reports_completed_at_idx on public.reports (completed_at)
  where status = 'done';

-- RLS 켜두되 정책은 만들지 않는다.
-- => anon/authenticated 키로는 아무것도 못 읽는다.
--    Edge Function 이 service_role 로만 접근한다 (service_role 은 RLS 우회).
alter table public.reports enable row level security;

comment on table public.reports is '유료 사주 리포트. order_id 당 1건, 재생성 없이 저장본 재사용.';
comment on column public.reports.status is 'pending=주문만 기록됨 / generating=생성 중 / done=완료 / failed=실패(재시도 가능)';
comment on column public.reports.user_key is 'getAnonymousKey() 해시. 토스 로그인 없이도 얻어지며, 없을 수 있음.';
