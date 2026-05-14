# IHA CareFlow Project Memory

Last updated: 2026-05-14

## Project Overview

`iha-careflow` is a Next.js 16 App Router application for Integrative Healthcare Alliance care operations. The current priority is UI-first. Firebase has been initialized, Firebase Auth is wired for login/register/logout, admin user profiles save to Firestore, and onboarding saves new patient data to Firestore.

The app was adapted from a shadcn-style admin dashboard reference, but Convex and Clerk were intentionally removed. Patient/doctor directory data still has a Zustand-backed seed store, while the major workflow pages are progressively being moved to Firestore.

## Local Dev Notes

- Use Node 22: `nvm use 22`
- Install/run with pnpm.
- Firebase browser config lives in ignored `.env.local` using `NEXT_PUBLIC_FIREBASE_*` variables.
- `pnpm dev` uses webpack intentionally:
  - Script: `next dev --webpack`
  - Turbopack dev was stalling on route compilation in this environment.
- `pnpm build` uses Next default build and has passed after changes.
- Verification commands used frequently:
  - `pnpm lint`
  - `pnpm build`

## App Architecture

- Framework: Next.js `16.2.6`, React `19.2.4`, App Router.
- Firebase SDK: initialized for app/Auth/Firestore/Storage. Analytics was intentionally removed.
- Auth: Firebase email/password auth with a protected admin layout.
- Firestore rules/config files exist locally for project `iha-careflow`.
- Global state:
  - Auth/session state in `src/stores/auth-store.ts`.
  - Patient/doctor seed workflow state in `src/stores/careflow-store.ts`.
- Styling: Tailwind CSS v4 via `src/app/globals.css`.
- Component style: shadcn/ui-style primitives under `src/components/ui`.
- Icons: `@tabler/icons-react` mostly, plus some `lucide-react` inside shadcn primitives.
- Admin shell:
  - `src/app/admin/layout.tsx`
  - Uses `SidebarProvider`, `SidebarInset`, `SiteHeader`, and `AppSidebar`.
- Sidebar navigation:
  - `src/components/app-sidebar.tsx`
  - Main workflow links are wired to current pages.
  - Care Directory group links to patient and doctor management pages.
- Root routes:
  - `/` redirects to `/login`.
  - `/admin` redirects to `/admin/dashboard`.

## Routes

### Public/Auth Routes

- `/login`
  - File: `src/app/login/page.tsx`
  - Uses `AuthPanel` from `src/components/auth-panel.tsx`.
  - Firebase email/password admin login.
  - “Not a member? Register” links to `/register`.
  - Successful login updates Zustand auth state and routes to `/admin/dashboard`.
  - Authenticated users are redirected away from login to `/admin/dashboard`.

- `/register`
  - File: `src/app/register/page.tsx`
  - Uses the same `AuthPanel`.
  - Firebase email/password registration form with name/email/password/confirm password.
  - Successful registration updates Firebase profile, creates a `users/{uid}` Firestore doc, updates Zustand auth state, and routes to `/admin/dashboard`.
  - Saved user fields include `uid`, `userId`, `fullName`, `displayName`, `email`, `role`, `active`, `createdAt`, and `updatedAt`.
  - If Firestore rules reject profile doc creation, registration shows a Firestore permissions error instead of silently continuing.

### Admin Routes

- `/admin/dashboard`
  - File: `src/app/admin/dashboard/page.tsx`
  - Command center overview.
  - Uses:
    - `SectionCards`
    - `ChartAreaInteractive`
  - Active Queue table was removed from this page per user request.

- `/admin/onboarding`
  - File: `src/app/admin/onboarding/page.tsx`
  - New-patient intake form, not an operations queue.
  - Saves new patient data to Firestore collection `patients`.
  - Successful save shows a Sonner toast saying `Patient data saved` and clears the form.
  - Collects:
    - Full name
    - Date of birth
    - Gender
    - Phone/email
    - Emergency contact
    - Reason for visit
    - Symptoms checklist
    - Symptom notes
    - Medical history
    - Medications/allergies
    - Insurance provider/member ID
    - Billing preference
  - Includes live auto-summary panel.
  - Primary action is `Save patient data`; the previous `Review intake summary` button was removed.

