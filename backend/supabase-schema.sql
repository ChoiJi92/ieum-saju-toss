-- 이음사주 유저 상태 동기화 테이블
-- 실행 위치: Supabase 대시보드 → SQL Editor → New query → 붙여넣고 Run
--
-- 설계: 유저당 1행, 전체 상태를 JSONB 블랍으로. user_key = sha256(토스 CI) — 원본 CI는 저장 안 함.
-- 접근: 백엔드(service_role)만. RLS 활성 + 정책 없음 = anon/공개 접근 전면 차단.

create table if not exists public.user_state (
  user_key   text primary key,
  data       jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.user_state enable row level security;
-- 정책을 만들지 않는다 → anon/authenticated 모두 차단, service_role만 통과 (의도된 설정)

-- ⚠️ 필수: 프로젝트 생성 시 "Automatically expose new tables"를 꺼뒀다면(권장 설정)
-- service_role조차 테이블 권한(GRANT)이 자동 부여되지 않아 403이 난다 → 명시적으로 부여
grant all on table public.user_state to service_role;

comment on table public.user_state is '이음사주 클라이언트 상태 백업 (프로필·정령·스트릭). user_key=sha256(toss CI)';
