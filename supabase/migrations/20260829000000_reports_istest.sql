-- 테스트 결제로 만들어진 리포트를 구분한다.
--
-- 실행 환경은 토스가 정한다(Environment.environment). QR 로 띄운 테스트 번들이면
-- sandbox 라 결제가 TEST 로 잡히고 실제 돈이 나가지 않는다.
-- 이 값을 남겨두지 않으면 나중에 매출·원가를 볼 때 테스트 건이 섞여 들어간다.
alter table public.reports
  add column if not exists is_test boolean not null default false;

comment on column public.reports.is_test is 'true = QR 테스트(sandbox) 결제. 실제 매출이 아니다.';
