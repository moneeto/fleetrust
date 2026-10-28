# Graph Report - frassi_enlatado  (2026-10-25)

## Corpus Check
- 139 files · ~113,245 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 25 file(s) not represented in the graph (top: .css 19, .mdc 3, (none) 2)

## Summary
- 1107 nodes · 2129 edges · 87 communities (62 shown, 25 thin omitted)
- Extraction: 89% EXTRACTED · 11% INFERRED · 0% AMBIGUOUS · INFERRED: 232 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `128ec67f`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- experiences.js
- reservations.js
- frontend_src_app_auth_tours_addons_page_module
- gallery.js
- reservationsModel.js
- SocialLogin.jsx
- server.js
- pilots.js
- toast.jsx
- auth.js
- dependencies
- services.js
- dependencies
- authModel.js
- otp.check.js
- backend/package.json
- users.js
- frontend/package.json
- instagram.js
- ref_node_assert
- addons.js
- aircrafts.js
- qr-scan/page.jsx
- boardingPass.js
- frontend_src_app_auth_tours_calendar_calendar_bundle
- ReviewsManager.jsx
- devDependencies
- services/page.jsx
- frontend_src_app_auth_tours_services_services_module
- frontend_src_app_auth_tours_hours_page_module
- frontend/README.md
- scripts
- compilerOptions
- next.config.mjs
- react
- authConfig.js
- postcss.config.mjs
- frontend_src_app_auth_components_setuptour_module
- scripts
- ApiComunicator
- calendar/page.jsx
- frontend_src_app_auth_tours_bookings_page_module
- mailer.js
- ExperienceList
- cleanEmail
- Reference — Canonical Templates
- frontend_src_app_auth_tours_aircrafts_page_module
- conexion-mysql.js
- Faq.jsx
- frontend_src_app_auth_tours_pilots_page_module
- SocialManager.jsx
- utils/bookingConfig.js
- Appendix B - Canonical Sources (read these before reinventing)
- withAuth.js
- layout.js
- addLog.js
- bookings/page.jsx
- 4. DESIGN ENGINEERING DIRECTIVES (Bias Correction)
- 10. REFERENCE VOCABULARY (Pattern Names the Agent Should Know)
- tasteskill: Anti-Slop Frontend Skill
- 9. AI TELLS (Forbidden Patterns)
- 11. REDESIGN PROTOCOL
- 3. DEFAULT ARCHITECTURE & CONVENTIONS
- 6. PERFORMANCE & ACCESSIBILITY GUARDRAILS
- useToast
- 0. BRIEF INFERENCE (Read the Room Before Anything Else)
- 12. THE BLOCK LIBRARY (Contract - Implementations Land Here Iteratively)
- 5. CONTEXT-AWARE PROACTIVITY
- 8. DARK MODE PROTOCOL
- 7. DIAL DEFINITIONS (Technical Reference)
- proxy.ts
- ponytail/SKILL.md
- frontend_src_app_auth_tours_book_dates_page_module
- frontend_src_app_auth_tours_gallery_page_module
- frontend_src_app_auth_tours_qr_scan_page_module
- qrBoardingPassPdf
- createReservation
- AircraftList
- confirmBooking
- getReservationsByAircraft
- devDependencies

## God Nodes (most connected - your core abstractions)
1. `ApiComunicator()` - 83 edges
2. `react` - 43 edges
3. `query()` - 33 edges
4. `useToast()` - 30 edges
5. `reactstrap` - 27 edges
6. `MessageModal()` - 25 edges
7. `Spinner()` - 24 edges
8. `ServiceList()` - 22 edges
9. `lucide-react` - 21 edges
10. `next` - 20 edges

## Surprising Connections (you probably didn't know these)
- `Non-Negotiable Rules (MUST NOT change)` --references--> `ApiComunicator()`  [INFERRED]
  .cursor/skills/react-express-app-blueprint/SKILL.md → frontend/src/helpers/ApiComunicator.js
- `Pages & Navigation` --references--> `ApiComunicator()`  [INFERRED]
  .cursor/skills/react-express-app-blueprint/SKILL.md → frontend/src/helpers/ApiComunicator.js
- `Authentication & Authorization` --references--> `withAuth()`  [INFERRED]
  .cursor/skills/react-express-app-blueprint/SKILL.md → backend/src/middleware/withAuth.js
- `fetchImages()` --calls--> `ApiComunicator()`  [EXTRACTED]
  frontend/src/app/(auth)/maintenance/gallery/page.jsx → frontend/src/helpers/ApiComunicator.js