- `/admin/billing`
  - File: `src/app/admin/billing/page.tsx`
  - Billing and insurance dashboard.
  - Reads from Firestore collection `billingRecords` with a live snapshot.
  - Includes a `Seed demo records` button if demo billing data needs to be added to Firebase.
  - Summary cards at top.
  - Patient billing records table.
  - Search by patient/insurance/invoice.
  - Status filter: All, Verified, Pending, Missing Info.
  - CSV export for filtered billing records.
  - Each row has:
    - `View`
    - `Send Reminder`, which updates `reminderSentAt` in Firestore.
  - Details drawer includes:
    - Insurance details
    - Uploaded insurance card placeholder
    - Invoice breakdown
    - Invoice PDF download generated in the browser
    - Verification status
    - Billing notes saved back to Firestore

- `/admin/clinical-notes`
  - File: `src/app/admin/clinical-notes/page.tsx`
  - Clinical documentation workbench.
  - Reads/writes notes from Firestore collection `clinicalNotes`.
  - Reads Firestore `patients` so onboarding-created patients can appear in the New Note patient picker.
  - Includes a `Seed demo notes` button if the Firebase `clinicalNotes` collection is empty.
  - Top bar:
    - New Note modal
    - Search
    - Filter
  - Left panel:
    - Notes list with patient, note type, date/provider, status badge.
  - Main panel:
    - Unified patient header.
    - SOAP editor with large scrollable/editable sections.
    - S/O/A/P blocks have distinct background and left-border accents.
  - Right patient context panel:
    - Avatar
    - Name
    - Age
    - Reason
    - Risk
    - Insurance plan/member ID
    - Note status
  - New Note modal:
    - Search/select patient
    - Select appointment filtered by selected patient
    - Select note type: SOAP, Progress Note, Intake Note, Follow-up
    - Creates note in Firestore and opens it immediately.
  - Save updates SOAP fields and moves status to `Ready`.
  - Sign note updates SOAP fields, marks status `Signed`, and stores `signedAt`.
  - Patient tags were removed from the modal and moved to the context panel.

- `/admin/messages`
  - File: `src/app/admin/messages/page.tsx`
  - Patient-provider messaging workspace.
  - Reads conversation metadata from Firestore collection `conversations`.
  - Reads message history from Firestore collection `messages`.
  - Reads Firestore `patients` so onboarding-created patients can be selected when starting a new conversation.
  - Includes a `Seed demo` button if the Firebase messaging collections are empty.
  - New Message modal creates a conversation and first provider message in Firebase.
  - Left panel:
    - Conversations list
    - Patient name
    - Last message preview
    - Time
    - Status badge
    - Search patients
  - Main/right panels:
    - Patient summary header
    - Upcoming appointment
    - Provider
    - Risk level
    - Message history
    - Quick actions
    - Message input and Send button
  - Sending a message creates a `messages` doc and updates the linked `conversations` doc with last message, status, and timestamp.
  - Resolve updates conversation status in Firestore.
  - Quick actions write provider messages for intake reminders, symptom updates, and escalation.

- `/admin/patients`
  - File: `src/app/admin/patients/page.tsx`
  - Patient management directory.
  - Reads from Firestore collection `patients` with a live snapshot.
  - Includes a `Seed demo` button if Firebase has no patient directory data yet.
  - Includes:
    - Summary cards for total patients, intake pending, high risk, billing gaps.
    - Search by patient/contact/provider.
    - Status and risk filters.
    - Patient table with status, risk, provider, next appointment, billing readiness.
    - Right patient profile panel with contact, care readiness checklist, insurance/billing, workflow actions, and care context.
    - Right-panel management controls for patient status, risk level, and insurance readiness.
  - Connects patient profile data to onboarding, billing, scheduling, messages, and clinical notes.
  - Onboarding-created records are mapped into the directory from fields such as `fullName`, `dateOfBirth`, `reasonForVisit`, `insuranceProvider`, and `memberId`.

