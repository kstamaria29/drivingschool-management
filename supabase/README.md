# Supabase setup (Driving School App v1)

## Apply migrations

In the Supabase Dashboard:

1. Go to `SQL Editor`
2. Run migrations in order:
   - `supabase/migrations/001_auth_onboarding.sql`
   - `supabase/migrations/002_fix_profiles_rls.sql`
   - `supabase/migrations/003_students.sql`
   - `supabase/migrations/004_lessons.sql`
   - `supabase/migrations/005_profile_avatars.sql`
   - `supabase/migrations/006_assessments.sql`
   - `supabase/migrations/007_assessments_delete.sql`
   - `supabase/migrations/008_student_sessions.sql`
   - `supabase/migrations/009_account_settings.sql`
   - `supabase/migrations/010_admin_role.sql`
   - `supabase/migrations/011_students_lessons_delete_policies.sql`
   - `supabase/migrations/012_map_pins.sql`
   - `supabase/migrations/013_map_annotations.sql`
   - `supabase/migrations/014_role_display_name.sql`
   - `supabase/migrations/015_profile_member_details.sql`
   - `supabase/migrations/016_students_organization_name.sql`
   - `supabase/migrations/017_students_license_images.sql`
   - `supabase/migrations/018_students_date_of_birth.sql`
   - `supabase/migrations/019_student_reminders.sql`
   - `supabase/migrations/020_student_reminders_time.sql`
   - `supabase/migrations/021_notifications_settings_push.sql`
   - `supabase/migrations/022_organization_email.sql`

## Edge Functions

### `create-instructor` (owner/admin only)

This Edge Function allows an `owner` or `admin` to create an instructor login and a matching
`profiles` row in their organization. It generates a temporary password and sets
`profiles.must_change_password = true` so the instructor is required to change it on first sign-in.

Deploy (requires Supabase CLI):

- `supabase functions deploy create-instructor --no-verify-jwt`
- Set secrets (Dashboard or CLI):
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`

Notes:

- `create-instructor` validates caller JWT inside the function (`auth.getUser(accessToken)`), so gateway `verify_jwt` is intentionally disabled to avoid edge pre-auth mismatches.

### `send-test-notification` (authenticated users)

Sends a push notification to all of the caller's registered Expo push tokens (useful for verifying
push notifications work across devices).

Deploy (requires Supabase CLI):

- `supabase functions deploy send-test-notification --no-verify-jwt`
- Set secrets (Dashboard or CLI):
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`

### `notifications-cron` (scheduled)

Intended to be invoked on a schedule to deliver:

- Upcoming lesson reminders (based on `notification_settings.lesson_reminder_offsets_minutes`)
- Daily "Today's lessons" digest

Deploy (requires Supabase CLI):

- `supabase functions deploy notifications-cron --no-verify-jwt`
- Set secrets (Dashboard or CLI):
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`

Scheduling:

- Create a scheduled job in Supabase Dashboard to call `notifications-cron` (recommended every 5 minutes).

### `send-assessment-email` (authenticated users)

Emails an assessment PDF to the student and BCCs a copy to the organization's email address.

Setup guide:

- `docs/email-student-setup.md`

Deploy (requires Supabase CLI):

- `supabase functions deploy send-assessment-email --no-verify-jwt`
- Set secrets (Dashboard or CLI):
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `RESEND_API_KEY`

Notes:

- Sender is `organizations.email` (set this in-app via Settings -> Organization).
- The function uses Resend (the sender domain must be verified in Resend; personal inbox domains like `gmail.com` won't work as a `From` address).

## Storage buckets + policies

Create buckets (Dashboard → `Storage` → `New bucket`):

- `org-logos` (private)
- `avatars` (private)
- `student-licenses` (private)

Then apply policies (Dashboard → `SQL Editor`):

- `supabase/storage/org-logos.sql`
- `supabase/storage/avatars.sql`
- `supabase/storage/student-licenses.sql`

## Verify RLS + permissions

Create 3 users in the same org:

- `owner` user (onboarding creates this)
- `admin` user (create a `profiles` row with role `admin`)
- `instructor` user (create a `profiles` row with role `instructor`)

Checks:

- `owner` and `admin` can read/write org data within org (students, lessons, organization_settings).
- `owner` and `admin` can set a custom self role display label using `set_my_role_display_name`.
- `instructor` can only read/write their own assigned students + lessons (per existing RLS policies).
- `instructor` can only read/write their own assessments (assessments must match the student's assigned instructor).
- `instructor` can only read/write their own student sessions (session history).
- `instructor` can only read/write their own student reminders.
- `instructor` cannot set custom role display label (RPC should reject).
- `instructor` cannot upload/replace `org-logos/*` (Storage policy should reject).
- `owner` and `admin` can upload/replace `org-logos/<organization_id>/logo.*`.
- `owner`, `admin`, and `instructor` can upload/update only their own `avatars/<auth.uid()>/avatar.*`.
- Users can read avatars of other users in the same org (drawer/header avatar display).
- `owner` and `admin` can upload/update/delete `student-licenses/<organization_id>/<student_id>/<front|back>.*` for any student in their org.
- `instructor` can upload/update/delete/read licence images only for students assigned to them.
