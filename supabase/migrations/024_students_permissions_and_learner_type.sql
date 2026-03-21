-- Driving School App (v1) - Student learner type + permissions
-- Adds learner profile, media release, and declaration fields to students.

alter table public.students
add column if not exists learner_types text[] not null default '{}'::text[];

alter table public.students
add column if not exists photo_video_release_consent boolean not null default false;

alter table public.students
add column if not exists photo_video_release_liability_waiver boolean not null default false;

alter table public.students
add column if not exists declaration_confirmed boolean not null default false;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'students_learner_types_check'
  ) then
    alter table public.students
    add constraint students_learner_types_check
    check (
      learner_types <@ array['visual', 'auditory', 'ready', 'kinesthetic']::text[]
    );
  end if;
end;
$$;