- `/admin/doctors`
  - File: `src/app/admin/doctors/page.tsx`
  - Doctor management directory.
  - Reads/writes Firestore collection `doctors` with a live snapshot.
  - Includes a `Seed demo` button if Firebase has no doctor directory data yet.
  - Includes:
    - Summary cards for active doctors, visits today, open notes, available slots.
    - Search by doctor/specialty/location/contact.
    - Specialty and status filters.
    - Doctor table with status, daily visits, next availability, open notes.
    - `New doctor` modal that creates a doctor document in Firestore.
    - Right doctor profile panel with credentials, schedule capacity, patient panel, today's workflow, and quick actions.
    - Right-panel management controls for doctor status and specialty.
  - Connects doctors to scheduling capacity, notes ownership, and patient panel management.

- `/admin/scheduling`
  - File: `src/app/admin/scheduling/page.tsx`
  - Calendar-first scheduling dashboard.
  - Reads/writes appointments from Firestore collection `appointments`.
  - Reads Firestore `patients` so onboarding-created patients can appear in scheduling dropdowns.
  - Includes a `Seed demo` button if the Firebase `appointments` collection is empty.
  - Top action bar:
    - New appointment modal
    - Calendar/Table display toggle
    - Day/Week/Month range toggle
    - Prev/next arrows
    - Provider filter
  - Automation banner:
    - Shows pending unconfirmed appointments for tomorrow.
    - `Send All` writes `reminderSentAt` to matching appointment docs.
  - Left panel:
    - Mini monthly calendar.
    - Dates with appointments highlighted.
    - Click date to select appointment on that date.
  - Main area:
    - Calendar mode shows a day or week time-grid.
    - Table mode shows appointments for Day, Week, or full Month.
    - Appointment blocks/rows display patient, type, provider, and status color.
  - Right panel:
    - Appointment detail with avatar, patient, date/time/duration, type, provider, status/risk.
    - Actions update Firestore: Confirm, Reschedule, Cancel, Reminder.
    - Quick links: Start Session, Start note, Message patient, View billing.
  - New appointment modal:
    - Patient
    - Provider
    - Exact May 2026 date
    - Time
    - Type
    - Creates a pending appointment in Firestore directly on the calendar.
  - Reschedule modal:
    - Updates provider/date/time/type in Firestore.
    - Marks appointment `Pending` after reschedule so it can be reconfirmed.
  - New appointment and reschedule flows check for provider/day/time conflicts before saving.
  - Mini calendar shows real May 2026 date placement and only valid dates 1-31.
  - Weekly grid is constrained to show all seven day columns in the center panel.
  - Month mode switches to the table view so appointments outside the visible week are still visible.

- `/admin/settings`
  - File: `src/app/admin/settings/page.tsx`
  - Care Settings / Roles & Permissions.
  - Sidebar `Care Settings` now routes to `/admin/settings`.
  - Reads/writes role definitions from Firestore collection `roles`.
  - Reads and updates staff records from Firestore collection `users`.
  - UI includes:
    - Role list for Super Admin, Admin, Doctor, Billing, Front Desk, and Clinical Assistant.
    - Role access panel with one clear access dropdown per care module.
    - Permission levels: No Access, View, Manage.
    - Protected data badges integrated directly into sensitive module rows.
    - Staff panel with role assignment and account enabled/suspended toggle.
  - `Save changes` persists role permissions to `roles/{roleKey}`.
  - Staff role/status changes update `users/{uid}`.
  - Users without Manage access for Settings can view settings but cannot edit.

## Shared Components / Important Files

- `src/components/auth-panel.tsx`
  - Shared login/register panel.
  - Calls Firebase Auth:
    - `signInWithEmailAndPassword`
    - `createUserWithEmailAndPassword`
    - `updateProfile`
  - Writes new staff profiles to `users/{uid}` on registration.
  - Loads the Firestore user profile into Zustand on login.
  - Shows user-friendly Firebase auth errors.

- `src/components/firebase-provider.tsx`
  - Client provider mounted in `src/app/layout.tsx`.
  - Subscribes to `onAuthStateChanged`.
  - Reads `users/{uid}` from Firestore and syncs the profile into Zustand auth state.
  - If an older Firebase Auth user has no profile doc yet, it attempts to create/repair one.

- `src/lib/auth-profile.ts`
  - Converts Firebase Auth users plus optional Firestore profile data into the shared Zustand `AuthUser` shape.