- `fetchAddons()` --calls--> `ApiComunicator()`  [EXTRACTED]
  frontend/src/app/(auth)/operations/addons/page.jsx → frontend/src/helpers/ApiComunicator.js

## Import Cycles
- None detected.

## Communities (87 total, 25 thin omitted)

### Community 0 - "experiences.js"
Cohesion: 0.14
Nodes (13): createExperience(), db, deleteExperience(), editExperience(), express, getExperiences(), num(), payload() (+5 more)

### Community 1 - "reservations.js"
Cohesion: 0.11
Nodes (18): bookingConfigDb, checkAccount, crypto, db, dbAircrafts, deleteReservation(), express, { generateBoardingPass } (+10 more)

### Community 3 - "gallery.js"
Cohesion: 0.08
Nodes (36): ALLOWED_MIME, deleteImage(), ensureGalleryDir(), express, fs, galleryDir(), getImage(), listImages() (+28 more)

### Community 4 - "reservationsModel.js"
Cohesion: 0.08
Nodes (5): getReservationAddons(), getReservationsByDate(), getReservationsByDateRange(), getServiceAddons(), reservationAddonsWithIncluded()

### Community 5 - "SocialLogin.jsx"
Cohesion: 0.11
Nodes (27): Header(), titleMap, AuthLayout(), LayoutClientside(), Settings(), run(), submit(), frontend_src_app_login_login_module (+19 more)

### Community 6 - "server.js"
Cohesion: 0.07
Nodes (26): addons, aircrafts, app, auth, bodyParser, cookieParser, cors, corsOptions (+18 more)

### Community 7 - "pilots.js"
Cohesion: 0.11
Nodes (21): checkAccount, createPilot(), db, deletePilot(), editPilot(), express, fs, fsSync (+13 more)

### Community 8 - "toast.jsx"
Cohesion: 0.19
Nodes (17): Button, buttonVariants, Input, Toast, ToastClose, ToastDescription, frontend_src_components_ui_toast_toastprovider, ToastTitle (+9 more)

### Community 9 - "auth.js"
Cohesion: 0.07
Nodes (25): { addLog }, bcrypt, biometricLoginOptions(), biometricRegisterOptions(), checkAccount, connection, cookieOptions, crypto (+17 more)

### Community 10 - "dependencies"
Cohesion: 0.09
Nodes (23): dependencies, bcrypt, bcryptjs, cookie-parser, cors, currency.js, dotenv, exceljs (+15 more)

### Community 11 - "services.js"
Cohesion: 0.15
Nodes (22): addonRows(), assertService(), attachChildren(), checkAccount, clock(), createService(), db, deleteService() (+14 more)

### Community 12 - "dependencies"
Cohesion: 0.09
Nodes (22): dependencies, bootstrap, calendarkit-pro, clsx, date-fns, date-fns-tz, @daypilot/daypilot-lite-react, framer-motion (+14 more)

### Community 13 - "authModel.js"
Cohesion: 0.12
Nodes (31): createAccount(), createUser(), deactivateExpiredOtp(), deactivateOtpById(), deactivateOtpForEmail(), deactivateRecoveryById(), deactivateRecoveryForUser(), deletePasskeys() (+23 more)

### Community 14 - "otp.check.js"
Cohesion: 0.12
Nodes (21): issueOtp(), matchingOtp(), assert, dbCheck(), kept, now, { otpAccepts, stillActiveAfterIssue, newOtpCode, otpExpiresAt }, path (+13 more)

### Community 15 - "backend/package.json"
Cohesion: 0.11
Nodes (17): description, moment, tailwindcss-animate, main, name, version, bcrypt, cookie-parser (+9 more)

### Community 16 - "users.js"
Cohesion: 0.08
Nodes (33): countOtherAdmins(), createUser(), deactivateUser(), findEmail(), getRole(), getRoles(), getUser(), getUsers() (+25 more)

### Community 17 - "frontend/package.json"
Cohesion: 0.11
Nodes (18): eslintConfig, moment, tailwindcss-animate, name, private, version, babel-plugin-react-compiler, baseline-browser-mapping (+10 more)

### Community 18 - "instagram.js"
Cohesion: 0.06
Nodes (51): BRANDS, DESTINOS, parseBrand(), parseTarget(), embedUrl(), parseInstagramPermalink(), deleteInstagram(), deleteReview() (+43 more)

### Community 19 - "ref_node_assert"
Cohesion: 0.33
Nodes (4): assert, { codeFromTitle }, apiErrorText(), ref_node_assert

### Community 20 - "addons.js"
Cohesion: 0.18
Nodes (9): checkAccount, createAddon(), db, deleteAddon(), express, getAddons(), { pool }, router (+1 more)

