-- 리포트를 장 단위로 나눠 생성한다.
--
-- 한 번에 4,000자를 스트리밍하면 Edge Function 실행 한도에 걸려 함수가 중간에 죽고,
-- 그러면 저장 로직이 실행되지 않아 status 가 generating 에 영구히 남는다.
-- 장을 쪼개면 호출당 부하가 절반이 되고, 1장을 읽는 동안 2장을 받는 UX 와도 맞는다.

alter table public.reports
  add column if not exists content_1 text,
  add column if not exists content_2 text,
  -- created_at 대신 이 값으로 stale 판정을 한다. 장마다 새로 찍혀야 하기 때문.
  add column if not exists generating_since timestamptz;

alter table public.reports drop constraint if exists reports_status_check;
alter table public.reports add constraint reports_status_check
  check (status in ('pending', 'generating', 'partial', 'done', 'failed'));

comment on column public.reports.content_1 is '1장 — 당신이라는 사람';
comment on column public.reports.content_2 is '2장 — 지금 지나는 시기';
comment on column public.reports.content is '완성본 (content_1 + content_2). 다시 읽기용.';
comment on column public.reports.status is 'pending=주문만 기록 / generating=생성중 / partial=1장만 완료 / done=완료 / failed=실패';
