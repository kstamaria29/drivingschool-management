# PROJECT_LOG.md

- **Date:** 2026-03-30 (Pacific/Auckland)
- **Task:** Fix snapshot preview annotation alignment
- **Summary:**
  - Matched the saved snapshot preview canvas to the annotation editor's stored aspect ratio so saved circles stay on the intended map target.
  - Scaled preview strokes and text overlays with the fitted canvas for a closer visual match to the editor modal.

---

- **Date:** 2026-03-30 (Pacific/Auckland)
- **Task:** Remove snapshot annotation text tools
- **Summary:**
  - Removed the snapshot annotation text label, text size, and place-text controls from the Google Maps snapshot editor modal.
  - Simplified snapshot saving so new annotations require drawn strokes while older saved text overlays still preview correctly.

---

- **Date:** 2026-03-30 (Pacific/Auckland)
- **Task:** Reposition repetition viewer button
- **Summary:**
  - Moved the `View recorded repetitions` button into the left-side header gap under the repetition/fault stats.
  - Kept the separate recorded-repetitions modal and left the main `Record Repetition` action on its own row.

---

- **Date:** 2026-03-30 (Pacific/Auckland)
- **Task:** Simplify repetition viewer
- **Summary:**
  - Replaced the inline repetition tabs with a single button in the Restricted task sheet.
  - Added a dedicated modal that lists all recorded repetitions without crowding the main task form.

---

- **Date:** 2026-03-30 (Pacific/Auckland)
- **Task:** Add live repetition tabs
- **Summary:**
  - Added live repetition tabs to the Restricted task bottom sheet so recorded repetitions can be reviewed during the assessment.
  - Stored the fault buttons used for each saved repetition and surfaced them alongside the recorded critical/immediate notes.

---

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