### Community 21 - "aircrafts.js"
Cohesion: 0.17
Nodes (10): checkAccount, createAircraft(), db, deleteAircraft(), express, getAircrafts(), { pool }, restoreAircraft() (+2 more)

### Community 22 - "qr-scan/page.jsx"
Cohesion: 0.36
Nodes (8): displayValue(), formatPassengerName(), formatReservationDate(), mapQrApiError(), frontend_src_app_auth_operations_qr_scan_page_module, QR_ERR_EN, QrScanPage(), jsqr

### Community 23 - "boardingPass.js"
Cohesion: 0.18
Nodes (13): escapeHtml(), fs, generateBoardingPass(), htmlToPdf, moment, passengerFullName(), path, QRCode (+5 more)

### Community 25 - "ReviewsManager.jsx"
Cohesion: 0.43
Nodes (5): MaintenanceReviewsPage(), ToursReviewsPage(), ReviewsManager(), load(), starsLabel()

### Community 26 - "devDependencies"
Cohesion: 0.22
Nodes (9): devDependencies, babel-plugin-react-compiler, baseline-browser-mapping, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node (+1 more)

### Community 27 - "services/page.jsx"
Cohesion: 0.10
Nodes (26): ADVANCE, advanceLabel(), DAY_PRESETS, daysLabel(), durationLabel(), emptyForm, hourLabel(), money() (+18 more)

### Community 30 - "frontend/README.md"
Cohesion: 0.50
Nodes (3): Deploy on Vercel, Getting Started, Learn More

### Community 31 - "scripts"
Cohesion: 0.67
Nodes (3): scripts, dev, start

### Community 34 - "react"
Cohesion: 0.23
Nodes (15): frontend_src_app_auth_maintenance_gallery_page_module, INITIAL_FILTERS, emptyForm, frontend_src_app_auth_operations_gallery_page_module, frontend_src_app_auth_settings_page_module, emptyUser, frontend_src_components_ui_listing_module, SKIN (+7 more)

### Community 35 - "authConfig.js"
Cohesion: 0.31
Nodes (7): biometricRegister(), takeChallenge(), assert, { envList }, envList(), googleAudiences(), webauthnOrigins()

### Community 40 - "scripts"
Cohesion: 0.40
Nodes (5): scripts, build, dev, lint, start

### Community 41 - "ApiComunicator"
Cohesion: 0.23
Nodes (11): LogoutButton(), Sidebar(), ForgotPassword(), POST(), ResetPassword(), EMPTY, VerifyEmail(), frontend_src_components_setup_onboarding_setuptour_module (+3 more)

### Community 42 - "calendar/page.jsx"
Cohesion: 0.07
Nodes (42): BookDatesPage(), frontend_src_app_auth_operations_book_dates_page_module, frontend_src_app_auth_operations_calendar_calendar_bundle, bookParts(), Calendar(), confirmMove(), CalendarCreate(), eventFrom() (+34 more)

### Community 44 - "mailer.js"
Cohesion: 0.23
Nodes (12): { generateBoardingPass }, getTransporter(), moment, nodemailer, otpTransporter(), sendBookingDetails(), sendOtpEmail(), sendRecoveryEmail() (+4 more)

### Community 45 - "ExperienceList"
Cohesion: 0.33
Nodes (9): ExperienceFields(), ExperienceList(), confirmDelete(), fetchRows(), save(), toForm(), openForm(), toForm() (+1 more)

### Community 46 - "cleanEmail"
Cohesion: 0.18
Nodes (14): biometricLogin(), cleanEmail(), createOwner(), forgotPassword(), googleLogin(), login(), moment, recoveryHash() (+6 more)

### Community 47 - "Reference — Canonical Templates"
Cohesion: 0.06
Nodes (30): withAuth(), API Helper Template, Authorization Middleware Template, Backend Model Template, Backend Router Template, Backend Server Template, Backend Transaction Template, Backend withAuth Template (+22 more)

### Community 49 - "conexion-mysql.js"
Cohesion: 0.15
Nodes (8): mysql, pool, db, { pool }, db, { pool }, connection, mysql2

### Community 50 - "Faq.jsx"
Cohesion: 0.33
Nodes (6): Faqs(), frontend_src_app_faq_page_module, PublicFaq(), Faq(), faqs, frontend_src_components_faq_faq_module

### Community 54 - "SocialManager.jsx"
Cohesion: 0.39
Nodes (5): MaintenanceSocialPage(), ToursSocialPage(), frontend_src_components_cms_cms_module, SocialManager(), load()

