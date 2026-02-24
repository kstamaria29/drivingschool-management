# PROJECT_LOG.md

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

---

- **Date:** 2026-02-22 (Pacific/Auckland)
- **Task:** Home buttons + email assessment PDFs
- **Summary:**
  - Rearranged Home quick actions into a 3x2 grid (Students/Lessons, Assessments/Sessions, Google Maps bottom-right).
  - Added an "Email student" action in Assessment History to email PDFs to the student and the organization.

---

- **Date:** 2026-02-22 (Pacific/Auckland)
- **Task:** Organization email setting
- **Summary:**
  - Added organization email field + edit screen in Settings.
  - Displayed the org email in the Organization block and added a "Change organization email" action.

---

- **Date:** 2026-02-22 (Pacific/Auckland)
- **Task:** Restricted PDF stage pagination
- **Summary:**
  - Hid Stage 2 section/details in the PDF when Stage 2 was not enabled.
  - Forced Stage 2 (when enabled) to start on a new PDF page.

---

- **Date:** 2026-02-22 (Pacific/Auckland)
- **Task:** Suggestions: blue subheadings + auto-grow inputs
- **Summary:**
  - Updated suggestion modal category labels to use blue styling.
  - Made suggestion-linked multiline inputs auto-expand to fit content (no internal scrolling).

---

- **Date:** 2026-02-22 (Pacific/Auckland)
- **Task:** Bottom sheet spacing + scrollbars
- **Summary:**
  - Restored the previous bottom sheet top padding and added extra spacing between the handle and content.
  - Underlined suggestion subheadings, fixed long suggestions scrolling, and hid scroll indicators across the app.

---

- **Date:** 2026-02-22 (Pacific/Auckland)
- **Task:** Bottom sheet + navbar polish
- **Summary:**
  - Standardized bottom sheet padding/typography (bigger headings, bolder category labels, left-aligned suggestion options).
  - Updated header buttons so drawer root screens show hamburger only, and all other screens show back only (no navbar titles).

---

- **Date:** 2026-02-22 (Pacific/Auckland)
- **Task:** Restricted suggestions bottom sheet
- **Summary:**
  - Switched the suggestions picker (task errors + feedback) to the same bottom-sheet pattern as the task repetition modal.
  - Updated suggestions helper copy to reflect handle/backdrop dismissal.

---

- **Date:** 2026-02-22 (Pacific/Auckland)
- **Task:** Restricted task modal bottom sheet
- **Summary:**
  - Converted the task repetition modal into an animated bottom sheet with a handle (drag or tap to expand/collapse, tap backdrop to dismiss).
  - Matched the modal padding to the main screen container paddings.

---

- **Date:** 2026-02-22 (Pacific/Auckland)
- **Task:** Restricted mock test UX refinements
- **Summary:**
  - Defaulted pre-drive Time to current time, removed the optional label, and auto-expanded Stage 1 when starting/resuming.
  - Moved error/feedback suggestions into a dedicated modal and persisted in-progress task repetition selections with dynamic modal height.

---

- **Date:** 2026-02-21 (Pacific/Auckland)
- **Task:** Lessons address label + size
- **Summary:**
  - Removed the Location label and bumped address text size on New Lesson and Lessons list.

---

- **Date:** 2026-02-21 (Pacific/Auckland)
- **Task:** New lesson layout refinements
- **Summary:**
  - Rendered selected student address directly under the student picker and increased selected student name emphasis.
  - Moved Start time + Duration into a 2-column row for faster scheduling.
