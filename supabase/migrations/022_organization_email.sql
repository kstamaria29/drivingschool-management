-- Driving School App - Organization email

alter table public.organizations
add column if not exists email text null;

