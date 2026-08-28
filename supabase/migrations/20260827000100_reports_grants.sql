-- db push 로 만든 테이블에 service_role 권한이 자동으로 붙지 않는 경우가 있다.
-- RLS 우회와 테이블 GRANT 는 별개라, RLS 를 켜도 GRANT 가 없으면 42501 이 난다.
--
-- anon / authenticated 에는 일부러 주지 않는다. 이 테이블은 Edge Function 만 만진다.
grant all privileges on table public.reports to service_role;
