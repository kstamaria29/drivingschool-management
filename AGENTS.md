# AGENTS.md - Driving School App

This is the working guide for Codex in this repo. Keep changes pragmatic, small, and safe.

## 1) Project snapshot (current baseline)

Use this as the current reality unless code proves otherwise.

- Platform: Expo React Native + TypeScript (mobile app, not web).
- Navigation: auth flow + onboarding, then drawer-based main app.
- Core domains live and in use:
  - Students: create, edit, archive/unarchive, delete, session history.
  - Lessons: calendar/today workflows, create/edit/delete.
  - Assessments:
    - Driving Assessment (with PDF export).
    - Mock Test - Restricted Licence.
    - Mock Test - Full License.
  - Settings/account:
    - Profile details, photo, name/password changes.
    - Owner/admin can create instructors.
- Auth/session hardening exists (stale/deleted session handling, missing env guard screen).
- Theme: light/dark support exists; first-launch default light behavior is implemented.

## 2) Product and access model

- Multi-tenant is mandatory. Tenant-owned data uses `organization_id`.
- RLS is mandatory on tenant tables.
- Current roles in `profiles.role`:
  - `owner`
  - `admin` (owner-equivalent access)
  - `instructor` (restricted to assigned/self rows)
- Do not regress role behavior already implemented in app + SQL migrations.

## 3) Technical guardrails

- Stack: Expo, React Native, NativeWind, React Navigation, TanStack Query, Zustand, React Hook Form, Zod, Day.js, Supabase.
- Screens must not call Supabase directly. Use feature API/query layers.
- Prefer shared UI primitives and theme tokens over one-off styling in screens.
- Keep tablet portrait as primary UX target, then tablet landscape, then phone.
- Keep TypeScript strict and avoid `any` unless unavoidable.

## 4) Database and storage workflow

Source of truth for DB behavior is:

- `supabase/migrations/*.sql` (currently `001` through `011`)
- `supabase/README.md`
- `supabase/storage/org-logos.sql`

When changing Supabase behavior:

1. Add a new numbered migration in `supabase/migrations`.
2. Include schema/constraints/indexes/RLS updates needed for that change.
3. Keep policies aligned with owner/admin vs instructor permissions.
4. Update `supabase/README.md` if setup or verification steps change.

Storage rules (org logo):

- Bucket: `org-logos`
- Path: `org-logos/<organization_id>/logo.<ext>`
- Read: authenticated users in same org
- Write/replace: owner/admin only

## 5) Documentation lookup rules

For external libraries/APIs, do not rely on memory for signatures that can change.

- Use Context7 MCP for framework/library docs (Expo/React Native ecosystem included).
- Use OpenAI Developer Docs MCP for OpenAI/Codex/MCP topics.
- Use Supabase MCP guidance when available; otherwise rely on official Supabase docs and existing repo SQL/README.

## 6) Required task workflow

At the start of every task:

1. Read `AGENTS.md`.
2. Read `PROJECT_LOG.md` when the task will change project files or when recent history is needed.
3. Read `docs/logs/INDEX.md`.
4. Read `docs/logs/PROJECT_LOG_ARCHIVE.md` when history is needed to avoid regressions.

At the end of every task:

1. Update `PROJECT_LOG.md` only when the task changed project files (code, docs, config, migrations, assets, or other repo-tracked files).
2. Do not update project logs for read-only research, Q&A, planning with no repo artifact, Git-only branch operations, or status checks.
3. When updating logs, keep only the latest 20 entries in `PROJECT_LOG.md`.
4. Move older entries to `docs/logs/PROJECT_LOG_ARCHIVE.md` (preserve chronological order).
5. Keep logs compact:
   - `PROJECT_LOG.md` and `PROJECT_LOG_ARCHIVE.md` should only contain `Date`, `Task`, and short `Summary`.
   - Do not store `Files changed`, `Commands run`, or `How to verify` in log files.
   - Run `scripts/logs/compact-project-logs.ps1` after edits if log size grows or older entries still use long format.
6. Suggest one Conventional Commit message in this format:
   - `git commit -m "type: message"`
7. Provide quick verification steps.

## 7) PROJECT_LOG entry template

- **Date:** YYYY-MM-DD (Pacific/Auckland)
- **Task:** <short title>
- **Summary:**
  - <most important outcome>
  - <optional second outcome>

## 8) Required response footer

Every task response must end with:

**PROJECT_LOG.md:** updated if project files changed; otherwise not updated
**Verification:**

- ...
