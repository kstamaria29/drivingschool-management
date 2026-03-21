-- Driving School App (v1) - Daily digest lesson lookup fix
--
-- Ensure the daily digest uses the same tenant-scoped join logic as upcoming lesson reminders:
-- - Start from notification_settings (profile + organization)
-- - Join lessons in the same organization for that instructor
-- - Compute local date using the organization's timezone

create or replace function public.get_lessons_for_local_date(
  p_profile_id uuid,
  p_local_date date
)
returns table (
  lesson_id uuid,
  start_time timestamptz,
  end_time timestamptz,
  student_first_name text,
  student_last_name text,
  location text
)
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select
    l.id as lesson_id,
    l.start_time,
    l.end_time,
    st.first_name,
    st.last_name,
    l.location
  from public.notification_settings s
  join public.organizations o on o.id = s.organization_id
  join public.lessons l
    on l.organization_id = s.organization_id
    and l.instructor_id = s.profile_id
    and l.status = 'scheduled'
  join public.students st on st.id = l.student_id
  where
    s.profile_id = p_profile_id
    and ((l.start_time at time zone o.timezone)::date) = p_local_date
  order by l.start_time asc;
$$;

