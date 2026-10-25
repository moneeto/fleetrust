# Graph Report - backend  (2026-10-24)

## Corpus Check
- 49 files · ~27,081 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 2 file(s) not represented in the graph (top: .example 1, (none) 1)

## Summary
- 538 nodes · 909 edges · 32 communities (27 shown, 5 thin omitted)
- Extraction: 78% EXTRACTED · 22% INFERRED · 0% AMBIGUOUS · INFERRED: 202 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `219a2750`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- reservations.js
- services.js
- experiences.js
- reservationsModel.js
- server.js
- instagram.js
- pilots.js
- boardingPass.js
- dependencies
- auth.js
- gallery.js
- toursGallery.js
- authModel.js
- routes.js
- package.json
- cmsModel.js
- reviews.js
- recovery.check.js
- express
- aircrafts.js
- addons.js
- otp.check.js
- conexion-mysql.js
- login
- addLog.js
- forgotPassword
- withAuth.js
- scripts
- devDependencies

## God Nodes (most connected - your core abstractions)
1. `query()` - 20 edges
2. `express` - 16 edges
3. `query()` - 16 edges
4. `pool` - 15 edges
5. `createReservation()` - 10 edges
6. `parseBrand()` - 8 edges
7. `createService()` - 8 edges
8. `generateBoardingPass()` - 8 edges
9. `serializeWeekdays()` - 8 edges
10. `otpExpiresAt()` - 8 edges

## Surprising Connections (you probably didn't know these)
- `filterHoursForProduct()` --indirect_call--> `formatHour()`  [INFERRED]
  src/models/bookingConfigModel.js → src/utils/bookingConfig.js
- `issueOtp()` --calls--> `sendOtpEmail()`  [EXTRACTED]
  src/routes/auth.js → src/utils/mailer.js
- `issueOtp()` --calls--> `otpExpiresAt()`  [EXTRACTED]
  src/routes/auth.js → src/utils/otp.js
- `register()` --calls--> `verifyRecaptcha()`  [EXTRACTED]
  src/routes/auth.js → src/utils/recaptcha.js
- `forgotPassword()` --calls--> `sendRecoveryEmail()`  [EXTRACTED]
  src/routes/auth.js → src/utils/mailer.js

## Import Cycles
- None detected.

## Communities (32 total, 5 thin omitted)

### Community 0 - "reservations.js"
Cohesion: 0.08
Nodes (41): assertQrValidationEligible(), bookingConfigDb, checkAccount, completeQrValidation(), confirmBooking(), createReservation(), createReservationRange(), crypto (+33 more)

### Community 1 - "services.js"
Cohesion: 0.08
Nodes (22): addonRows(), assertService(), attachChildren(), checkAccount, createService(), db, deleteService(), editService() (+14 more)

### Community 2 - "experiences.js"
Cohesion: 0.09
Nodes (28): filterHoursForProduct(), getServiceConfigByCode(), getServiceHours(), getServicePrices(), { normalizeProduct, formatHour }, query(), resolveProductConfig(), createExperience() (+20 more)

### Community 3 - "reservationsModel.js"
Cohesion: 0.07
Nodes (5): getReservationAddons(), getReservationsByDate(), getReservationsByDateRange(), getServiceAddons(), reservationAddonsWithIncluded()

### Community 4 - "server.js"
Cohesion: 0.07
Nodes (27): ref_body_parser, ref_http, addons, aircrafts, app, auth, availableHours, bodyParser (+19 more)

### Community 5 - "instagram.js"
Cohesion: 0.11
Nodes (24): BRANDS, DESTINOS, parseBrand(), embedUrl(), parseInstagramPermalink(), createPost(), db, deletePost() (+16 more)

### Community 6 - "pilots.js"
Cohesion: 0.08
Nodes (21): checkAccount, createPilot(), db, deletePilot(), editPilot(), express, fs, fsSync (+13 more)

### Community 7 - "boardingPass.js"
Cohesion: 0.11
Nodes (25): ref_fs, html-pdf-node, moment, nodemailer, nodemailer-smtp-transport, qrcode, escapeHtml(), fs (+17 more)

### Community 8 - "dependencies"
Cohesion: 0.10
Nodes (21): dependencies, bcrypt, bcryptjs, cookie-parser, cors, currency.js, dotenv, exceljs (+13 more)

### Community 9 - "auth.js"
Cohesion: 0.10
Nodes (17): { addLog }, bcrypt, checkAccount, connection, cookieOptions, crypto, db, express (+9 more)

### Community 10 - "gallery.js"
Cohesion: 0.15
Nodes (18): multer, ALLOWED_MIME, deleteImage(), ensureGalleryDir(), express, fs, galleryDir(), getImage() (+10 more)