### Community 55 - "utils/bookingConfig.js"
Cohesion: 0.23
Nodes (14): getServiceConfigByCode(), getServicePrices(), { normalizeProduct, serviceSlots }, query(), resolveProductConfig(), addDays(), DEFAULT_WEEKDAYS, isDateInWindow() (+6 more)

### Community 56 - "Appendix B - Canonical Sources (read these before reinventing)"
Cohesion: 0.09
Nodes (21): APPENDICES - Real Source-Backed Reference Material, Appendix A - Install Commands per Design System, Appendix B - Canonical Sources (read these before reinventing), Appendix C - Apple Liquid Glass: Honest Web Approximation, Apple Liquid Glass (Apple platforms only), Atlassian, Bootstrap, Carbon (+13 more)

### Community 59 - "layout.js"
Cohesion: 0.29
Nodes (5): frontend_src_app_globals, metadata, michroma, frontend_src_app_theme, bootstrap

### Community 62 - "bookings/page.jsx"
Cohesion: 0.33
Nodes (8): BookingsContent(), fetchReservations(), BookingsPage(), defaultStatusIds(), findWeekIndexForDate(), getIsoWeekRangesOverlappingMonth(), frontend_src_app_auth_operations_bookings_page_module, Spinner()

### Community 63 - "4. DESIGN ENGINEERING DIRECTIVES (Bias Correction)"
Cohesion: 0.17
Nodes (12): 4.10 Quotes & Testimonials, 4.11 Page Theme Lock (Light / Dark Mode Consistency), 4.1 Typography, 4.2 Color Calibration, 4.3 Layout Diversification, 4.4 Materiality, Shadows, Cards, 4.5 Interactive UI States, 4.6 Data & Form Patterns (+4 more)

### Community 64 - "10. REFERENCE VOCABULARY (Pattern Names the Agent Should Know)"
Cohesion: 0.20
Nodes (10): 10. REFERENCE VOCABULARY (Pattern Names the Agent Should Know), Animation Library Choice, Cards & Containers, Galleries & Media, Hero Paradigms, Layout & Grids, Micro-Interactions & Effects, Navigation & Menus (+2 more)

### Community 65 - "tasteskill: Anti-Slop Frontend Skill"
Cohesion: 0.20
Nodes (10): 13. OUT OF SCOPE, 14. FINAL PRE-FLIGHT CHECK, 1.A Dial Inference (design read → dial values), 1.B Use-Case Presets, 1.C How the Dials Drive Output, 1. THE THREE DIALS (Core Configuration), 2.A When to reach for a real design system (use official packages), 2.B When the brief is an aesthetic, not a system (+2 more)

### Community 66 - "9. AI TELLS (Forbidden Patterns)"
Cohesion: 0.25
Nodes (8): 9.A Visual & CSS, 9. AI TELLS (Forbidden Patterns), 9.B Typography, 9.C Layout & Spacing, 9.D Content & Data ("Jane Doe" Effect), 9.E External Resources & Components, 9.F Production-Test Tells (banned outright), 9.G EM-DASH BAN (the single most-violated Tell)

### Community 67 - "11. REDESIGN PROTOCOL"
Cohesion: 0.29
Nodes (7): 11.A Detect the Mode (first action), 11.B Audit Before Touching, 11.C Preservation Rules, 11.D Modernisation Levers (priority order), 11.E Decision Tree: Targeted Evolution vs Full Redesign, 11.F What Never Changes Silently, 11. REDESIGN PROTOCOL

### Community 68 - "3. DEFAULT ARCHITECTURE & CONVENTIONS"
Cohesion: 0.29
Nodes (7): 3.A Stack, 3.B State, 3.C Icons, 3.D Emoji Policy, 3. DEFAULT ARCHITECTURE & CONVENTIONS, 3.E Responsiveness & Layout Mechanics, 3.F Dependency Verification (mandatory)

### Community 69 - "6. PERFORMANCE & ACCESSIBILITY GUARDRAILS"
Cohesion: 0.29
Nodes (7): 6.A Hardware Acceleration, 6.B Reduced Motion (mandatory), 6.C Dark Mode (mandatory for any consumer-facing page), 6.D Core Web Vitals Targets, 6.E DOM Cost, 6.F Z-Index Restraint, 6. PERFORMANCE & ACCESSIBILITY GUARDRAILS

### Community 70 - "useToast"
Cohesion: 0.13
Nodes (18): GalleryPage(), fetchImages(), AddonList(), fetchAddons(), ToursGalleryPage(), fetchImages(), PilotList(), fetchPilots() (+10 more)

