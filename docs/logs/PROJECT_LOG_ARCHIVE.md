# PROJECT_LOG archive (compact)

- **Date:** 2026-02-04 (Pacific/Auckland)
- **Task:** Initialize repo documentation
- **Summary:**
  - Added initial `AGENTS.md` with v1 scope, stack decisions, schema, RLS rules, UI priorities, and Codex instructions.
  - Added requirement to maintain this `PROJECT_LOG.md` after every task.

---

- **Date:** 2026-02-04 (Pacific/Auckland)
- **Task:** Bootstrap mobile app (Auth + Onboarding)
- **Summary:**
  - Initialized Expo React Native + TypeScript project structure and configured tablet portrait orientation.
  - Added NativeWind + Tailwind setup and introduced shared UI primitives (`Screen`, `AppText`, `AppButton`, `AppInput`, `AppCard`, `AppStack`).

---

- **Date:** 2026-02-04 (Pacific/Auckland)
- **Task:** Add dark mode + icons + theme polish
- **Summary:**
  - Added persisted light/dark theme toggle and wired it into Settings.
  - Introduced dark-mode styles across core primitives (screen, cards, buttons, inputs) and key UI surfaces (drawer/header/calendar).

---

- **Date:** 2026-02-04 (Pacific/Auckland)
- **Task:** Enhance Home screen (greeting + weather)
- **Summary:**
  - Updated Home screen header to greet the signed-in user based on time of day.
  - Replaced quick actions with 3 buttons: New Assessment, New Lesson, New Student.

---

- **Date:** 2026-02-04 (Pacific/Auckland)
- **Task:** Refine mock test screen layout
- **Summary:**
  - Hid the `Pre-drive checks` section after the mock test has started to keep the test stage focused.
  - Made Stage 1 and Stage 2 sections collapsible (Stage 2 remains locked until enabled).

---

- **Date:** 2026-02-04 (Pacific/Auckland)
- **Task:** Update Driving Assessment start flow
- **Summary:**
  - Changed Driving Assessment to a staged flow: review student details first, confirm start, then show the scoring/test form.
  - Kept existing PDF export + submission behavior once the test is started.

---

- **Date:** 2026-02-04 (Pacific/Auckland)
- **Task:** Refine Driving Assessment pre-test details
- **Summary:**
  - Merged assessment date + instructor into the pre-test details card and renamed it to `Student Assessment details`.
  - Removed the Weather field entirely from the Driving Assessment form, history view, and PDF export.

---

- **Date:** 2026-02-04 (Pacific/Auckland)
- **Task:** Delete assessments from student history
- **Summary:**
  - Added a red delete action to the Assessment History detail view (with confirmation).
  - Added an Assessments delete mutation and API helper.

---

- **Date:** 2026-02-04 (Pacific/Auckland)
- **Task:** Standardize date display to DD/MM/YYYY
- **Summary:**
  - Standardized user-facing date formatting to `DD/MM/YYYY` across Home, Lessons, Students, and Assessments.
  - Added shared date parsing/formatting utilities to support both legacy ISO strings and new display format.

---

- **Date:** 2026-02-04 (Pacific/Auckland)
- **Task:** Add date picker inputs
- **Summary:**
  - Added `AppDateInput` primitive that opens a native date picker (spinner-style where available).
  - Replaced manual date typing with date pickers for Lessons, Students (licence dates), and Driving Assessments.

---

- **Date:** 2026-02-04 (Pacific/Auckland)
- **Task:** Save assessment PDFs to Downloads + notify
- **Summary:**
  - Added Android Downloads-folder saving via Storage Access Framework (one-time folder picker; then saves directly).
  - Falls back to app storage if Android folder permission is revoked.

---

- **Date:** 2026-02-04 (Pacific/Auckland)
- **Task:** Make Lessons screen fully scrollable on phone
- **Summary:**
  - Switched to a single outer scroll container on phone-sized screens so the entire Lessons screen (header + calendar + agenda) scrolls togethe...
  - Kept tablet behavior: calendar stays visible while only the agenda area scrolls.

---

- **Date:** 2026-02-04 (Pacific/Auckland)
- **Task:** Fix Driving Assessment submit UX
- **Summary:**
  - Made score calculation update live as criteria are scored.
  - Replaced the two non-responsive save buttons with a single Submit and generate PDF button.

---

- **Date:** 2026-02-04 (Pacific/Auckland)
- **Task:** Fix Driving Assessment validation for scores
- **Summary:**
  - Fixed form validation so scored criteria no longer fails submit due to array-shaped `scores` values.
  - Improved invalid-submit alerts to use the actual validation errors from React Hook Form.

---

- **Date:** 2026-02-04 (Pacific/Auckland)
- **Task:** Update Driving Assessment PDF layout
- **Summary:**
  - Updated PDF output to a 2-page layout: page 1 shows Personal Information + the Total Score Assessment Guide; page 2 shows Assessment Scores....
  - Removed Assessment ID from the PDF and added organization name to the header.

---

- **Date:** 2026-02-04 (Pacific/Auckland)
- **Task:** Name Driving Assessment PDFs
- **Summary:**
  - Updated PDF export to copy the generated file to a named path using `expo-file-system` so the share sheet uses `First Last DD-MM-YY.pdf`.

---

- **Date:** 2026-02-04 (Pacific/Auckland)
- **Task:** Add split view for tablet landscape Lessons
- **Summary:**
  - Updated Lessons screen to use a two-column layout in tablet landscape: calendar on the left, agenda on the right.
  - Kept existing behavior on tablet portrait (calendar above agenda) and phones (single-page scroll).

---

- **Date:** 2026-02-04 (Pacific/Auckland)
- **Task:** Fix LessonEditScreen hook order crash
- **Summary:**
  - Fixed React hook-order runtime error when opening an existing lesson by ensuring all hooks run before any early returns.
  - Moved the `useMemo` for `studentOptions` above the loading/error return paths.

---

- **Date:** 2026-02-04 (Pacific/Auckland)
- **Task:** Fix Lessons screen scrolling on phone
- **Summary:**
  - Fixed the Lessons screen empty/error states being clipped on small screens by making the agenda area scrollable in all states.
  - Made the agenda `ScrollView` fill remaining height (`flex-1`) so it can actually scroll when the calendar leaves limited space on phones.

---

- **Date:** 2026-02-04 (Pacific/Auckland)
- **Task:** Fix calendar week layout (7 days)
- **Summary:**
  - Fixed month calendar grid wrapping so weeks always render 7 columns (Mon Sun) instead of occasionally wrapping at 6.
  - Rendered the calendar as 6 explicit week rows (7 cells each) to avoid flex-wrap rounding issues.

---

- **Date:** 2026-02-04 (Pacific/Auckland)
- **Task:** Make calendar the main Lessons screen
- **Summary:**
  - Embedded the month calendar directly into `LessonsListScreen` and removed the Today/This Week toggle and separate calendar screen.
  - Lessons now default to showing today's agenda under the calendar, with day selection driving the list.

---

- **Date:** 2026-02-04 (Pacific/Auckland)
- **Task:** Remove org logo white background
- **Summary:**
  - Updated organization logo rendering to use a transparent background so PNG transparency shows correctly in dark mode.
  - Updated the onboarding logo preview to match (no forced light background).

---

- **Date:** 2026-02-05 (Pacific/Auckland)
- **Task:** Fix dark mode navigation chrome
- **Summary:**
  - Applied React Navigation theming so headers and drawer follow the selected light/dark scheme.
  - Explicitly styled native-stack headers and drawer background to avoid the default white surfaces in dark mode.

---

- **Date:** 2026-02-04 (Pacific/Auckland)
- **Task:** Implement Mock Test Restricted Licence assessment
- **Summary:**
  - Implemented the 2nd assessment as a Restricted Licence mock test (Stage 1/Stage 2 tasks, critical errors, immediate-fail errors) with auto-s...
  - Added PDF export on submit and enabled PDF download + detailed history view in the student's assessment history.

---

- **Date:** 2026-02-04 (Pacific/Auckland)
- **Task:** Remove assessment start from student profile
- **Summary:**
  - Removed the `New Driving Assessment` button from `StudentDetailScreen` so assessments are only initiated from the Assessments screen.

---

- **Date:** 2026-02-04 (Pacific/Auckland)
- **Task:** Add student Assessment History screen
- **Summary:**
  - Added an Assessment History button on the student profile screen.
  - Added `StudentAssessmentHistoryScreen` with assessment-type tabs, history list, and a Driving Assessment detail view with PDF re-export.

---

- **Date:** 2026-02-04 (Pacific/Auckland)
- **Task:** Save Driving Assessment PDFs without share sheet
- **Summary:**
  - Updated PDF export to save directly into app storage (`documentDirectory/driving-assessments/`) and skip opening the share sheet.
  - Updated submit success alert to show the saved file URI.

---

- **Date:** 2026-02-04 (Pacific/Auckland)
- **Task:** Implement Driving Assessment (Assessments v1)
- **Summary:**
  - Added Supabase `assessments` table with RLS (owner: org-wide; instructor: own assessments) and updated_at trigger.
  - Built Assessments screens: assessment type list + Driving Assessment form (student picker, scoring criteria, feedback fields).

---

- **Date:** 2026-02-04 (Pacific/Auckland)
- **Task:** Update AGENTS.md for Assessments scope
- **Summary:**
  - Updated v1 spec to include Assessments (Driving Assessment implemented; other assessment types remain placeholders).
  - Updated schema/navigation/forms sections to reflect the new Assessments stack and `assessments` table.

---

