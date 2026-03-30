# PROJECT_LOG.md

- **Date:** 2026-03-30 (Pacific/Auckland)
- **Task:** Refine restricted task image layout
- **Summary:**
  - Moved the Stage 1 `Right turn giving way` image into the top-right of the task bottom sheet header.
  - Removed the extra task-reference text/wrapper and shifted `Record Repetition` into its own full-width row below the header.

---

- **Date:** 2026-03-30 (Pacific/Auckland)
- **Task:** Restricted task reference image
- **Summary:**
  - Added a task-media registry for the Restricted mock test and attached the Stage 1 `Right turn giving way` reference image.
  - Rendered the reference image near the top of the task bottom sheet with tablet-friendly sizing and accessibility copy.

---

- **Date:** 2026-03-21 (Pacific/Auckland)
- **Task:** Assessment keyboard avoidance
- **Summary:**
  - Added `KeyboardAvoidingView`-based keyboard handling to the Restricted and Driving assessment scroll areas so lower feedback fields stay reachable while typing.
  - Enabled shared keyboard avoidance for the Full License mock test and added a reusable keyboard-aware scroll hook for assessment forms.

---

- **Date:** 2026-03-21 (Pacific/Auckland)
- **Task:** Restricted Stage 1 task additions
- **Summary:**
  - Added `Right turn across 1 lane oncoming` and `Left turn with priority` to Stage 1 of the Restricted mock test with 10-rep targets.
  - Kept the shared task definitions aligned so the screen, generated PDF, and student assessment history use the same updated Stage 1 order.

---

- **Date:** 2026-03-21 (Pacific/Auckland)
- **Task:** Student declaration warning styling
- **Summary:**
  - Made the add-student declaration warning render in bold red text.
  - Changed the Add student button to the grey secondary style until Declaration is checked.

---

- **Date:** 2026-03-21 (Pacific/Auckland)
- **Task:** Require declaration on new students only
- **Summary:**
  - Made the Declaration checkbox mandatory only when adding a new student, without blocking edits to older student records.
  - Hid the permission/declaration blocks on student profile pages unless the student was created with the new declaration flow.

---

- **Date:** 2026-03-21 (Pacific/Auckland)
- **Task:** Make learner type multi-select
- **Summary:**
  - Changed the student learner-type field to support multiple selections in the form and profile display.
  - Updated pending migration `024` to store learner types as a text array before it is applied to Supabase.

---

- **Date:** 2026-03-21 (Pacific/Auckland)
- **Task:** Fix declaration full name source
- **Summary:**
  - Changed the declaration name display to use the student's entered first and last name instead of the logged-in user.
  - Removed the pending `declaration_full_name` column from migration `024` before it is applied to Supabase.

---

- **Date:** 2026-03-21 (Pacific/Auckland)
- **Task:** Add student learner type + permissions
- **Summary:**
  - Added learner type, photo/video release, and declaration fields to the shared New/Edit student flow.
  - Persisted the new student fields through Supabase and displayed them on the student profile screen.

---

- **Date:** 2026-03-21 (Pacific/Auckland)
- **Task:** Show global AGENTS guide
- **Summary:**
  - Retrieved the shared global `AGENTS.md` from the Codex home directory so it could be shown directly for reference.

---

- **Date:** 2026-02-24 (Pacific/Auckland)
- **Task:** Daily digest lesson lookup
- **Summary:**
  - Fixed `get_lessons_for_local_date` to join through `notification_settings` so daily digests use the same org-scoped lesson selection as upcoming reminders.

---

- **Date:** 2026-02-24 (Pacific/Auckland)
- **Task:** Daily digest reliability
- **Summary:**
  - Prevented daily digest push bodies from falling back to "No lessons scheduled today" when the lesson lookup RPC fails.
  - Avoided inserting digest deliveries on lookup failure so the next cron run can retry.

---

- **Date:** 2026-02-23 (Pacific/Auckland)
- **Task:** Safe area for bottom overlays
- **Summary:**
  - Added safe-area bottom padding to the shared bottom sheet modal so content won't sit under the system navigation bar.
  - Made the licence image gallery modal respect system insets.

---

- **Date:** 2026-02-23 (Pacific/Auckland)
- **Task:** Supabase cron setup docs
- **Summary:**
  - Documented enabling `pg_cron` + `pg_net` for scheduled Edge Function delivery.
  - Added sample SQL for scheduling `notifications-cron` every 5 minutes and verifying runs.

---

- **Date:** 2026-02-22 (Pacific/Auckland)
- **Task:** Navbar hamburger buttons
- **Summary:**
  - Updated header button logic so stack root screens show the hamburger menu even when navigation can go back.
  - Applied this so Students/Lessons/Assessments/Sessions/Google Maps/Settings show the hamburger instead of a back button.

---

- **Date:** 2026-02-22 (Pacific/Auckland)
- **Task:** Modal polish
- **Summary:**
  - Updated the submit confirmation modal so "Submit and Email student" uses green text styling (matching "Submit and Generate PDF").
  - Added a blue Close button with icon to the bottom sheet modal footer (outside the scrollable content).

---

- **Date:** 2026-02-22 (Pacific/Auckland)
- **Task:** Submit and email student
- **Summary:**
  - Added a "Submit and Email student" option to the submit confirmation modal for all 3 assessments.
  - Implemented submit + PDF generation + email sending via the `send-assessment-email` Edge Function.

---

- **Date:** 2026-02-22 (Pacific/Auckland)
- **Task:** Email student button color
- **Summary:**
  - Added a green `success` button variant and applied it to "Email student" across all assessment history views.

---

- **Date:** 2026-02-22 (Pacific/Auckland)
- **Task:** Email student for mock tests
- **Summary:**
  - Added the "Email student" action to Restricted and Full mock test history detail views.
  - Disabled Download/Email/Delete actions consistently while emailing.

---

- **Date:** 2026-02-22 (Pacific/Auckland)
- **Task:** Assessment email error messaging
- **Summary:**
  - Surfaced Resend error messages in the Edge Function response for easier diagnosis.
  - Logged provider failures in Supabase Edge Function logs.