### Community 71 - "0. BRIEF INFERENCE (Read the Room Before Anything Else)"
Cohesion: 0.40
Nodes (5): 0.A Read these signals first, 0.B Output a one-line "Design Read" before generating, 0. BRIEF INFERENCE (Read the Room Before Anything Else), 0.C If the brief is ambiguous, ask one question, do not guess, 0.D Anti-Default Discipline

### Community 72 - "12. THE BLOCK LIBRARY (Contract - Implementations Land Here Iteratively)"
Cohesion: 0.40
Nodes (5): 12.A File Location, 12.B Required Frontmatter, 12.C Required Body Sections, 12.D Block-Library Discipline, 12. THE BLOCK LIBRARY (Contract - Implementations Land Here Iteratively)

### Community 73 - "5. CONTEXT-AWARE PROACTIVITY"
Cohesion: 0.40
Nodes (5): 5.A Sticky-Stack - Canonical Skeleton, 5.B Horizontal-Pan - Canonical Skeleton, 5.C Scroll-Reveal Stagger - Canonical Skeleton (lighter alternative), 5. CONTEXT-AWARE PROACTIVITY, 5.D Forbidden Animation Patterns

### Community 74 - "8. DARK MODE PROTOCOL"
Cohesion: 0.40
Nodes (5): 8.A Token Strategy (pick one, stick to it), 8.B Do Not Prescribe Specific Colors Here, 8.C Default Mode, 8.D Test in Both Modes Before Finishing, 8. DARK MODE PROTOCOL

### Community 75 - "7. DIAL DEFINITIONS (Technical Reference)"
Cohesion: 0.50
Nodes (4): 7. DIAL DEFINITIONS (Technical Reference), DESIGN_VARIANCE (Level 1-10), MOTION_INTENSITY (Level 1-10), VISUAL_DENSITY (Level 1-10)

### Community 81 - "qrBoardingPassPdf"
Cohesion: 0.46
Nodes (8): assertQrValidationEligible(), completeQrValidation(), experienceTitle(), normalizeConfirmationHash(), passengersForQrPreview(), qrBoardingPassPdf(), qrReject(), validateQrConfirmation()

### Community 82 - "createReservation"
Cohesion: 0.32
Nodes (8): createReservation(), createReservationRange(), Currency, getAvailableHours(), getBookableHours(), findPriceForPassengers(), formatHour(), weekdayOfDate()

### Community 83 - "AircraftList"
Cohesion: 0.33
Nodes (6): AircraftList(), fetchAircrafts(), goToBookings(), countActiveFilters(), hasPlannedBookings(), isDeleted()

### Community 84 - "confirmBooking"
Cohesion: 0.50
Nodes (4): confirmBooking(), generateConfirmationHash(), getReservationById(), passengersForBoardingPdf()

### Community 85 - "getReservationsByAircraft"
Cohesion: 0.67
Nodes (4): getReservationsByAircraft(), getReservationsByDate(), moment, validateDateParam()

## Knowledge Gaps
- **395 isolated node(s):** `name`, `version`, `description`, `main`, `start` (+390 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 530 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **25 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ApiComunicator()` connect `ApiComunicator` to `react`, `SocialLogin.jsx`, `useToast`, `calendar/page.jsx`, `ExperienceList`, `Reference — Canonical Templates`, `AircraftList`, `ref_node_assert`, `qr-scan/page.jsx`, `SocialManager.jsx`, `ReviewsManager.jsx`, `services/page.jsx`, `bookings/page.jsx`?**
  _High betweenness centrality (0.154) - this node is a cross-community bridge._
- **Why does `express` connect `instagram.js` to `experiences.js`, `reservations.js`, `gallery.js`, `server.js`, `pilots.js`, `auth.js`, `services.js`, `backend/package.json`, `users.js`, `addons.js`, `aircrafts.js`?**
  _High betweenness centrality (0.085) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `SocialLogin.jsx`, `toast.jsx`, `ApiComunicator`, `calendar/page.jsx`, `frontend/package.json`, `qr-scan/page.jsx`, `SocialManager.jsx`, `ReviewsManager.jsx`, `services/page.jsx`, `bookings/page.jsx`?**
  _High betweenness centrality (0.060) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `ApiComunicator()` (e.g. with `Non-Negotiable Rules (MUST NOT change)` and `Pages & Navigation`) actually correct?**
  _`ApiComunicator()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `version`, `description` to the rest of the system?**
  _395 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `experiences.js` be split into smaller, more focused modules?**
  _Cohesion score 0.1368421052631579 - nodes in this community are weakly interconnected._
- **Should `reservations.js` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._