- **Date:** 2026-02-04 (Pacific/Auckland)
- **Task:** Redo navigation UI (sidebar + hamburger) + Home + Settings uploads
- **Summary:**
  - Replaced bottom tabs with a responsive drawer layout: permanent collapsible sidebar on tablet landscape, hamburger drawer on tablet portrait...
  - Added `Home` as the post-login landing screen (dashboard-style) and added an `Assessments` placeholder screen (no assessment features implem...

---

- **Date:** 2026-02-04 (Pacific/Auckland)
- **Task:** Fix Worklets version mismatch (Expo runtime crash)
- **Summary:**
  - Pinned `react-native-worklets` to `0.5.1` (dependency + npm overrides) to match the native Worklets version bundled with the current app run...

---

- **Date:** 2026-02-04 (Pacific/Auckland)
- **Task:** Align AGENTS.md with new navigation UI
- **Summary:**
  - Updated the navigation spec to describe the responsive drawer layout (sidebar in tablet landscape, hamburger in portrait/mobile) and set `Ho...
  - Clarified `Assessments` as a placeholder-only route in v1 (no assessment features).

---

- **Date:** 2026-02-04 (Pacific/Auckland)
- **Task:** Add top padding to drawer menus
- **Summary:**
  - Increased top padding for the drawer content so both the permanent sidebar and hamburger drawer menus start lower (`pt-10`).

---

- **Date:** 2026-02-04 (Pacific/Auckland)
- **Task:** Fix image upload "Network request failed"
- **Summary:**
  - Switched logo/avatar uploads to use `expo-image-picker` base64 data instead of `fetch(asset.uri)`, avoiding failures with `content://` URIs....

---

- **Date:** 2026-02-04 (Pacific/Auckland)
- **Task:** Fix Blob upload + ImagePicker deprecation
- **Summary:**
  - Updated Supabase Storage uploads to pass `Uint8Array` directly (avoids RN Blob limitation: Creating blobs from ArrayBuffer ).
  - Switched `expo-image-picker` usage away from deprecated `ImagePicker.MediaTypeOptions`.

---

- **Date:** 2026-02-04 (Pacific/Auckland)
- **Task:** Remove org logo border radius
- **Summary:**
  - Made the organization logo render as a square (no rounded corners) across the drawer header, Settings, and onboarding preview.

---

- **Date:** 2026-02-04 (Pacific/Auckland)
- **Task:** Fix nested screen name warning
- **Summary:**
  - Renamed stack screen route names so drawer routes don't nest screens with the same name (removes `Home, Home > Home` warning; also prevents....

---

- **Date:** 2026-02-04 (Pacific/Auckland)
- **Task:** Switch app font to Poppins
- **Summary:**
  - Added Poppins via Expo Google Fonts and block app render until fonts are loaded.
  - Updated `AppText` and `AppInput` primitives to use Poppins weights (regular/medium/semibold) without relying on `fontWeight`.

---

- **Date:** 2026-02-04 (Pacific/Auckland)
- **Task:** Fix Poppins imports for Expo Google Fonts
- **Summary:**
  - Fixed `App.tsx` to import Poppins weights from `@expo-google-fonts/poppins` (the installed package exports fonts from its root, not `.../400...

---

- **Date:** 2026-02-04 (Pacific/Auckland)
- **Task:** Fix Lessons screen layout (no forced scrolling)
- **Summary:**
  - Added `AppButton` `width` prop to support `auto` sizing in horizontal rows while preserving full-width by default.
  - Refactored `LessonsListScreen` to keep the calendar visible and make only the agenda list scrollable.

---

- **Date:** 2026-02-04 (Pacific/Auckland)
- **Task:** Implement Students feature (v1: CRUD + archive)
- **Summary:**
  - Added `students` table migration with RLS policies (owner: org-wide; instructor: assigned only) and updated_at trigger.
  - Implemented typed Students data layer (`features/students/api.ts` + `features/students/queries.ts`) and Zod form schema.

---

- **Date:** 2026-02-04 (Pacific/Auckland)
- **Task:** Implement Lessons scheduling (v1: Today/Week + create/edit)
- **Summary:**
  - Added `lessons` table migration with constraints, indexes, updated_at trigger, and RLS policies (owner: org-wide; instructor: own lessons on...
  - Enforced lesson integrity in RLS: lesson instructor must be in org and match the student's assigned instructor.

---

- **Date:** 2026-02-04 (Pacific/Auckland)
- **Task:** Add calendar view for Lessons
- **Summary:**
  - Added an in-app month calendar screen for Lessons with per-day lesson counts and an agenda list for the selected day.
  - Added navigation entry points from `LessonsListScreen` and the calendar screen to create a lesson on the selected date.

---

- **Date:** 2026-02-05 (Pacific/Auckland)
- **Task:** Implement Mock Test - Full License (3rd assessment)
- **Summary:**
  - Added a new assessment flow: setup ? confirm ? run (timer + attempts) ? summary ? submit + PDF export.
  - Implemented scoring/readiness summary from attempt item fails + critical/immediate error counts.

---

- **Date:** 2026-02-05 (Pacific/Auckland)
- **Task:** Add time picker input for lessons
- **Summary:**
  - Added `AppTimeInput` primitive (same styling/UX as `AppDateInput`) using native spinner time picker.
  - Replaced Lesson start time manual typing with `AppTimeInput`.

---

- **Date:** 2026-02-05 (Pacific/Auckland)
- **Task:** Home screen CTA + weather polish
- **Summary:**
  - Replaced Home CTAs with just `Students` and `Assessments` buttons (navigates to the respective screens).
  - Improved `AppButton` ghost variant styling so link-style buttons don t render a weird bordered/shadowed box in dark mode (fixes `Open Lesson...

---

- **Date:** 2026-02-05 (Pacific/Auckland)
- **Task:** Mock test suggestions + time pickers
- **Summary:**
  - Added multi-select suggestion options (5 each) for Full License mock test attempt notes: hazards spoken, actions spoken, and instructor note...
  - Added a confirmation alert when saving a task attempt.

---

- **Date:** 2026-02-05 (Pacific/Auckland)
- **Task:** Make mock test suggestions exclusive
- **Summary:**
  - Updated Full License mock test so only one suggestions panel can be open at a time (hazards/actions/notes).

---

- **Date:** 2026-02-05 (Pacific/Auckland)
- **Task:** Adjust mock test attempt actions
- **Summary:**
  - Right-aligned the attempt action buttons, swapped order, and renamed them to `Clear all` and `Record task attempt`.
  - Updated the save confirmation copy to "Recorded" / "Task attempt recorded."

---

- **Date:** 2026-02-05 (Pacific/Auckland)
- **Task:** Assessment student header + full license session controls
- **Summary:**
  - Updated all assessment screens to show the selected student name right-aligned in the Student card header (removed the "Selected:" line).
  - Moved the Full License resume/pause control into the Session badges row as an icon-only button.

---

- **Date:** 2026-02-05 (Pacific/Auckland)
- **Task:** Redesign lessons calendar
- **Summary:**
  - Redesigned the Lessons screen into a cleaner scheduler layout: header actions, month calendar in a card, and a day agenda card with a week s...
  - Updated month cells to use subtle lesson indicators (dots) and a clear today/selected treatment.

---

- **Date:** 2026-02-05 (Pacific/Auckland)
- **Task:** Redesign students list
- **Summary:**
  - Redesigned Students into a more professional management list with search, status filter (active/archived), and sort (name/recent).
  - Added a tablet-friendly table layout while keeping a compact card layout for smaller screens.

---

- **Date:** 2026-02-05 (Pacific/Auckland)
- **Task:** Polish students table fields
- **Summary:**
  - Removed address from the Students list and replaced it with email.
  - Added phone display and a colored licence-type badge (learner/restricted/full) with Mail/Phone icons for readability.

---

- **Date:** 2026-02-05 (Pacific/Auckland)
- **Task:** Refine students rows layout
- **Summary:**
  - Moved student email under the student name and removed the avatar/initials circle.
  - Right-aligned the licence badge next to the chevron, and adjusted table columns accordingly.

---

- **Date:** 2026-02-05 (Pacific/Auckland)
- **Task:** Students list phone/icon + licence circle
- **Summary:**
  - Moved the phone icon from each row into the Phone column header (table layout).
  - Changed the licence type indicator into a circular icon showing only the first letter (L/R/F) with type-based coloring.

---

- **Date:** 2026-02-05 (Pacific/Auckland)
- **Task:** Home weather actions icon-only
- **Summary:**
  - Made the Home Weather widget action buttons (Refresh / Use my location) icon-only while keeping accessibility labels for screen readers.

---

- **Date:** 2026-02-05 (Pacific/Auckland)
- **Task:** Fix header safe area + enhance weather widget
- **Summary:**
  - Wrapped the app in `SafeAreaProvider` to restore correct top insets on edge-to-edge Android and prevent the header from overlapping the syst...
  - Increased the hamburger and avatar size and aligned them to the same height for a better phone experience.

---

- **Date:** 2026-02-05 (Pacific/Auckland)
- **Task:** Tweak weather layout + 4-day forecast
- **Summary:**
  - Moved the Weather Updated line directly under Right now and removed it from the wind row.
  - Expanded the forecast list to show the next 4 days (fetching 5 total days including today).

---

- **Date:** 2026-02-05 (Pacific/Auckland)
- **Task:** Remove current weather icon box
- **Summary:**
  - Removed the bordered/rounded container behind the current-condition icon so the icon renders on its own.

---

- **Date:** 2026-02-05 (Pacific/Auckland)
- **Task:** Org logo styling + student form requirements
- **Summary:**
  - Removed bordered box styling around the organization logo in the drawer, onboarding logo preview, and Settings.
  - Updated New/Edit Student form to require email, phone, and licence type; removed licence clear action.

---

- **Date:** 2026-02-05 (Pacific/Auckland)
- **Task:** Preserve org logo PNG transparency
- **Summary:**
  - Fixed org logo uploads to use the original file bytes from `asset.uri` (instead of `ImagePickerAsset.base64`, which is JPEG), preserving PNG...
  - Updated onboarding + Settings org-logo picker to disable editing to avoid platform re-encoding and keep original formats.

---

- **Date:** 2026-02-05 (Pacific/Auckland)
- **Task:** Enlarge header controls on tablet portrait
- **Summary:**
  - Increased hamburger + avatar sizes slightly for tablet portrait only, keeping mobile sizing unchanged.

---

- **Date:** 2026-02-05 (Pacific/Auckland)
- **Task:** Student profile grid + session history
- **Summary:**
  - Updated `StudentDetailScreen` Contact/Licence sections to use a 2-column layout (Email+Phone; Type+Number; Version+Class held).
  - Added a new `StudentSessionHistoryScreen` with a quick "New session" form (tasks multi-select with collapsible suggestions) and a session li...

---

- **Date:** 2026-02-05 (Pacific/Auckland)
- **Task:** Fix new session time/duration validation
- **Summary:**
  - Fixed Zod regex escaping so `Time` (`HH:mm`) and `Duration (min)` accept valid values and the session can be saved.

---

- **Date:** 2026-02-05 (Pacific/Auckland)
- **Task:** Polish new session suggestions + confirm save
- **Summary:**
  - Moved Task suggestions above custom-task input and added a high-visibility Show/Hide toggle (green in light mode, yellow in dark mode).
  - Added a save confirmation dialog before creating a new session.

---

- **Date:** 2026-02-05 (Pacific/Auckland)
- **Task:** Make suggestions toggle text-only
- **Summary:**
  - Changed the Task suggestions Show/Hide control from a button style to underlined colored text (green in light mode; yellow in dark mode).

---

- **Date:** 2026-02-05 (Pacific/Auckland)
- **Task:** Refine student profile contact/licence layout
- **Summary:**
  - Split Contact, Licence, and Notes into separate containers on the Student profile screen.
  - Updated Contact/Licence details to use inline label/value rows (Address remains stacked) and paired Licence fields (Type+Number, Version+Cla...

---

- **Date:** 2026-02-05 (Pacific/Auckland)
- **Task:** Tighten contact row spacing
- **Summary:**
  - Reduced the spacing between inline labels (e.g. `Email:`) and values on the Student profile screen.

---

- **Date:** 2026-02-05 (Pacific/Auckland)
- **Task:** Tighten licence inline spacing
- **Summary:**
  - Adjusted inline detail rows to keep the space after `:` tight while keeping Licence rows neatly aligned.

---

- **Date:** 2026-02-05 (Pacific/Auckland)
- **Task:** Left-align inline contact/licence rows
- **Summary:**
  - Updated inline detail rows to render as `Label: value` with minimal spacing and consistent left alignment (no right-justified label column).

---

- **Date:** 2026-02-05 (Pacific/Auckland)
- **Task:** Show upcoming lessons on Home
- **Summary:**
  - Updated the Home "Today" card to list each lesson (student full name + start/end time) instead of a count.
  - Added an "Next 3 days" section showing upcoming lessons grouped by day.

---

- **Date:** 2026-02-05 (Pacific/Auckland)
- **Task:** Use 12h time format on Home
- **Summary:**
  - Updated lesson time ranges on Home to use 12-hour format (e.g. `10:15 am - 10:30 am`).

---

- **Date:** 2026-02-05 (Pacific/Auckland)
- **Task:** Rename Today heading on Home
- **Summary:**
  - Renamed the Home lessons card heading from "Today" to "Upcoming Lessons Today".

---

- **Date:** 2026-02-05 (Pacific/Auckland)
- **Task:** Underline next-days date headers
- **Summary:**
  - Underlined the day/date headers in the "Next 3 days" section and matched the font size to student rows.

---

- **Date:** 2026-02-05 (Pacific/Auckland)
- **Task:** Settings: Account settings + instructor creation
- **Summary:**
  - Renamed Settings "Profile" section to "Account Settings" and displays full name (first + last) when available.
  - Added profile photo actions (take photo, choose from library, remove photo).

---

- **Date:** 2026-02-06 (Pacific/Auckland)
- **Task:** Fix release build crash (Supabase env)
- **Summary:**
  - Fixed Supabase env resolution for native builds by avoiding dynamic `process.env[key]` access and supporting Expo `extra` fallback.
  - Added `app.config.ts` to surface Supabase values in `expo.extra` for builds.

---

- **Date:** 2026-02-06 (Pacific/Auckland)
- **Task:** Estimate solo-dev timeline (no AI)
- **Summary:**
  - Provided a rough full-time solo developer estimate for implementing the v1 mobile app scope end-to-end (Expo RN + Supabase + RLS + PDF expor...

---

- **Date:** 2026-02-07 (Pacific/Auckland)
- **Task:** Route deleted/stale sessions to login
- **Summary:**
  - Added startup session validation against Supabase Auth (`getUser`) before trusting a restored local session.
  - Added stale-session detection (invalid JWT/missing user/auth-session-missing patterns + 401/403/404) and local sign-out cleanup.

---

- **Date:** 2026-02-07 (Pacific/Auckland)
- **Task:** Add onboarding back button to login
- **Summary:**
  - Added a back action on `OnboardingCreateOrgScreen` so users can return to the sign-in screen.
  - Implemented the action with `navigation.replace("Login")` to avoid leaving onboarding on the back stack.

---

- **Date:** 2026-02-07 (Pacific/Auckland)
- **Task:** Fix students first-load list render + mobile licence buttons + traffic toggle
- **Summary:**
  - Fixed students list rendering in compact/mobile layout by removing nested compact-mode scroll rendering that could collapse row content on f...
  - Updated New/Edit Student licence type controls to always use rectangular segmented-style buttons (`Learner`, `Restricted`, `Full`) instead o...

---

- **Date:** 2026-02-07 (Pacific/Auckland)
- **Task:** Remove Google Maps share-guide PDF feature
- **Summary:**
  - Removed the `Share Maps Guide (PDF)` button from Google Maps.
  - Deleted the temporary in-app PDF guide module that was added for sharing.

---

- **Date:** 2026-02-07 (Pacific/Auckland)
- **Task:** Signup email verification confirmation dialog
- **Summary:**
  - Updated `Create account` flow to show a confirmation alert after sign-up when email verification is required.
  - Alert message is `Check your email to verify your account.` and `OK` returns the user to `Login`.

---

- **Date:** 2026-02-07 (Pacific/Auckland)
- **Task:** Force consistent default light theme on first launch
- **Summary:**
  - Fixed theme hydration mismatch by syncing provider state and NativeWind color scheme from a single resolved value (`stored` or default `ligh...
  - Added a theme-ready gate in root navigation to avoid rendering mixed themed surfaces before color scheme initialization finishes.

---

- **Date:** 2026-02-07 (Pacific/Auckland)
- **Task:** Confirm before creating student + rename create CTA
- **Summary:**
  - Added a confirmation alert on `StudentCreate` submit with `Back` and `Confirm` options before persisting a new student.
  - Kept edit flow unchanged (updates still save directly).

---

- **Date:** 2026-02-07 (Pacific/Auckland)
- **Task:** Add hazard detection and response controls to full mock test
- **Summary:**
  - Added a new `Hazard Detection and Response` section above `Assessment items (Pass/Fail)` in `Mock Test - Full License`.
  - Implemented category rows (`Pedestrians`, `Vehicles`, `Others`) with letter-box subcategories and a Yes/No/N/A modal picker.

---

- **Date:** 2026-02-07 (Pacific/Auckland)
- **Task:** Align full mock test hazard columns vertically
- **Summary:**
  - Updated hazard matrix layout to use fixed direction columns (`L`, `R`, `A`, `B`, `O`) for every category row.
  - Added empty placeholders for directions not used in a category so matching subcategory letters align vertically across rows.

---

- **Date:** 2026-02-07 (Pacific/Auckland)
- **Task:** Archive PROJECT_LOG and enforce 30-entry cap
- **Summary:**
  - Archived older entries from `PROJECT_LOG.md` into `docs/logs/PROJECT_LOG_ARCHIVE.md`.
  - Added a 30-entry rolling cap rule and archive instructions in `AGENTS.md`.

---

- **Date:** 2026-02-07 (Pacific/Auckland)
- **Task:** Reduce active project log cap to 20 entries
- **Summary:**
  - Updated logging policy to keep only the latest 20 entries in `PROJECT_LOG.md`.
  - Archived older active entries into `docs/logs/PROJECT_LOG_ARCHIVE.md` to match the new cap.

---

- **Date:** 2026-02-07 (Pacific/Auckland)
- **Task:** Add admin role with owner-equivalent permissions
- **Summary:**
  - Added a new Supabase migration to allow `profiles.role = 'admin'` and apply owner-equivalent RLS behavior for admin users.
  - Updated app role gates so owner-only flows (logo management, instructor creation, assignment controls) also allow admins.

---

- **Date:** 2026-02-07 (Pacific/Auckland)
- **Task:** Auto-scroll Settings themes dropdown to bottom
- **Summary:**
  - Added scroll ref support to shared `Screen` so screens can programmatically control the underlying `ScrollView` when needed.
  - Updated `SettingsScreen` to auto-scroll to the bottom when the Themes dropdown opens, so all theme options are immediately visible.

---

- **Date:** 2026-02-07 (Pacific/Auckland)
- **Task:** Tablet keyboard fix, mode-based themes, and member active student links
- **Summary:**
  - Improved shared `Screen` keyboard handling for tablet portrait so focused lower-half inputs are auto-scrolled above the keyboard.
  - Reworked theming into separate Light and Dark preset catalogs with default + 6 custom options each, and renamed the settings label to `Theme...

---

- **Date:** 2026-02-07 (Pacific/Auckland)
- **Task:** Member profile details flow + custom theme system
- **Summary:**
  - Reordered owner/admin Organization actions so `View members` appears below `Change organization logo`.
  - Added owner/admin member tap-through profile screen with member avatar/name/contact details, active student count, and next 3 lessons.

---

- **Date:** 2026-02-07 (Pacific/Auckland)
- **Task:** Drawer alignment, student role-grouping, and members directory screen
- **Summary:**
  - Updated drawer layout so `Sign out` is right-aligned and added a divider between `Google Maps` and `Settings`.
  - Added owner-only `View Instructor's Students` toggle (`Hide`/`Show`) beside Sort in Students and grouped visible students into role-based bl...

---

- **Date:** 2026-02-07 (Pacific/Auckland)
- **Task:** Fix create-instructor Invalid JWT gateway rejection
- **Summary:**
  - Updated `create-instructor` edge function to parse bearer token explicitly and validate caller identity with `auth.getUser(accessToken)`.
  - Removed dependency on forwarding global authorization headers inside the service-role client for caller validation.

---

- **Date:** 2026-02-07 (Pacific/Auckland)
- **Task:** Harden Add Instructor function call with direct fetch + detailed errors
- **Summary:**
  - Replaced `supabase.functions.invoke` in instructor creation with direct `fetch` to `/functions/v1/create-instructor`.
  - Sends explicit `Authorization`, `apikey`, and `Content-Type` headers on every request.

---

- **Date:** 2026-02-07 (Pacific/Auckland)
- **Task:** Fix Add Instructor edge invocation auth headers
- **Summary:**
  - Updated instructor creation API call to explicitly attach the signed-in access token as `Authorization: Bearer <token>` for the `create-inst...
  - Added explicit `apikey` header (`SUPABASE_ANON_KEY`) on function invoke to avoid edge gateway auth/header mismatches.

---

- **Date:** 2026-02-07 (Pacific/Auckland)
- **Task:** Navigation, students-load fix, home shortcuts, and settings role/org updates
- **Summary:**
  - Reordered drawer items so `Settings` is directly below `Google Maps`; moved `Sign out` to the very bottom under the user block; made sign-ou...
  - Fixed intermittent Students first-load blank state by removing nested table `ScrollView` rendering and simplifying row container rendering;....

---

- **Date:** 2026-02-07 (Pacific/Auckland)
- **Task:** Snapshot text sizes + automatic student auto-pin
- **Summary:**
  - Added selectable text-size controls in Snapshot Annotation and persisted text size in annotation payloads.
  - Updated snapshot editor and preview rendering to respect per-text font size, with backward-compatible default sizing for existing saved snap...

---

- **Date:** 2026-02-07 (Pacific/Auckland)
- **Task:** Harden icon-only button centering for map controls
- **Summary:**
  - Added a dedicated `icon` button size in shared theme/button primitives to avoid conflicting NativeWind utility classes for icon-only control...
  - Updated icon-only buttons on Google Maps, Snapshot Annotation modal, and Lessons month navigation to use `size="icon"` instead of class-base...

---

- **Date:** 2026-02-07 (Pacific/Auckland)
- **Task:** Center Google Maps add-pin icon button
- **Summary:**
  - Fixed shared `AppButton` icon-only layout so internal content gap is only applied when both icon and label exist.
  - This centers icon-only buttons, including the top-right Google Maps add-pin button.

---

- **Date:** 2026-02-07 (Pacific/Auckland)
- **Task:** Google Maps cleanup: remove vectors + snapshot UI updates
- **Summary:**
  - Removed Anchored vector workflows from the Google Maps UI and map annotation codec, keeping snapshot annotations and pin workflows intact.
  - Updated map controls layout: removed top-right refresh, changed add button icon to Lucide `Pin`, moved layer tabs above address search, and....

---

- **Date:** 2026-02-07 (Pacific/Auckland)
- **Task:** Google Maps main-map annotations + NZ address autocomplete
- **Summary:**
  - Added main-map annotation support so anchored vectors and snapshots work even when no pin is selected.
  - Added drawing controls for anchored vectors and snapshots: color, line thickness, text placement, undo, and redo.

---

- **Date:** 2026-02-07 (Pacific/Auckland)
- **Task:** Add anchored vectors, snapshots, and student address auto-pin in Google Maps
- **Summary:**
  - Added persistent map annotations with two modes: anchored vector drawings (lat/lng polylines) and snapshot annotations (map capture + doodle...
  - Added annotation data layer and query hooks plus a new Supabase migration/table for multi-tenant annotation storage with role-safe RLS polic...

---

- **Date:** 2026-02-07 (Pacific/Auckland)
- **Task:** Fix react-native-maps config plugin startup error
- **Summary:**
  - Removed dynamic app config plugin injection for react-native-maps, which caused Expo startup to fail.
  - Kept Google Maps key wiring in app config using native fields instead (ios config googleMapsApiKey and android config googleMaps apiKey).

---

- **Date:** 2026-02-07 (Pacific/Auckland)
- **Task:** Add Google Maps screen with persistent pins
- **Summary:**
  - Added a new drawer route Google Maps with a near full-screen interactive map view.
  - Implemented map layer switching (Default, Satellite, Hybrid) and pin creation via long-press or map-center placement.

---

- **Date:** 2026-02-07 (Pacific/Auckland)
- **Task:** Refactor AGENTS.md using full project log history
- **Summary:**
  - Reviewed all entries in `PROJECT_LOG.md` and `docs/logs/PROJECT_LOG_ARCHIVE.md` to align instructions with current implemented behavior.
  - Replaced the oversized spec-style `AGENTS.md` with a concise operations guide focused on current app reality and durable working rules.

---

- **Date:** 2026-02-07 (Pacific/Auckland)
- **Task:** Add delete actions and save confirmations for students/lessons
- **Summary:**
  - Excluded `admin` from assignable instructor options on `New student` and `New lesson` screens.
  - Added save confirmations for `Edit student` and for both `New lesson`/`Edit lesson` submissions.

---

- **Date:** 2026-02-07 (Pacific/Auckland)
- **Task:** Add drawer sign-out with confirmation
- **Summary:**
  - Added a `Sign out` action in the sidebar menu above the bottom divider/settings block.
  - Added a confirmation alert (`Cancel` / `Sign out`) before signing out.

---

- **Date:** 2026-02-07 (Pacific/Auckland)
- **Task:** Batch 1 refactor: dead code cleanup + type safety hardening
- **Summary:**
  - Removed unreachable navigation/screen code (`MainTabsNavigator`, `EditNameScreen`) and related unused account name-update schema/query/api p...
  - Replaced remaining real `any` usages with typed alternatives in weather parsing and driving-assessment RHF field-path wiring.

---

- **Date:** 2026-02-07 (Pacific/Auckland)
- **Task:** Refactor Batch 2+3: query invalidation helpers + shared async UI states
- **Summary:**
  - Added `invalidateQueriesByKey` helper to centralize parallel React Query cache invalidation calls and reduced duplicated invalidation blocks...
  - Added reusable async-state UI primitives (`CenteredLoadingState`, `ErrorStateCard`, `EmptyStateCard`) for consistent loading/error/empty ren...

---

- **Date:** 2026-02-07 (Pacific/Auckland)
- **Task:** Assessments student filtering toggle + full mock optional spoken fields
- **Summary:**
  - Updated all three assessment student selectors (`Driving Assessment`, `Mock Test - Restricted Licence`, `Mock Test - Full License`) so owner...
  - Added a right-aligned `Other Instructor's Students` segmented toggle (`Hide`/`Show`) on the same row as the `Student` heading in those three...

---

- **Date:** 2026-02-07 (Pacific/Auckland)
- **Task:** Group other instructors' students in assessment pickers
- **Summary:**
  - Updated `Driving Assessment`, `Mock Test - Restricted Licence`, and `Mock Test - Full License` student pickers so owner/admin `Show` mode no...
  - Added grouped picker layout in `Show` mode: `Your students` block first, followed by separate instructor blocks below, each labeled with the...

---

- **Date:** 2026-02-07 (Pacific/Auckland)
- **Task:** Students pagination, assessment dropdown picker, optional driving scoring UX, and lesson/profile cou...
- **Summary:**
  - Added a new reusable assessment student dropdown with search and scrollable list behavior, showing up to 6 visible rows, alphabetized with t...
  - Replaced the old button-list student selectors in all three assessment start screens with the dropdown flow.

---

- **Date:** 2026-02-08 (Pacific/Auckland)
- **Task:** Google Maps pin color categories + configurable defaults
- **Summary:**
  - Added marker color categories on Google Maps so pins are visually differentiated for active students, other instructor's students, custom pi...
  - Added a Pin colors editor in the top Google Maps panel with color swatches, plus a Reset action.

---

- **Date:** 2026-02-08 (Pacific/Auckland)
- **Task:** App-wide tablet keyboard avoidance for bottom-half inputs
- **Summary:**
  - Updated shared `Screen` keyboard behavior so tablet portrait keyboard avoidance now applies to both scroll and non-scroll screens.
  - Lowered tablet detection threshold from `768` to `600` width to cover common Android tablet sizes.

---

- **Date:** 2026-02-08 (Pacific/Auckland)
- **Task:** Add student organization field + list filtering
- **Summary:**
  - Added `Organization` input to `New/Edit student` directly below Address, with quick-pick options (`Private`, `UMMA Trust`, `Renaissance`, `L...
  - Persisted `organization_name` in students CRUD payloads and added schema/type support across form validation and Supabase table typings.

---

- **Date:** 2026-02-08 (Pacific/Auckland)
- **Task:** Refine student assignment dropdown + organization show-all order + profile action placement
- **Summary:**
  - Updated `New student` owner/admin assignment UX to use an instructor dropdown instead of listing all instructor buttons.
  - Added a left-aligned trigger button label (`Assign new student to an Instructor`) with centered dropdown choices and centered selected state...

---

- **Date:** 2026-02-08 (Pacific/Auckland)
- **Task:** Add student licence front/back photo upload + profile gallery viewer
- **Summary:**
  - Added student licence photo upload support in the student feature API/query layer with storage upload + signed URL persistence (`license_fro...
  - Added Supabase migration `017_students_license_images.sql` and storage policy script for private `student-licenses` bucket paths (`<organiza...

---

- **Date:** 2026-02-08 (Pacific/Auckland)
- **Task:** Refine student licence photo management + add date of birth
- **Summary:**
  - Added `students.date_of_birth` support end-to-end (migration `018`, Supabase types, Add/Edit form field with date picker, save/update mappin...
  - Updated Student Profile to display `Address: <value>` inline, show date of birth and computed age, and capitalize licence type labels (`Lear...

---

- **Date:** 2026-02-08 (Pacific/Auckland)
- **Task:** Reset Students filters on revisit + student photo options UX polish
- **Summary:**
  - Updated `Students` screen focus behavior so every re-entry resets controls to defaults: `Status=Active`, `Sort=Recent`, `By organization=Off...
  - Updated `Edit student` assignable instructor list to always exclude `admin` role entries.

---

- **Date:** 2026-02-08 (Pacific/Auckland)
- **Task:** Delete student licence files on student delete + crop-label feasibility check
- **Summary:**
  - Updated student delete flow to first fetch the student's `organization_id`, delete all files under `student-licenses/<organization_id>/<stud...
  - This ensures licence front/back images are removed from Supabase Storage when a student is deleted.

---

- **Date:** 2026-02-08 (Pacific/Auckland)
- **Task:** Student delete warning + history cascade cleanup + licence photo UI polish
- **Summary:**
  - Updated student delete API flow to remove related `student_sessions` and `assessments` records before deleting the student row.
  - Kept storage cleanup on delete by removing files under `student-licenses/<organization_id>/<student_id>/`.

---

- **Date:** 2026-02-08 (Pacific/Auckland)
- **Task:** Organization picker modal UX + left-aligned selected value
- **Summary:**
  - Updated `New/Edit student` Organization field to show selected value left-aligned in the trigger button (e.g., `Private`).
  - Replaced inline organization dropdown expansion with a modal action-sheet style picker (matching the photo options modal pattern).

---

- **Date:** 2026-02-08 (Pacific/Auckland)
- **Task:** Students list organization label + licence badge styling update
- **Summary:**
  - Replaced the Students table row text next to the licence badge from licence type labels to the student `organization_name`.
  - Renamed the right-side column header from `Licence` to `Organization` while keeping the L/R/F circular badge visible.

---

- **Date:** 2026-02-08 (Pacific/Auckland)
- **Task:** Full badge orange + compact logging system
- **Summary:**
  - Changed the Students screen `Full` licence badge color from green to orange.
  - Replaced the heavy log format with compact `Date/Task/Summary` entries and reduced archive size significantly.

---

- **Date:** 2026-02-21 (Pacific/Auckland)
- **Task:** New lesson layout refinements
- **Summary:**
  - Rendered selected student address directly under the student picker and increased selected student name emphasis.
  - Moved Start time + Duration into a 2-column row for faster scheduling.

---

- **Date:** 2026-02-11 (Pacific/Auckland)
- **Task:** Licence upload width set to 500px
- **Summary:**
  - Updated automatic licence card image resize width from `400px` to `500px` for Front/Back uploads.

---

- **Date:** 2026-02-11 (Pacific/Auckland)
- **Task:** Licence compression width + Stage 2 roundabout task
- **Summary:**
  - Updated licence card upload compression to use a max width of `400px` (from `580px`).
  - Added `Left turn at roundabout` (4 reps) to Restricted Stage 2 so assessment entry, history, and PDF use the same updated task set.

---

- **Date:** 2026-02-09 (Pacific/Auckland)
- **Task:** Student profile detail-card layout refresh
- **Summary:**
  - Restyled Student Profile Contact and Licence details into left-aligned boxed fields that match the licence photo action button visual style.
  - Reordered Contact/Licence rows to the requested 2-column structure, moved organization under the student name with an icon, and pushed Archi...

---

- **Date:** 2026-02-09 (Pacific/Auckland)
- **Task:** Maps pin-panel redesign + assessment picker and start-flow updates
- **Summary:**
  - Removed Google Maps top `Pin colors` panel, redesigned selected-pin actions/details (icon-only delete, color picker button, tip + right-alig...
  - Updated assessment student picker behavior to only show results after typing search text, switched Driving Assessment start confirmation to....

---

- **Date:** 2026-02-09 (Pacific/Auckland)
- **Task:** Student assessment launch modal + mock-test start modals
- **Summary:**
  - Set Student Profile organization text to `25px`, added a `Start Assessment` action button, and added an assessment-type modal that deep-link...
  - Updated Driving Assessment modal wording to `You are about to start assessing ...` and added equivalent start-confirmation modals to Restric...

---

- **Date:** 2026-02-09 (Pacific/Auckland)
- **Task:** Student profile address layout stabilization + assessment picker collapse
- **Summary:**
  - Refactored Student Profile detail-field sizing so full-width Address renders consistently inside the Contact card and reduced organization n...
  - Updated assessment student dropdown behavior to auto-collapse when a student is pre-selected (including launches from Student Profile `Start...

---

- **Date:** 2026-02-09 (Pacific/Auckland)
- **Task:** Students drawer reset + Student Profile bottom action grid
- **Summary:**
  - Updated sidebar `Students` navigation to always open `StudentsList` instead of returning to previously viewed student profile screens.
  - Reworked Student Profile bottom actions into 2-column rows with requested order and styling, including blue `Start Assessment` with icon and...

---

- **Date:** 2026-02-09 (Pacific/Auckland)
- **Task:** Lessons calendar square connected date cells
- **Summary:**
  - Updated the Lessons month calendar date cells to remove rounded corners and remove spacing so cells connect as a continuous grid.
  - Updated the weekly date strip in the Lessons agenda card to use square, connected date boxes for consistent calendar styling.

---

- **Date:** 2026-02-09 (Pacific/Auckland)
- **Task:** Global back button beside header menu with Home fallback
- **Summary:**
  - Added a shared header-left menu+back control across main app stacks so screens include both hamburger and back buttons, while Home keeps no....
  - Back action now uses stack `goBack()` when possible and falls back to drawer navigation to `HomeDashboard` as the final destination.

---

- **Date:** 2026-02-09 (Pacific/Auckland)
- **Task:** Student Profile history badge placement and 2-digit badge fix
- **Summary:**
  - Updated Student Profile `Session History` and `Assessment History` buttons so count badges sit at the top-right of the label text instead of...
  - Hardened badge pill sizing/text behavior to keep multi-digit counts on one line.

---

- **Date:** 2026-02-09 (Pacific/Auckland)
- **Task:** Student profile style tweaks + active assessment back confirmation
- **Summary:**
  - Updated Student Profile organization text under the student name to `25px` and set Archive/Unarchive actions to green styling.
  - Added a shared assessment leave-guard across Driving, Restricted, and Full mock test screens to confirm before leaving once a test is in pro...

---

- **Date:** 2026-02-09 (Pacific/Auckland)
- **Task:** Student Profile organization size, dark-green archive buttons, and safer bottom-action spacing
- **Summary:**
  - Updated Student Profile organization subtitle text under the student name to `23px` and changed Archive/Unarchive buttons to dark green.
  - Added a minimum spacer before Archive/Delete actions so destructive buttons are consistently lower and require scroll access on tighter prof...

---

- **Date:** 2026-02-09 (Pacific/Auckland)
- **Task:** Student reminders feature + Student Profile action-row redesign
- **Summary:**
  - Added a new student Reminders flow: dedicated screen, reminder list, create/delete actions, reminder date, and notification lead-time option...
  - Updated Student Profile actions by replacing top-right `Add session` with icon-only Edit and replacing the lower `Edit` button with `Reminde...

---

- **Date:** 2026-02-09 (Pacific/Auckland)
- **Task:** Assessment submit return-to-profile flow + driving suggestion priority
- **Summary:**
  - Updated all assessment submit flows to return to `StudentDetail` when launched from Student Profile, instead of dropping users on the Assess...
  - Moved the "Smoother Steering Control - Avoid oversteering..." improvement suggestion to the top of the Driving Assessment suggestions list.

---

- **Date:** 2026-02-09 (Pacific/Auckland)
- **Task:** Reminders screen modal create flow + simplified layout
- **Summary:**
  - Removed the top Reminders summary container and switched `Add new` to a full modal create flow with `Title`, input, `Date`, `Time`, and `Not...
  - Added a `2 days before` notification option and wired reminder `Time` through DB + notification scheduling while keeping the requested helpe...

---

- **Date:** 2026-02-09 (Pacific/Auckland)
- **Task:** Reminders modal time hint sync + assessment student switch fix
- **Summary:**
  - Updated Add Reminder modal title to `Add New Reminder` and made the notification helper text dynamically reflect the currently selected remi...
  - Fixed assessment submit/start navigation so completed assessment screens are popped to `AssessmentsMain` on submit, preventing stale student...

---

- **Date:** 2026-02-09 (Pacific/Auckland)
- **Task:** Assessment submit options + upcoming reminders
- **Summary:**
  - Added `Submit` vs `Submit and Generate PDF` options across assessments and hardened navigation/state resets so each new assessment starts cl...
  - Added Home `Upcoming Reminders` (5 soonest) and sorted reminders by reminder date/time for consistent ordering.

---

- **Date:** 2026-02-09 (Pacific/Auckland)
- **Task:** Assessment blank screen scroll fix
- **Summary:**
  - Fixed assessment screens rendering blank until you scroll by forcing the ScrollView to reset to top on focus and after student/test resets.

---

- **Date:** 2026-02-09 (Pacific/Auckland)
- **Task:** Lessons calendar reminder markers + legend
- **Summary:**
  - Replaced the Lessons calendar today dot with a circled day highlight and added reminder markers with a legend.
  - Updated the weekly strip to show lesson vs reminder markers consistently.

---

- **Date:** 2026-02-09 (Pacific/Auckland)
- **Task:** Session History edit flow + Lessons agenda reminders
- **Summary:**
  - Defaulted Session History task suggestions to show and added an edit/update action for session entries.
  - Updated the Lessons agenda to list reminders for the selected day and removed the duplicate New button.

---

- **Date:** 2026-02-09 (Pacific/Auckland)
- **Task:** Lessons agenda title + upcoming reminders student label
- **Summary:**
  - Added a Lessons section title in the Lessons agenda card for visual consistency with Reminders.
  - Updated Home Upcoming Reminders to show the student name more clearly.

---

- **Date:** 2026-02-09 (Pacific/Auckland)
- **Task:** Lessons reminders show student name
- **Summary:**
  - Updated Lessons selected-day Reminders list to show student name above reminder title.
  - Joined student names in the reminders date-range query used by the Lessons calendar.

---

- **Date:** 2026-02-09 (Pacific/Auckland)
- **Task:** Tablet landscape layouts + collapsed sidebar default
- **Summary:**
  - Improved tablet-landscape layouts across key screens (Home, Settings, Assessments, Student Detail, Lesson Edit) while keeping tablet-portrait unchanged.
  - Set the permanent sidebar to start collapsed in tablet-landscape and removed landscape max-width constraints to eliminate side whitespace.

---

- **Date:** 2026-02-09 (Pacific/Auckland)
- **Task:** Theme coverage for recent UI updates
- **Summary:**
  - Fixed missing theme classes for primary/border tokens in badges, dividers, avatars, and assessment history chips.
  - Updated a few icon color fallbacks to respect dark-mode palette variants.

---

- **Date:** 2026-02-09 (Pacific/Auckland)
- **Task:** Mobile portrait layout polish
- **Summary:**
  - Reduced mobile (compact) screen padding/spacing to fit more content without cramped cards.
  - Tightened key screens (Home quick-actions + titles, Student Detail header, and compact form spacing) while keeping tablet layouts unchanged.

---

- **Date:** 2026-02-09 (Pacific/Auckland)
- **Task:** Mobile portrait compact spacing pass
- **Summary:**
  - Reduced global card and picker modal padding for compact/mobile screens to fit more content per view.
  - Updated remaining screens to use compact gaps/modal padding while keeping tablet layouts unchanged.

---

- **Date:** 2026-02-09 (Pacific/Auckland)
- **Task:** Lessons editor UX + history badge fix
- **Summary:**
  - Fixed Student Profile history/reminder count badges so they position correctly on tablet portrait buttons.
  - Updated Lesson Create/Edit screens to use search-only student results, hide student selection on edit, hide instructor selection when no instructors exist, and exclude admin accounts.

---

- **Date:** 2026-02-09 (Pacific/Auckland)
- **Task:** Student Profile kebab action menu + remove bottom archive row
- **Summary:**
  - Replaced the top-right edit icon with a taller kebab action button and added a dropdown-style modal menu for Edit, Sessions, Assessments, Archive/Unarchive, and Delete.
  - Removed the bottom Archive/Delete buttons from Student Profile to simplify layout and avoid the intermittent action-row UI overlap state.

---

- **Date:** 2026-02-09 (Pacific/Auckland)
- **Task:** Student Profile badge overlap fix
- **Summary:**
  - Adjusted `AppButton` label-badge positioning and stacking so Student Profile count badges don't clip/overlap adjacent buttons.

---

- **Date:** 2026-02-09 (Pacific/Auckland)
- **Task:** Student Profile second-visit action layout stabilization
- **Summary:**
  - Stabilized second-visit action button rendering by resetting Student Detail transient UI state and scroll position every time the screen regains focus.

---

- **Date:** 2026-02-09 (Pacific/Auckland)
- **Task:** Student Profile focus reset for revisit stability
- **Summary:**
  - Fixed the second-visit action-row clipping pattern by resetting Student Detail transient UI state and scroll position every time the screen regains focus.

---

- **Date:** 2026-02-09 (Pacific/Auckland)
- **Task:** Student Profile second-visit clipping fix (ScrollView flex)
- **Summary:**
  - Removed `flex-1` container sizing from Student Profile scroll layout to prevent Android ScrollView content mis-measurement on revisit.

---

- **Date:** 2026-02-09 (Pacific/Auckland)
- **Task:** Student Profile kebab menu counts + reminders action polish
- **Summary:**
  - Added `Reminders` to the Student Profile kebab menu between Sessions and Assessments, renamed `Edit` to `Edit details`, and added right-side count badges for Sessions, Reminders, and Assessments.
  - Styled kebab `Archive/Unarchive` action text/icon green and updated the main profile action button to green `Set Reminders`.

---

- **Date:** 2026-02-09 (Pacific/Auckland)
- **Task:** Student Profile kebab menu hide zero badges
- **Summary:**
  - Updated Student Profile kebab menu badge rendering so Sessions, Reminders, and Assessments badges are hidden when the count is `0`.

---

- **Date:** 2026-02-09 (Pacific/Auckland)
- **Task:** Student Profile kebab sizing consolidation + label/icon polish
- **Summary:**
  - Consolidated repetitive kebab-size adjustments into one record and finalized the trigger at `55px` square (`h-[55px] w-[55px]`) with a larger `30px` icon.
  - Increased the organization name text under the student title from `23px` to `24px`.

---

- **Date:** 2026-02-09 (Pacific/Auckland)
- **Task:** Student Profile kebab archive/delete text emphasis
- **Summary:**
  - Updated kebab menu `Delete` label to explicit red text and made both `Archive/Unarchive` and `Delete` labels bold for stronger visual emphasis.

---

- **Date:** 2026-02-09 (Pacific/Auckland)
- **Task:** Student Profile kebab archive/delete true bold fix
- **Summary:**
  - Switched kebab `Archive/Unarchive` and `Delete` label rendering to `AppText` `button` variant (semibold font family) because utility `font-semibold` is overridden by the component-level font family on `body` variant.
  - Kept `Delete` label red and `Archive/Unarchive` green with the corrected bold rendering.

---

- **Date:** 2026-02-10 (Pacific/Auckland)
- **Task:** Restricted mock test repetitions + UI polish
- **Summary:**
  - Added per-task repetition recording (with confirmation) and displayed repetition totals per task/stage in the Restricted mock test.
  - Kept the Restricted mock test header/student/overview sticky, redesigned fault selection as 2-column buttons, added collapsible errors, and included repetitions in PDF + assessment history.

---

- **Date:** 2026-02-10 (Pacific/Auckland)
- **Task:** Assessment PDF header/logo styling
- **Summary:**
  - Added organization logo + student name to generated assessment PDFs (Driving Assessment, Restricted mock test, Full License mock test).
  - Standardized section borders across assessment PDFs to match the scoring guide style (darker border, square corners).

---

- **Date:** 2026-02-10 (Pacific/Auckland)
- **Task:** Restricted mock test default collapse + show/hide colors
- **Summary:**
  - Set Stage 1, Critical errors, and Immediate failure errors to be collapsed by default when the Restricted mock test is initiated.
  - Added per-section Show/Hide color rules: blue/red for stage+error sections and lighter blue/red for task cards.

---

- **Date:** 2026-02-10 (Pacific/Auckland)
- **Task:** First-time guide for restricted mock test
- **Summary:**
  - Added a plain-language step-by-step guide for instructors using Mock Test - Restricted Licence for the first time.
  - Included workflow coverage for stages, faults, repetitions, error sections, submit options, and history/PDF follow-up.

---

- **Date:** 2026-02-10 (Pacific/Auckland)
- **Task:** Restricted mock test task modal + pre-drive grid
- **Summary:**
  - Arranged pre-drive fields into two-column rows (Date/Time, Vehicle/Route) for tablet-friendly data entry.
  - Replaced task dropdown cards with task buttons that open a modal (faults, location, notes), and moved Record repetition into the modal header.

---

- **Date:** 2026-02-10 (Pacific/Auckland)
- **Task:** Restricted mock test task modal spacing polish
- **Summary:**
  - Adjusted task modal scroll sizing so the modal shrinks to its content (removing excess whitespace while staying centered).
  - Updated the restricted mock test first-time guide to match the task popup workflow and repetition button placement.

---

- **Date:** 2026-02-10 (Pacific/Auckland)
- **Task:** Restricted mock test repetitions/faults header styling
- **Summary:**
  - Moved faults counts into the same line as repetitions for Stage headers, task cards, and the task modal (blue Repetitions, red Faults).
  - Swapped the Record Repetition icon to a Save icon and simplified modal header details.

---

- **Date:** 2026-02-10 (Pacific/Auckland)
- **Task:** Restricted mock test repetition colors + active borders
- **Summary:**
  - Forced Repetitions (blue) and Faults (red) styling via text color styles so they render correctly across themes.
  - Restored active-section highlighting with a thicker blue border when a section is expanded.

---

- **Date:** 2026-02-10 (Pacific/Auckland)
- **Task:** Restricted mock test stat color specificity fix
- **Summary:**
  - Forced Repetitions/Faults text colors (blue/red) using `!text-*` utilities so they are not overridden by base text classes.
  - Forced active-section blue borders using `!border-*` utilities so expanded section blocks visibly highlight as expected.

---

- **Date:** 2026-02-10 (Pacific/Auckland)
- **Task:** Restricted mock test error totals placement + overview border
- **Summary:**
  - Moved Critical/Immediate totals under their headings as `Total Errors: x` (orange/red) and removed the top-right `x recorded` label.
  - Darkened the Session overview card border for stronger visual separation.

---
- **Date:** 2026-02-10 (Pacific/Auckland)
- **Task:** Restricted mock test section collapse + stat colors
- **Summary:**
  - Restored blue Repetitions/red Faults text and active-section blue borders for the Stage/Error sections.
  - Added tap-outside-to-collapse behavior and darkened the Session overview border with a larger student name.

---
- **Date:** 2026-02-10 (Pacific/Auckland)
- **Task:** Student detail actions menu + background collapse
- **Summary:**
  - Moved Student Detail primary actions into the kebab menu (Start Assessment top, inline green badges, orange Archive) and removed the action buttons panel.
  - Updated Restricted Mock Test section collapse to also trigger when tapping the app background outside the centered container.

---
- **Date:** 2026-02-10 (Pacific/Auckland)
- **Task:** Mock test + student menu blue styling
- **Summary:**
  - Re-applied important blue/red highlight utilities so active borders and Repetitions/Faults stats render reliably, including kebab Start Assessment.
  - Added background-tap collapse support for the Restricted mock test and added a visual gap in the student kebab menu.

---
- **Date:** 2026-02-10 (Pacific/Auckland)
- **Task:** Restricted mock test Stage 2 lock + submit confirm modal
- **Summary:**
  - Styled Stage 2 `Locked` status in green and hid Stage 2 totals while locked.
  - Replaced submit confirmation alerts with a styled modal across all assessments and made the `Submit and Generate PDF` action dark green.

---
- **Date:** 2026-02-10 (Pacific/Auckland)
- **Task:** Restricted mock test overview badges + submit confirm styling
- **Summary:**
  - Made the submit confirmation modal show `Submit` in blue (and kept `Submit and Generate PDF` dark green) across all assessments.
  - Reworked the Restricted mock test Session overview badges (right-aligned Critical/Immediate badges + conditional borders) and slightly increased the student name size.

---
- **Date:** 2026-02-10 (Pacific/Auckland)
- **Task:** Restricted mock test section borders + overview badge styling
- **Summary:**
  - Updated Critical/Immediate active section borders to orange/red and added a darker border state for any section with recorded values.
  - Improved Session overview badges (Stage Reps/Faults with blue/red text, visible Critical/Immediate borders) and made gap taps collapse the active section reliably.

---
- **Date:** 2026-02-10 (Pacific/Auckland)
- **Task:** Restricted mock test active border priority fix
- **Summary:**
  - Ensured expanded section borders (blue/orange/red) always override the "has values" darker border styling.

---
- **Date:** 2026-02-10 (Pacific/Auckland)
- **Task:** Restricted mock test task list targets
- **Summary:**
  - Simplified Stage 1 and Stage 2 task list names and removed the 3-point turn item.
  - Added a right-aligned static reps target label per task in the task list.

---

- **Date:** 2026-02-10 (Pacific/Auckland)
- **Task:** Restricted mock test Stage 2 tasks + reps label styling
- **Summary:**
  - Restored the detailed Stage 2 task list with hard-coded reps targets per task (and kept Stage 1 targets).
  - Updated the task-list reps target text styling to match the task title (same weight/color).

---

- **Date:** 2026-02-10 (Pacific/Auckland)
- **Task:** Restricted mock test stage titles
- **Summary:**
  - Updated Stage 1 and Stage 2 section titles to simplified wording (duration-only) as requested.

---

- **Date:** 2026-02-10 (Pacific/Auckland)
- **Task:** Restricted mock test fault totals per repetition
- **Summary:**
  - Fixed fault totals so recording multiple repetitions increments Faults/Total Faults correctly (even when the same fault is selected again).
  - Updated the Turning movement fault label text.

---

- **Date:** 2026-02-10 (Pacific/Auckland)
- **Task:** Restricted mock test history + PDF refresh
- **Summary:**
  - Updated Assessment History + Restricted PDF output to reflect the new repetitions/fault counting model (including per-fault counts).
  - Ensured Stage 2 recorded items still render even when Stage 2 was not enabled (legacy/edge-case safety).

---

- **Date:** 2026-02-10 (Pacific/Auckland)
- **Task:** Student + assessment UX refinements
- **Summary:**
  - Improved student experience (swipeable licence photo viewer, clearer archive indicator, and kebab menu styling tweaks).
  - Refined assessments UX (integrated student search picker, Restricted history ordering, weather severity styling, and Restricted PDF session overview layout).

---

- **Date:** 2026-02-10 (Pacific/Auckland)
- **Task:** Assessment picker row + restricted history label cleanup
- **Summary:**
  - Updated the shared assessment student picker so selected student name and `Change student` appear on the same row.
  - Standardized Restricted Assessment History labels to `Mock Test - Restricted Licence`.

---

- **Date:** 2026-02-10 (Pacific/Auckland)
- **Task:** Compress licence card images on upload
- **Summary:**
  - Added `react-native-compressor` resizing/compression so Front/Back licence card uploads are reduced before storage.
  - Enforced a max width of `580px` for licence card images.

---

- **Date:** 2026-02-13 (Pacific/Auckland)
- **Task:** Custom animated launch screen + splash handoff
- **Summary:**
  - Added a branded animated React Native launch screen and startup state machine (fonts, boot readiness, minimum duration, failsafe timeout).
  - Wired `RootNavigation` boot-ready callback and native splash control using `expo-splash-screen` to reduce startup flicker.

---

- **Date:** 2026-02-13 (Pacific/Auckland)
- **Task:** Launch screen minimum duration set to 3 seconds
- **Summary:**
  - Increased `MIN_LAUNCH_DURATION_MS` from `900ms` to `3000ms` so the custom animated launch screen stays visible longer.

---

- **Date:** 2026-02-13 (Pacific/Auckland)
- **Task:** Sessions hub with latest sessions and create modal
- **Summary:**
  - Added a new drawer + Home-accessible Sessions area with a latest-10 sessions list and tap-through into Student Session History while preserving back-to-sessions flow.
  - Added create-session from the Sessions screen using the Add Session History modal structure plus student autocomplete, and wired shared sessions query invalidation for recents/history sync.

---

- **Date:** 2026-02-13 (Pacific/Auckland)
- **Task:** Sessions recents list set to 5
- **Summary:**
  - Updated the Sessions hub latest list query limit from `10` to `5`.
  - Renamed the Sessions subtitle text from `Latest 10 sessions` to `Last 5 sessions`.

---

- **Date:** 2026-02-13 (Pacific/Auckland)
- **Task:** Sessions button label and icon update
- **Summary:**
  - Renamed the Sessions screen header action button from `Add new` to `New Session`.
  - Added a leading plus icon to the `New Session` button.

---

- **Date:** 2026-02-13 (Pacific/Auckland)
- **Task:** Session icon and button-label capitalization polish
- **Summary:**
  - Replaced the Sessions `New Session` button plus icon with a session-style clock icon.
  - Updated Lessons and Students list action labels to `New Lesson` and `New Student`.

---

- **Date:** 2026-02-13 (Pacific/Auckland)
- **Task:** Session History button icon and label update
- **Summary:**
  - Updated the Session History header action from `Add new` to `New Session`.
  - Added a leading Lucide session-style clock icon to the `New Session` button.

---

- **Date:** 2026-02-13 (Pacific/Auckland)
- **Task:** Assessments screen recent history panel
- **Summary:**
  - Added a `Last 3 Assessments` section to the Assessments picker screen with latest entries, student names, assessment types, dates, and result/score summaries.
  - Added recent-assessments query support with student-name joins in the assessments API/query layer.

---

- **Date:** 2026-02-13 (Pacific/Auckland)
- **Task:** Assessments recents card limit, org label, and history navigation
- **Summary:**
  - Updated the Assessments picker recents panel to show `Last 5 Assessments` instead of 3 and include each student's organization in brackets.
  - Made each recent assessment card navigable to that student's `StudentAssessmentHistory` screen.

---

- **Date:** 2026-02-13 (Pacific/Auckland)
- **Task:** Assessments recent card route preselect + back flow
- **Summary:**
  - Tapping a card in `Last 5 Assessments` now opens `StudentAssessmentHistory` inside the Assessments stack with the tapped assessment type tab preselected.
  - Back from that history screen now returns to the Assessments screen rather than switching to the Students area.

---

- **Date:** 2026-02-13 (Pacific/Auckland)
- **Task:** Admin-only Feature Testing drawer screen
- **Summary:**
  - Added a new `Feature Testing` drawer destination above `Settings`, visible only to `admin` users.
  - Added a blank `Feature Testing` screen with a `Back` button and non-admin access guard messaging.

---

- **Date:** 2026-02-13 (Pacific/Auckland)
- **Task:** Navigation header theme preset reactivity fix
- **Summary:**
  - Updated all stack and drawer navigator theme option memos to depend on `themeKey` so header/drawer colors refresh when a theme preset is selected.
  - Fixed the top navbar color surface (hamburger/back/avatar row) not updating until scheme changes.

---

- **Date:** 2026-02-13 (Pacific/Auckland)
- **Task:** Settings organization/account collapsible sections
- **Summary:**
  - Made `Organization` and `Account Settings` cards collapsed by default with top-right `Show` controls.
  - Added toggle behavior so tapping `Show` expands card actions and switches the control to red `Hide`.

---

- **Date:** 2026-02-13 (Pacific/Auckland)
- **Task:** Settings cards keep identity details when collapsed
- **Summary:**
  - Updated Settings collapsible behavior so `Organization` and `Account Settings` always show logo/avatar and summary text.
  - Restricted Show/Hide to control only the action buttons inside each card.

---

- **Date:** 2026-02-13 (Pacific/Auckland)
- **Task:** Move themes UI to dedicated screen
- **Summary:**
  - Added a new `Themes` screen in Settings stack and moved the full theme selector UI there.
  - Replaced the Settings page theme block with a top-level `Themes` navigation button above `Organization`.

---

- **Date:** 2026-02-13 (Pacific/Auckland)
- **Task:** Themes screen list-style selector
- **Summary:**
  - Replaced the Themes screen style dropdown with an always-visible list of theme presets.
  - Kept selected-theme highlighting and tap-to-select behavior for the active light/dark mode.

---

- **Date:** 2026-02-13 (Pacific/Auckland)
- **Task:** Theme selection first-update navbar color fix
- **Summary:**
  - Updated theme setter actions to apply theme colors synchronously before state updates so navigation reads fresh palette values immediately.
  - Fixed first theme selection in `Themes` screen not updating navbar/header colors until a later interaction.

---

- **Date:** 2026-02-13 (Pacific/Auckland)
- **Task:** Themes screen free/premium sections + premium fonts
- **Summary:**
  - Split Themes screen into collapsible Free vs Premium blocks and auto-collapsed the non-selected group.
  - Added per-premium-theme typography via Google Fonts remote font loading so premium selections update the app font.

---

- **Date:** 2026-02-13 (Pacific/Auckland)
- **Task:** Premium themes + textured backdrops
- **Summary:**
  - Added 10 new premium theme presets (5 light, 5 dark) and surfaced premium labeling in the Themes list.
  - Added themed backdrop textures/gradients so premium themes feel materially different beyond color alone.

---

- **Date:** 2026-02-13 (Pacific/Auckland)
- **Task:** Fix ThemedBackdrop hook order crash
- **Summary:**
  - Removed conditional hook execution in `ThemedBackdrop` by making `useRef` and `useEffect` run on every render.
  - Fixed runtime hook-order errors when switching between themes with and without premium backdrops.

---

- **Date:** 2026-02-19 (Pacific/Auckland)
- **Task:** Settings notifications screen
- **Summary:**
  - Added a `Notifications` button above `Themes` in Settings.
  - Added a Notifications screen to show permission status and open/request device notification permissions.

---

- **Date:** 2026-02-19 (Pacific/Auckland)
- **Task:** Notifications preferences + lesson alerts
- **Summary:**
  - Added per-category sound/vibration preferences, test notifications, and push-token registration for cross-device alerts.
  - Added upcoming-lesson offsets + daily digest settings, plus Supabase tables/Edge Functions for scheduled push delivery.

---

- **Date:** 2026-02-21 (Pacific/Auckland)
- **Task:** Android FCM setup for push notifications
- **Summary:**
  - Added Expo Android `googleServicesFile` config so Android devices can register for push notifications.
  - Documented the required Firebase/EAS FCM credential setup steps for Android push delivery.

---

- **Date:** 2026-02-21 (Pacific/Auckland)
- **Task:** Notifications screen toggle switches
- **Summary:**
  - Replaced On/Off segmented controls with right-aligned toggle switches and slightly larger labels.
  - Restricted "Send test notification" buttons to `admin` users only.

---

- **Date:** 2026-02-21 (Pacific/Auckland)
- **Task:** Notifications screen compact toggles
- **Summary:**
  - Switched notification settings to larger blue/grey toggle switches and combined section title, enable, sound, and vibration controls into a single row.
  - Reduced whitespace with a two-column layout: title + enable on the left, sound/vibration controls right-aligned on the right.

---

- **Date:** 2026-02-21 (Pacific/Auckland)
- **Task:** Notifications settings simplify toggles
- **Summary:**
  - Simplified notification category settings to On/Off segmented controls only (removed Sound/Vibration UI and defaulted both to On when enabled).
  - Disabling Downloads/Student reminders now prevents local notifications and clears scheduled reminder alerts on the device.

---

- **Date:** 2026-02-21 (Pacific/Auckland)
- **Task:** Notifications screen spacing + push button polish
- **Summary:**
  - Removed the extra gap between section titles and captions and ensured Upcoming lessons defaults to a 1-hour notify offset.
  - Made the push "Register this device" button green when this device is not registered and disabled it when already registered.

---

- **Date:** 2026-02-21 (Pacific/Auckland)
- **Task:** Notifications test buttons for all roles
- **Summary:**
  - Made "Send test notification" buttons visible for owners and instructors (not admin-only).

---

- **Date:** 2026-02-21 (Pacific/Auckland)
- **Task:** Restricted mock test feedback + task errors
- **Summary:**
  - Replaced per-task notes with Critical/Immediate error fields (multi-select suggestions) and saved them per task.
  - Replaced global Critical/Immediate blocks with General feedback/Improvement needed and updated history + PDF output.

---

- **Date:** 2026-02-21 (Pacific/Auckland)
- **Task:** Restricted mock test repetition errors + modal polish
- **Summary:**
  - Saved task Critical/Immediate errors per repetition (snapshotted on Record Repetition) and updated History + PDF to render Repetition #N sections.
  - Redesigned the task modal (90% height, full-width card) and improved suggestion UX (tap outside to hide, auto-hide on record).

---

- **Date:** 2026-02-21 (Pacific/Auckland)
- **Task:** Restricted mock test PDF page break + suggestion auto-open
- **Summary:**
  - Auto-opened suggestions when tapping into task errors and feedback textboxes, and renamed Improvement needed to Improvement(s) needed across UI/history/PDF.
  - Adjusted Restricted PDF layout so feedback stays on page 1 and Stage 1/2 start on page 2.

---

- **Date:** 2026-02-21 (Pacific/Auckland)
- **Task:** Restricted history feedback ordering
- **Summary:**
  - Moved General feedback + Improvement(s) needed cards to sit directly under Overview for restricted mock tests.

---

- **Date:** 2026-02-21 (Pacific/Auckland)
- **Task:** Lessons: student picker + location display
- **Summary:**
  - Moved the Student block above date/time/duration and reused the assessment-style student dropdown search.
  - Removed Status + Location inputs; now shows Location from the selected student address and updated lesson cards accordingly.

---

- **Date:** 2026-02-21 (Pacific/Auckland)
- **Task:** Lessons address label + size
- **Summary:**
  - Removed the Location label and bumped address text size on New Lesson and Lessons list.

---

- **Date:** 2026-02-22 (Pacific/Auckland)
- **Task:** Restricted mock test UX refinements
- **Summary:**
  - Defaulted pre-drive Time to current time, removed the optional label, and auto-expanded Stage 1 when starting/resuming.
  - Moved error/feedback suggestions into a dedicated modal and persisted in-progress task repetition selections with dynamic modal height.

---

- **Date:** 2026-02-22 (Pacific/Auckland)
- **Task:** Restricted task modal bottom sheet
- **Summary:**
  - Converted the task repetition modal into an animated bottom sheet with a handle (drag or tap to expand/collapse, tap backdrop to dismiss).
  - Matched the modal padding to the main screen container paddings.

---

- **Date:** 2026-02-22 (Pacific/Auckland)
- **Task:** Restricted suggestions bottom sheet
- **Summary:**
  - Switched the suggestions picker (task errors + feedback) to the same bottom-sheet pattern as the task repetition modal.
  - Updated suggestions helper copy to reflect handle/backdrop dismissal.

---

- **Date:** 2026-02-22 (Pacific/Auckland)
- **Task:** Bottom sheet + navbar polish
- **Summary:**
  - Standardized bottom sheet padding/typography (bigger headings, bolder category labels, left-aligned suggestion options).
  - Updated header buttons so drawer root screens show hamburger only, and all other screens show back only (no navbar titles).

---

- **Date:** 2026-02-22 (Pacific/Auckland)
- **Task:** Bottom sheet spacing + scrollbars
- **Summary:**
  - Restored the previous bottom sheet top padding and added extra spacing between the handle and content.
  - Underlined suggestion subheadings, fixed long suggestions scrolling, and hid scroll indicators across the app.

---

- **Date:** 2026-02-22 (Pacific/Auckland)
- **Task:** Suggestions: blue subheadings + auto-grow inputs
- **Summary:**
  - Updated suggestion modal category labels to use blue styling.
  - Made suggestion-linked multiline inputs auto-expand to fit content (no internal scrolling).

---

- **Date:** 2026-02-22 (Pacific/Auckland)
- **Task:** Restricted PDF stage pagination
- **Summary:**
  - Hid Stage 2 section/details in the PDF when Stage 2 was not enabled.
  - Forced Stage 2 (when enabled) to start on a new PDF page.

---

- **Date:** 2026-02-22 (Pacific/Auckland)
- **Task:** Organization email setting
- **Summary:**
  - Added organization email field + edit screen in Settings.
  - Displayed the org email in the Organization block and added a "Change organization email" action.

---

- **Date:** 2026-02-22 (Pacific/Auckland)
- **Task:** Home buttons + email assessment PDFs
- **Summary:**
  - Rearranged Home quick actions into a 3x2 grid (Students/Lessons, Assessments/Sessions, Google Maps bottom-right).
  - Added an "Email student" action in Assessment History to email PDFs to the student and the organization.

---

- **Date:** 2026-02-22 (Pacific/Auckland)
- **Task:** Assessment email error messaging
- **Summary:**
  - Surfaced Resend error messages in the Edge Function response for easier diagnosis.
  - Logged provider failures in Supabase Edge Function logs.

---

- **Date:** 2026-02-22 (Pacific/Auckland)
- **Task:** Email student for mock tests
- **Summary:**
  - Added the "Email student" action to Restricted and Full mock test history detail views.
  - Disabled Download/Email/Delete actions consistently while emailing.

---

- **Date:** 2026-02-22 (Pacific/Auckland)
- **Task:** Email student button color
- **Summary:**
  - Added a green `success` button variant and applied it to "Email student" across all assessment history views.

---

- **Date:** 2026-02-22 (Pacific/Auckland)
- **Task:** Submit and email student
- **Summary:**
  - Added a "Submit and Email student" option to the submit confirmation modal for all 3 assessments.
  - Implemented submit + PDF generation + email sending via the `send-assessment-email` Edge Function.

---

- **Date:** 2026-02-22 (Pacific/Auckland)
- **Task:** Modal polish
- **Summary:**
  - Updated the submit confirmation modal so "Submit and Email student" uses green text styling (matching "Submit and Generate PDF").
  - Added a blue Close button with icon to the bottom sheet modal footer (outside the scrollable content).

---

- **Date:** 2026-02-22 (Pacific/Auckland)
- **Task:** Navbar hamburger buttons
- **Summary:**
  - Updated header button logic so stack root screens show the hamburger menu even when navigation can go back.
  - Applied this so Students/Lessons/Assessments/Sessions/Google Maps/Settings show the hamburger instead of a back button.

---

- **Date:** 2026-02-23 (Pacific/Auckland)
- **Task:** Supabase cron setup docs
- **Summary:**
  - Documented enabling `pg_cron` + `pg_net` for scheduled Edge Function delivery.
  - Added sample SQL for scheduling `notifications-cron` every 5 minutes and verifying runs.

---

- **Date:** 2026-02-23 (Pacific/Auckland)
- **Task:** Safe area for bottom overlays
- **Summary:**
  - Added safe-area bottom padding to the shared bottom sheet modal so content won't sit under the system navigation bar.
  - Made the licence image gallery modal respect system insets.

---

- **Date:** 2026-02-24 (Pacific/Auckland)
- **Task:** Daily digest reliability
- **Summary:**
  - Prevented daily digest push bodies from falling back to "No lessons scheduled today" when the lesson lookup RPC fails.
  - Avoided inserting digest deliveries on lookup failure so the next cron run can retry.

---

- **Date:** 2026-02-24 (Pacific/Auckland)
- **Task:** Daily digest lesson lookup
- **Summary:**
  - Fixed `get_lessons_for_local_date` to join through `notification_settings` so daily digests use the same org-scoped lesson selection as upcoming reminders.