- `src/lib/firebase.ts`
  - Firebase app configuration for project `iha-careflow`.
  - Exports `firebaseApp`, `auth`, `db`, and `storage`.
  - Firebase Analytics is not used in this app.
  - Reads Firebase config from `NEXT_PUBLIC_FIREBASE_*` environment variables instead of hardcoded source values.

- `src/stores/careflow-store.ts`
  - Zustand store for seed patient/doctor directory state.
  - Exports shared `Patient`, `Doctor`, status, risk, and insurance types.
  - Stores active patient/doctor IDs and supports old local doctor seeds.

- `src/stores/auth-store.ts`
  - Zustand auth/session store.
  - Tracks `user` and auth `status`: `loading`, `authenticated`, `unauthenticated`.
  - User state includes `uid`, `userId`, `fullName`, `displayName`, `email`, `photoURL`, `role`, and `active`.
  - Used by auth forms, admin route protection, Firebase provider, and sidebar logout.

- `src/components/app-sidebar.tsx`
  - Sidebar navigation and app brand.
  - Current links:
    - Command Center: `/admin/dashboard`
    - Patient Onboarding: `/admin/onboarding`
    - Billing & Insurance: `/admin/billing`
    - Clinical Notes: `/admin/clinical-notes`
    - Patient Messages: `/admin/messages`
    - Scheduling: `/admin/scheduling`
    - Care Settings: `/admin/settings`

- `src/components/nav-care-directory.tsx`
  - Sidebar group labeled `Care Directory`.
  - Links:
    - Patients: `/admin/patients`
    - Doctors: `/admin/doctors`
  - Replaced the copied dashboard `Documents` sidebar section.

- `src/components/nav-documents.tsx`
  - Compatibility re-export to avoid stale dev-server imports after renaming the sidebar section.

- `src/components/site-header.tsx`
  - Admin header.

- `src/components/nav-user.tsx`
  - Reads authenticated user from Zustand.
  - Shows account email/name in sidebar footer.
  - Logout calls Firebase `signOut`, resets Zustand auth state, and redirects to `/login`.

- `src/app/admin/layout.tsx`
  - Client-side protected admin shell.
  - Redirects unauthenticated users to `/login`.
  - Shows a compact verifying-session state while Firebase Auth is loading.

- `src/app/globals.css`
  - Theme tokens. Palette is warm clinical/teal/earthy and not default shadcn neutral only.

- `src/app/layout.tsx`
  - Mounts the Firebase provider and the global Sonner toaster.
  - Toasts appear at the top center of the app.

- `next.config.ts`
  - Has `turbopack.root = __dirname` to avoid workspace-root warning.

## Firebase / Firestore Rules

- Local Firebase config files now exist:
  - `firebase.json`
  - `.firebaserc`
  - `firestore.rules`
- Firebase rules have not been deployed yet unless a Firebase CLI deploy succeeds in the current session.
- The previous rule `allow read, write: if false;` blocks every Firestore read/write and causes registration profile saves and onboarding saves to fail with `permission-denied`.
- The local `firestore.rules` file now enforces dynamic role-based collection access using `users/{uid}.role`, `users/{uid}.active`, and the saved `roles/{roleKey}.permissions` document.
- Rules interpret permission levels as:
  - `none`: no read/write access.
  - `view`: read access only.
  - `manage`: create/update access plus read access.
- Example: if Care Settings changes Doctor -> Patients to `Manage`, Firestore rules allow doctors to create/update `patients` after the role document is saved.
- `super_admin` always keeps settings management access, and `admin`/`super_admin` can bootstrap role documents when no role document exists for their current role.
- Supported role keys are `super_admin`, `admin`, `doctor`, `billing`, `front_desk`, and `clinical_assistant`; legacy `provider` is normalized to doctor in the app.
- Deletes remain denied by default.
- These rules still need to be pasted into Firebase Console or deployed with `firebase deploy --only firestore:rules` before the live Firebase project will use them.

## Firestore Collections

Firestore persistence has started with auth profiles and onboarding patient records. Recommended collection design for the backend phase:

