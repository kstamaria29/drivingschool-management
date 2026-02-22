# PROJECT_LOG.md

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

---

- **Date:** 2026-02-21 (Pacific/Auckland)
- **Task:** Lessons: student picker + location display
- **Summary:**
  - Moved the Student block above date/time/duration and reused the assessment-style student dropdown search.
  - Removed Status + Location inputs; now shows Location from the selected student address and updated lesson cards accordingly.

---

- **Date:** 2026-02-21 (Pacific/Auckland)
- **Task:** Restricted history feedback ordering
- **Summary:**
  - Moved General feedback + Improvement(s) needed cards to sit directly under Overview for restricted mock tests.

---

- **Date:** 2026-02-21 (Pacific/Auckland)
- **Task:** Restricted mock test PDF page break + suggestion auto-open
- **Summary:**
  - Auto-opened suggestions when tapping into task errors and feedback textboxes, and renamed Improvement needed to Improvement(s) needed across UI/history/PDF.
  - Adjusted Restricted PDF layout so feedback stays on page 1 and Stage 1/2 start on page 2.

---

- **Date:** 2026-02-21 (Pacific/Auckland)
- **Task:** Restricted mock test repetition errors + modal polish
- **Summary:**
  - Saved task Critical/Immediate errors per repetition (snapshotted on Record Repetition) and updated History + PDF to render Repetition #N sections.
  - Redesigned the task modal (90% height, full-width card) and improved suggestion UX (tap outside to hide, auto-hide on record).

---

- **Date:** 2026-02-21 (Pacific/Auckland)
- **Task:** Restricted mock test feedback + task errors
- **Summary:**
  - Replaced per-task notes with Critical/Immediate error fields (multi-select suggestions) and saved them per task.
  - Replaced global Critical/Immediate blocks with General feedback/Improvement needed and updated history + PDF output.

---

- **Date:** 2026-02-21 (Pacific/Auckland)
- **Task:** Notifications test buttons for all roles
- **Summary:**
  - Made â€œSend test notificationâ€ buttons visible for owners and instructors (not admin-only).

---

- **Date:** 2026-02-21 (Pacific/Auckland)
- **Task:** Notifications screen spacing + push button polish
- **Summary:**
  - Removed the extra gap between section titles and captions and ensured Upcoming lessons defaults to a 1-hour notify offset.
  - Made the push "Register this device" button green when this device is not registered and disabled it when already registered.

---

- **Date:** 2026-02-21 (Pacific/Auckland)
- **Task:** Notifications settings simplify toggles
- **Summary:**
  - Simplified notification category settings to On/Off segmented controls only (removed Sound/Vibration UI and defaulted both to On when enabled).
  - Disabling Downloads/Student reminders now prevents local notifications and clears scheduled reminder alerts on the device.