### Community 11 - "toursGallery.js"
Cohesion: 0.15
Nodes (18): sharp, ALLOWED_MIME, deleteImage(), ensureGalleryDir(), express, fs, galleryDir(), getImage() (+10 more)

### Community 12 - "authModel.js"
Cohesion: 0.20
Nodes (18): createAccount(), createUser(), deactivateExpiredOtp(), deactivateOtpById(), deactivateOtpForEmail(), deactivateRecoveryById(), deactivateRecoveryForUser(), getActiveOtps() (+10 more)

### Community 13 - "routes.js"
Cohesion: 0.15
Nodes (13): createRoute(), db, deleteRoute(), editRoute(), express, getRoutes(), num(), payload() (+5 more)

### Community 14 - "package.json"
Cohesion: 0.12
Nodes (15): description, main, name, version, bcrypt, bcryptjs, cookie-parser, cors (+7 more)

### Community 15 - "cmsModel.js"
Cohesion: 0.26
Nodes (14): deleteInstagram(), deleteReview(), getInstagramById(), insertInstagram(), insertReview(), listInstagram(), listReviews(), listVisibleInstagram() (+6 more)

### Community 16 - "reviews.js"
Cohesion: 0.23
Nodes (12): parseTarget(), createReview(), db, deleteReview(), express, listReviews(), orderReviews(), { parseTarget } (+4 more)

### Community 17 - "recovery.check.js"
Cohesion: 0.21
Nodes (11): ref_crypto, ref_path, crypto, otpExpiresAt(), stillActiveAfterIssue(), assert, crypto, dbCheck() (+3 more)

### Community 18 - "express"
Cohesion: 0.17
Nodes (7): express, db, express, getHours(), { pool }, router, withAuth

### Community 19 - "aircrafts.js"
Cohesion: 0.17
Nodes (10): checkAccount, createAircraft(), db, deleteAircraft(), express, getAircrafts(), { pool }, restoreAircraft() (+2 more)

### Community 20 - "addons.js"
Cohesion: 0.18
Nodes (9): checkAccount, createAddon(), db, deleteAddon(), express, getAddons(), { pool }, router (+1 more)

### Community 21 - "otp.check.js"
Cohesion: 0.20
Nodes (8): ref_node_assert, assert, { codeFromTitle }, assert, kept, now, { otpAccepts, stillActiveAfterIssue, newOtpCode, otpExpiresAt }, path

### Community 22 - "conexion-mysql.js"
Cohesion: 0.28
Nodes (6): mysql2, mysql, pool, db, { pool }, dbCheck()

### Community 23 - "login"
Cohesion: 0.29
Nodes (6): login(), matchingOtp(), moment, verifyEmail(), otpAccepts(), verifyRecaptcha()

### Community 24 - "addLog.js"
Cohesion: 0.33
Nodes (3): addLog(), dbLog, connection

### Community 26 - "forgotPassword"
Cohesion: 0.40
Nodes (6): cleanEmail(), forgotPassword(), issueOtp(), register(), validEmail(), newOtpCode()

### Community 29 - "scripts"
Cohesion: 0.67
Nodes (3): scripts, dev, start

## Knowledge Gaps
- **198 isolated node(s):** `name`, `version`, `description`, `main`, `start` (+193 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 285 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `express` connect `express` to `reservations.js`, `services.js`, `experiences.js`, `server.js`, `instagram.js`, `pilots.js`, `auth.js`, `gallery.js`, `toursGallery.js`, `routes.js`, `package.json`, `reviews.js`, `aircrafts.js`, `addons.js`?**
  _High betweenness centrality (0.174) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.073) - this node is a cross-community bridge._
- **Why does `pool` connect `conexion-mysql.js` to `reservations.js`, `services.js`, `experiences.js`, `instagram.js`, `pilots.js`, `routes.js`, `reviews.js`, `recovery.check.js`, `express`, `aircrafts.js`, `addons.js`?**
  _High betweenness centrality (0.067) - this node is a cross-community bridge._
- **What connects `name`, `version`, `description` to the rest of the system?**
  _198 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `reservations.js` be split into smaller, more focused modules?**
  _Cohesion score 0.08084163898117387 - nodes in this community are weakly interconnected._
- **Should `services.js` be split into smaller, more focused modules?**
  _Cohesion score 0.07557354925775979 - nodes in this community are weakly interconnected._
- **Should `experiences.js` be split into smaller, more focused modules?**
  _Cohesion score 0.09009009009009009 - nodes in this community are weakly interconnected._