- `users`
  - Admin/staff/doctor profiles.
  - Read/written by auth and `/admin/settings`.
  - Fields: `uid`, `userId`, `fullName`, `displayName`, `email`, `role`, `active`, `status`, `lastActive`, `createdAt`, `updatedAt`.

- `roles`
  - Role definitions and permission bundles.
  - Read/written by `/admin/settings`.
  - Document ids are role keys such as `admin`, `doctor`, `billing`, `front_desk`.
  - Fields include `key`, `label`, `description`, `permissions`, `updatedBy`, and `updatedAt`.
  - Permission levels are `none`, `view`, and `manage`.

- `patients`
  - Core patient profile.
  - Currently written by `/admin/onboarding` and read/updated by `/admin/patients`.
  - Fields include `fullName`, `dateOfBirth`, `gender`, `phone`, `email`, emergency contact fields, `reasonForVisit`, `symptoms`, medical history, medications, allergies, insurance provider, member ID, billing preference, `status`, `source`, `onboardingComplete`, `createdBy`, `createdByEmail`, `createdAt`, and `updatedAt`.
  - Directory-friendly fields may also exist, including `name`, `dob`, `risk`, `provider`, `nextAppointment`, `insurancePlan`, `insuranceStatus`, `consentSigned`, `openNotes`, `balance`, `lastMessage`, and `carePlan`.

- `doctors`
  - Doctor profile and schedule capacity.
  - Currently read/written by `/admin/doctors`.
  - Fields include `name`, `displayName`, `title`, `specialty`, `license`, `npi`, `email`, `phone`, `status`, `todayAppointments`, `availableSlots`, `openNotes`, `nextAvailable`, `panelCount`, `highRiskPanel`, `capacity`, `location`, `networkStatus`, `upcoming`, `focus`, `createdBy`, `createdByEmail`, `createdAt`, and `updatedAt`.

- `insuranceRecords`
  - Billing readiness and insurance verification.
  - Fields: `patientId`, `providerName`, `memberId`, `status`, `cardFrontUrl`, `cardBackUrl`, `verificationNotes`, `lastCheckedAt`.

- `billingRecords`
  - Billing/invoice dashboard records.
  - Currently read/written by `/admin/billing`.
  - Fields include `patient`, `dateOfBirth`, `provider`, `appointment`, `insurance`, `memberId`, `status`, `balance`, `invoice`, `cardStatus`, `breakdown`, `notes`, `reminderSentAt`, `createdBy`, `createdByEmail`, `createdAt`, and `updatedAt`.

- `appointments`
  - Scheduling records.
  - Currently read/written by `/admin/scheduling`.
  - Fields include `patient`, `provider`, `day`, `date`, `time`, `duration`, `type`, `status`, `risk`, `reason`, `billing`, `notes`, `message`, `reminderSentAt`, `createdBy`, `createdByEmail`, `createdAt`, and `updatedAt`.

- `clinicalNotes`
  - SOAP/progress/intake/follow-up notes.
  - Currently read/written by `/admin/clinical-notes`.
  - Fields include `patientId`, `patientName`, `patientAge`, `patientReason`, `patientRisk`, `patientInsurance`, `patientMemberId`, `appointmentId`, `appointmentLabel`, `appointmentTime`, `provider`, `date`, `noteType`, `status`, `subjective`, `objective`, `assessment`, `plan`, `signedAt`, `createdBy`, `createdByEmail`, `createdAt`, and `updatedAt`.

- `conversations`
  - Patient-provider message threads.
  - Currently read/written by `/admin/messages`.
  - Fields include `patientId`, `patient`, `phone`, `appointment`, `provider`, `risk`, `status`, `lastMessage`, `lastMessageAt`, `time`, `createdBy`, `createdByEmail`, `createdAt`, and `updatedAt`.

- `messages`
  - Individual conversation messages.
  - Currently read/written by `/admin/messages`.
  - Fields include `conversationId`, `sender`, `senderId`, `senderType`, `body`, `time`, `sequence`, `readAt`, and `createdAt`.

- `auditLogs`
  - Important for healthcare admin actions.
  - Fields: `actorId`, `action`, `resourceType`, `resourceId`, `metadata`, `createdAt`.

## Roles & Permissions

Role enforcement is implemented in the frontend shell and dynamic local Firestore rules:

- `src/lib/permissions.ts`
  - Shared role keys, permission keys, default role permissions, route-permission map, and helpers.
- `src/hooks/use-role-permissions.ts`
  - Loads `roles` from Firestore and falls back to default roles if none exist or rules block access.
- `src/app/admin/layout.tsx`
  - Blocks protected admin routes when the authenticated user's role lacks the required permission.
- `src/components/app-sidebar.tsx`
  - Filters sidebar links based on the authenticated user's role.
- `src/components/firebase-provider.tsx`
  - Listens to `users/{uid}` in realtime so role/status changes update the current session.
- `firestore.rules`
  - Reads `roles/{roleKey}.permissions` dynamically so the Settings page controls backend read/write access after rules are pasted/deployed.

Current roles:

- `super_admin`
  - Full system access, user management, settings, audit logs.

- `admin`
  - Manage operations workflows, onboarding, scheduling, billing, messages.

- `doctor`
  - Access assigned patient schedule, clinical notes, messages, sign notes.

- `billing`
  - Access billing and insurance records, invoice details, reminders.

- `front_desk`
  - Access onboarding, scheduling, reminders, basic patient demographics.

- `clinical_assistant`
  - Access intake review, notes drafts, messages, appointment prep.

Suggested route permissions:

- `/admin/dashboard`: all staff roles.
- `/admin/onboarding`: controlled by `onboarding` permission.
- `/admin/patients`: controlled by `patients` permission.
- `/admin/doctors`: controlled by `doctors` permission.
- `/admin/billing`: controlled by `billing` permission.
- `/admin/clinical-notes`: controlled by `notes` permission.
- `/admin/messages`: controlled by `messages` permission.
- `/admin/scheduling`: controlled by `scheduling` permission.
- `/admin/settings`: controlled by `settings` permission.

## Workflow Connections

Desired operational flow:

1. Patient onboarding is completed.
2. Insurance/billing verification is checked.
3. Appointment is scheduled.
4. Automated reminder is sent.
5. Patient-provider messaging handles prep/follow-up.
6. Consultation/session happens.
7. Clinical note is created and signed.
8. Follow-up appointment is scheduled.
9. Billing record/invoice is finalized.

Cross-page relationships already represented in UI:

- Patient directory acts as the profile hub for onboarding readiness, billing readiness, scheduling, messages, and clinical notes.
- Doctor directory acts as the provider hub for schedule capacity, patient panel load, open notes, and credentialing/network readiness.
- Scheduling detail panel links conceptually to billing, clinical notes, and messages.
- Billing readiness depends on intake/onboarding and insurance verification.
- Clinical Notes New Note modal uses patient + appointment pairing.
- Messages panel shows upcoming appointment and provider.
- Onboarding collects insurance/billing info needed by Billing.

## Completed Features

- Next.js project set up with shadcn-style admin shell.
- Convex and Clerk references removed from copied reference UI.
- Firebase initialized:
  - Firebase App
  - Auth export
  - Firestore export
  - Storage export
- Firebase Auth flow:
  - login
  - register
  - user profile doc saved to `users/{uid}`
  - Firestore profile loaded into Zustand auth state
  - global auth state
  - protected `/admin/*` shell
  - sidebar logout redirect
- Local Firestore rules/config files added for project `iha-careflow`.
- Zustand global state added for patient/provider directory data.
- Login/register UI routes.
- Dashboard command center.
- Patient onboarding intake form with live summary.
- Onboarding save writes to the `patients` Firestore collection, shows a Sonner toast, and clears the form on success.
- Billing & Insurance dashboard:
  - Firestore live data from `billingRecords`
  - search
  - status filter
  - CSV export
  - reminder buttons
  - details drawer
  - invoice PDF download
  - billing notes persistence
- Clinical Notes workbench:
  - Firestore live data from `clinicalNotes`
  - patient picker can include Firestore `patients`
  - notes list
  - SOAP editor
  - new note modal
  - patient context panel
  - improved SOAP section visibility/scrolling
  - save/sign persistence
- Patient Messages workspace:
  - Firestore live data from `conversations`
  - Firestore live data from `messages`
  - Firestore `patients` are available in the New Message modal
  - conversations list
  - patient summary
  - message history
  - new message modal
  - provider message sending persistence
  - resolve conversation persistence
  - quick-action message persistence
- Patients directory:
  - Firestore live data from `patients`
  - onboarding-created patient records appear in the directory
  - search and status/risk filters
  - summary cards
  - patient table
  - profile/readiness detail panel
  - status, risk, and insurance readiness persistence
- Doctors directory:
  - Firestore live data from `doctors`
  - search and specialty/status filters
  - summary cards
  - doctor table
  - new doctor modal with Firestore persistence
  - doctor capacity/profile detail panel
  - doctor status and specialty persistence
- Scheduling calendar:
  - Firestore live data from `appointments`
  - patient dropdown can include Firestore `patients`
  - mini calendar
  - calendar/table display toggle
  - day/week/month range toggle
  - day/week calendar grid
  - day/week/month appointment table
  - provider filter
  - new appointment modal
  - reminder automation banner
  - appointment detail panel
  - confirm/cancel/reminder/reschedule persistence
- Care Settings / Roles & Permissions UI:
  - `/admin/settings` route
  - Firestore live data from `roles`
  - Firestore live data from `users`
  - role cards
  - module access dropdowns
  - staff role assignment UI
  - account enabled/suspended UI
  - protected-data indicators on sensitive modules
- Role/permission enforcement:
  - sidebar link filtering
  - admin route guard
  - realtime current-user profile updates
  - dynamic local Firestore rules updated for role-based backend access
- `pnpm lint` and `pnpm build` have passed after latest feature work.

## Pending TODOs

### Backend/Auth

- Firebase SDK is installed and initialized.
- Move Firebase config to `NEXT_PUBLIC_*` environment variables before production.
- Firebase Auth login/register/logout is implemented.
- `/admin/*` routes are protected by the admin layout.
- Deploy Firestore rules to Firebase Console/project.
- Paste/deploy the updated dynamic role-based Firestore rules before relying on backend protection.
- Add audit logging for clinical/billing/scheduling actions.

### Data Layer

- Replace static arrays/local state and Zustand seed data with Firestore reads/writes.
- Hydrate Zustand from Firestore collections.
- Add loading, error, empty, and permission states.
- Add validation schemas for intake, billing, notes, messages, scheduling.
- Add server actions or API routes if needed.

### Workflow Enhancements

- Patients:
  - Add edit/archive flows.
  - Add shared patient profile component used across notes/messages/scheduling/billing.
  - Link each patient to intakes, appointments, notes, billing, and conversations.

- Doctors:
  - Add edit/deactivate flows.
  - Add schedule template management.
  - Add patient panel assignment and capacity rules.

- Onboarding:
  - Submit intake.
  - Upload insurance card.
  - Consent forms.

- Billing:
  - Real invoice generation.
  - Store CSV/export history.
  - Payment reminders via email/SMS later.
  - Insurance verification status transitions.

- Clinical Notes:
  - Required fields by note type.
  - Version history.
  - Print/export note.
  - Provider-only signing/role enforcement.

- Messages:
  - Read/unread transitions beyond manual status.
  - Attachments.
  - Real escalation assignment to a provider.
  - Message templates.
  - Real portal/email/SMS delivery instead of Firestore-only demo persistence.

- Scheduling:
  - Calendar date navigation.
  - Real Today/Week/Month views.
  - Real reminder delivery via email/SMS.
  - Provider availability templates.

### UI Polish

- Add active nav state to sidebar.
- Improve mobile layouts for workbench pages.
- Add loading skeletons once backend exists.
- Add empty states for filtered tables/lists.
- Add toast feedback for actions like Save, Send Reminder, Create Appointment.
- Consider a patient profile shared component for use across notes/messages/scheduling.

## Important User Preferences

- User wants UI-first before backend.
- User does not like pages that require awkward page-level scrolling; prefers contained workspaces with internal scroll areas.
- User prefers professional dashboard workflows with tables, drawers/modals, filters, exports, status colors, and automation cues.
- User frequently rejects generic dashboard placeholders; pages should match the real healthcare workflow.
- Use direct, usable screens rather than marketing/landing pages.
- Avoid Convex. The user explicitly asked to remove Convex from copied admin code.
