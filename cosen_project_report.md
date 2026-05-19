# 🚀 Cosen — Full Project Report
### Campus Marketplace | Status: Production Deployed | May 2026

---

## 💡 The Vision

**Cosen** is a **university-verified, peer-to-peer service marketplace** — think Fiverr, but exclusively for campus students.

> *"Every campus is full of hidden talent. A student who can code sits next to one who needs a website. Cosen connects them."*

### Core Idea
- Students **sell** their skills (coding, design, writing, tutoring, data, music…)
- Students **hire** verified campus peers with **escrow payment protection**
- Everyone is verified via **university email** (`.edu` / `.ac.in`) + ID card upload
- Real-time chat for every order + peer-to-peer DMs
- A reputation system (ratings + reviews) that stays on-platform

### Why It Matters
| Problem | Cosen's Solution |
|---|---|
| Skills go unused on campus | Marketplace to monetize them |
| Hiring freelancers is expensive | Peer pricing, campus rates |
| No trust between strangers | University email verification + ID card |
| Payment disputes | Razorpay escrow — paid only on delivery |
| No real-time coordination | Socket.io order chat + DM inbox |

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19 + Vite, Tailwind CSS, Zustand, React Router v7 |
| **Backend** | Node.js + Express 4 |
| **Real-time** | Socket.io 4 (order chat + peer DMs) |
| **Database** | Supabase (PostgreSQL) — full schema with FTS, triggers, cascades |
| **Auth** | JWT + Google OAuth2 |
| **Payments** | Razorpay (Indian gateway) + escrow flow |
| **Storage** | Cloudinary (avatars, service images, student ID cards) |
| **Email** | Brevo HTTP API (works on Railway, any recipient) |
| **Deployment** | Railway (backend) + Railway (frontend) |

---

## ✅ What's Fully Built (7 Phases Complete)

### Phase 1 — Auth & Foundation ✅
- User registration with `.edu` / `.ac.in` email enforcement
- JWT authentication with bcrypt password hashing
- Google OAuth2 login & signup
- Email verification via OTP (6-digit, 15 min expiry)
- Password reset via secure token email
- `ProtectedRoute` component — guards all private pages
- Auth middleware on all protected API endpoints
- Zustand global auth store with safe localStorage parsing

### Phase 2 — Core UI & Pages ✅
- **Stripe-inspired design system** — CSS variables, reusable component classes
- **Navbar** — auth-aware, responsive, glassmorphism on hero, DM unread badge
- **Landing Page** — fullscreen cinematic video hero, "How It Works" interactive accordion, categories, featured services carousel, trending marquee, CTA banner
- **Login Page** — Google OAuth + email/password, animated auth card
- **Signup Page** — 3-step wizard (Account → Profile → Interests)
- **Forgot Password** + **Reset Password** pages
- **Dynamic page titles** — tab title updates per route (like Supabase)
- **Custom favicon** — Cosen SVG logo

### Phase 3 — Onboarding & Profiles ✅
- **Onboarding wizard** — 4 steps: Basic Info → ID Upload → Social Links → Agreement
- **Profile Page** — own profile editor (avatar, bio, skills, department)
- **Seller Profile Page** — public view with cover banner, stats, services list, "Contact Seller" DM button

### Phase 4 — Services ✅
- **Post a Service** — title, category, price (min ₹50), delivery days, tags, up to 5 Cloudinary images
- **Browse Page** — live search (debounced 300ms), URL-synced filters, category chips, sort options, skeleton loading
- **Service Detail Page** — service images, seller info, reviews, Razorpay "Place Order" button
- **Full CRUD API** — create, read, update, delete + user-specific listing

### Phase 5 — Orders & Payments ✅
- **Razorpay integration** — dynamic script loading, server-side signature verification
- **Escrow flow** — platform fee deducted, seller earnings stored
- **Order lifecycle** — placed → delivered (seller) → completed / disputed (buyer)
- **Payment Success Page** — confirmation after payment
- **Order Detail Page** — status management + live chat

### Phase 6 — Real-Time Messaging ✅
- **Order Chat** — Socket.io room per order, messages persisted to Supabase
- **Direct Messages** — peer-to-peer DM system with `conversations` + `direct_messages` tables
- **Messages Page** — full inbox UI (sidebar + chat window)
- **Unread badge** — polled every 30s on Navbar DM icon

### Phase 7 — Reviews & Dashboard ✅
- **Reviews API** — submit after order completion, auto-triggers rating recalculation in DB
- **Dashboard Page** — buyer active orders, seller incoming orders, earnings, quick links
- **Verify Email Page** — OTP entry page after registration

---

## 🔧 Production Bugs Fixed (This Session — May 2026)

| Bug | Root Cause | Fix Applied |
|---|---|---|
| Blank page on load | `JSON.parse("undefined")` crash in `authStore.js` | Safe parse with try/catch |
| CORS blocking login | `CLIENT_URL` set to Google Client ID (not frontend URL) | Fixed in Railway env vars |
| 404 on all API calls | `BASE_URL` missing `/api` suffix | Fixed in `api.js` |
| 500 on registration | DB `user_role` enum didn't have `buyer/seller/both` | Added via `ALTER TYPE` SQL |
| "Registration failed" UI error | `sendEmail` was blocking HTTP response — axios timed out | Made email **non-blocking** (fire-and-forget) |
| "Failed to send reset link" | Same SMTP blocking issue on forgot-password | Same non-blocking fix |
| Email not arriving on Railway | Railway blocks outbound SMTP (ports 25/465/587) | Switched to **Brevo HTTP API** |
| Landing page shown to logged-in users | No redirect check on `/` | Added `useEffect` redirect to `/browse` |
| Post-login goes to `/dashboard` | Hardcoded navigation in Login/Signup | Changed all redirects to `/browse` |

---

## 🌐 Deployment Status

| Service | Platform | URL |
|---|---|---|
| **Frontend** | Railway | `https://perpetual-embrace-production-0c3b.up.railway.app` |
| **Backend** | Railway | `https://cosen-production.up.railway.app` |
| **Database** | Supabase | Project ID: `lasgvbjdsqzfbggehpjg` |
| **GitHub** | cosenhub07/cosen | Auto-deploys on push to `main` |

### Railway Environment Variables (Backend)
All required variables are set ✅:
`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`, `JWT_EXPIRE`,
`CLIENT_URL`, `FRONTEND_URL`, `CLOUDINARY_*`, `RAZORPAY_*`,
`EMAIL_FROM`, `BREVO_API_KEY`, `VITE_GOOGLE_CLIENT_ID`

---

## ⏳ What's Pending (Not Yet Built)

### 🔴 High Priority — Core Gaps
- [ ] **Email notifications for orders** — notify buyer when seller delivers, notify seller when order is placed
- [ ] **Read receipts in DM** — mark messages as read when conversation is opened
- [ ] **Edit/Delete own service** — frontend UI for service management (API exists, no UI)
- [ ] **OTP email verification** — verify that OTP actually arrives reliably post-Brevo switch (test in production)

### 🟡 Medium Priority — UX Polish
- [ ] **In-app notification bell** — real-time feed for order updates, new messages, reviews
- [ ] **Service search improvements** — price range slider, min-rating filter, delivery-time filter
- [ ] **Typing indicators** in DM chat
- [ ] **File attachments** in order chat and DMs
- [ ] **Saved/bookmarked services** — wishlist for buyers
- [ ] **Seller analytics** — views, click-through rate, orders conversion per service
- [ ] **Service packages** — Basic / Standard / Premium tiers per service

### 🟠 Trust & Safety
- [ ] **Admin panel** — view users, services, orders; ban/suspend; dispute mediation
- [ ] **Dispute resolution flow** — buyer raises dispute → admin reviews → manual resolution
- [ ] **Seller levels** — Bronze / Silver / Gold based on completed orders & ratings
- [ ] **Portfolio section** — sellers attach past work samples to profile

### 🔵 Long-Term / Growth
- [ ] **Mobile app** — React Native with push notifications
- [ ] **University sub-marketplaces** — multi-tenant (one Cosen per university)
- [ ] **AI recommendations** — personalized service feed based on browsing
- [ ] **Campus leaderboard** — top earners per university per semester
- [ ] **International payments** — Stripe for non-India campuses

---

## 📊 Database Schema (Quick Reference)

```
users ──────────┬──── services (seller_id)
                │         │
                │         └──── orders ──── reviews
                │                  │
                │                  └──── messages (order chat)
                │
                └──── conversations ──── direct_messages (DMs)
```

**Key DB features:**
- UUID primary keys everywhere
- Full-text search (FTS) with GIN index on `services`
- Auto rating recalculation trigger on `reviews` insert
- `user_role` enum: `student`, `admin`, `buyer`, `seller`, `both`
- Cascade deletes across all related tables

---

## 🗺️ What to Build Next (Suggested Order)

```
1. ✉️  Test OTP + reset emails in production with Brevo
2. 🔔  Email notifications for order events (placed / delivered / completed)
3. 🖊️  Edit/Delete service UI (API already exists)
4. 📬  Read receipts in DM chat
5. 🔔  In-app notification bell
6. 🛡️  Admin panel (basic — view users, orders, disputes)
7. 🏆  Seller levels (Bronze/Silver/Gold)
8. 💼  Portfolio section on seller profiles
```

---

## 💡 Core Principles

| Principle | Implementation |
|---|---|
| **Campus Trust** | University email + student ID card upload required |
| **Payment Safety** | Razorpay escrow — held until buyer confirms delivery |
| **Real Community** | Reviews, ratings, and reputation stay on-platform |
| **Affordable** | Peer prices, not agency rates |
| **Real-Time** | Socket.io for instant chat everywhere |
| **Production-Grade** | Deployed on Railway, Supabase, Cloudinary, Brevo |

---
******
---

## 📱 SMS / Phone Verification — Migration Log (May 13–14, 2026)

This section documents the full journey of attempting to add phone number verification to the onboarding flow.

### Attempt 1 — Brevo SMS (Legacy, Removed)
The original codebase had a Brevo SMS integration (`server/utils/sendSms.js`) using the Brevo transactional SMS API.
- **Removed** because Brevo provides very few free SMS credits per month, making it unsustainable for user growth.

---

### Attempt 2 — Firebase Phone Authentication

**Goal:** Use Firebase Phone Auth (free tier: ~10,000 SMS/month) for OTP verification.

**Changes Made:**
| File | Change |
|---|---|
| `client/src/lib/firebase.js` | [NEW] Created Firebase client SDK initialization file using `VITE_FIREBASE_*` env vars |
| `client/src/pages/Onboarding.jsx` | Integrated `RecaptchaVerifier` + `signInWithPhoneNumber` from `firebase/auth` |
| `client/src/store/authStore.js` | Added `linkFirebasePhone(idToken)` method to call the backend verify endpoint |
| `server/config/firebaseAdmin.js` | [NEW] Firebase Admin SDK initialization using service account credentials |
| `server/routes/auth.js` | Added `POST /api/auth/firebase-phone-verify` route to validate Firebase ID tokens |
| `server/utils/sendSms.js` | Deleted the legacy Brevo SMS utility |
| `server/.env` | Added `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` |
| `client/.env` | Added `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID` |

**Errors Encountered & Fixed:**
| Error | Root Cause | Fix |
|---|---|---|
| `Cannot find module '../utils/sendSms'` | Old import still in `auth.js` after deleting the file | Removed the import |
| `⚠️ Firebase Admin configuration is missing` | `.env` was saved in UTF-16LE encoding, Dotenv couldn't read it | Converted `.env` to UTF-8 |
| `auth/operation-not-allowed` | Phone sign-in provider was not enabled in Firebase Console | Enabled Phone provider in Firebase Console → Authentication → Sign-in method |
| `auth/billing-not-enabled` | Firebase requires a Blaze (Pay-as-you-go) plan to send real SMS | **Blocker** — could not resolve |
| `[OR_BACR2_44]` | Google Cloud billing rejected card (India debit card restrictions) | **Blocker** — could not resolve |

**Outcome: ❌ Abandoned.** Google Cloud Billing refused all payment methods (India debit card restriction). Firebase Phone Auth requires the Blaze plan regardless of free quota.

---

### Attempt 3 — Fast2SMS

**Goal:** Use Fast2SMS (India-specific SMS provider) — claimed to work without credit card.

**Changes Made:**
| File | Change |
|---|---|
| `client/src/lib/firebase.js` | [DELETED] Removed Firebase client SDK |
| `server/config/firebaseAdmin.js` | [DELETED] Removed Firebase Admin SDK |
| `server/utils/sendSms.js` | [NEW] Created Fast2SMS OTP utility using `axios` POST to `https://www.fast2sms.com/dev/bulkV2` |
| `server/routes/auth.js` | Replaced `POST /firebase-phone-verify` with `POST /send-phone-otp` + `POST /verify-phone-otp` |
| `server/.env` | Removed Firebase keys, added `FAST2SMS_API_KEY` |
| `client/.env` | Removed all `VITE_FIREBASE_*` variables |
| `client/src/store/authStore.js` | Replaced `linkFirebasePhone` with `sendPhoneOtp(phone)` and `verifyPhoneOtp(otp)` |
| `client/src/pages/Onboarding.jsx` | Removed `RecaptchaVerifier`, Firebase imports; reconnected to `sendPhoneOtp` / `verifyPhoneOtp` store methods |

**Errors Encountered:**
| Error | Root Cause | Fix |
|---|---|---|
| `500` on `/send-phone-otp` (client `.env` blank page) | `.env` saved in wrong encoding, Vite couldn't read Firebase vars | Rewrote `client/.env` as clean UTF-8 |
| Build failed on Railway: `cannot resolve firebase/auth` | `package.json` not committed to GitHub — Railway didn't install Firebase | Committed `package.json` and `package-lock.json` for both client & server |
| `500` — `FAST2SMS_API_KEY is not configured` | API key not added to Railway Backend environment variables | Added to Railway Variables |
| `400` — number format rejected | Was sending `+919876543210` but Fast2SMS expects `9876543210` | Fixed `sendSms.js` to strip `+91` prefix |
| `status_code: 996` — website not verified | Fast2SMS OTP API requires DLT registration + website verification | **Blocker** — see below |

**Outcome: ❌ Abandoned.** Fast2SMS OTP API requires **DLT (Distributed Ledger Technology) registration** — a mandatory TRAI (India telecom regulator) compliance process requiring a registered business entity, approved Sender ID, and approved message templates. This process takes weeks and is meant for established businesses.

---

### Current State — Phone Verification Suspended

**The `send-phone-otp` and `verify-phone-otp` backend routes remain in the codebase** but are non-functional without a DLT-registered SMS provider.

The `sendSms.js` utility is also kept for future use once DLT registration is completed.

**Recommended next steps for phone verification:**
1. **Short-term:** Make phone number collection **optional** in the onboarding wizard (skip OTP requirement). Email verification is the primary trust signal.
2. **Long-term:** Complete DLT registration as a business entity and re-enable Fast2SMS or MSG91 OTP routes.

---

## 📅 Daily Work Log

### May 17, 2026 — Negotiable Services & Bug Squashing
**Objective**: Build a dynamic price negotiation phase for services like "Study Helper" and resolve persisting UI bugs.

**Features Implemented:**
- **Service Sub-Categorization**: Added specialized fields (Assignment, Tutorial, Manual, Custom) and an `isNegotiable` toggle when posting a new service.
- **Dynamic Negotiation Workflow**: 
  - Orders for negotiable services now begin in a `pending_negotiation` state.
  - Built a dedicated negotiation UI in the order chat where sellers can enter an agreed-upon "Locked Price".
- **Pending Payment Flow**: Created robust Razorpay endpoints (`create-order-for-pending`, `verify-pending`) allowing buyers to smoothly pay the custom locked price without leaving the order screen.

**Bug Fixes & UX Polish:**
- **Mobile Navbar Fix**: Repaired the outside-click detector that was instantly collapsing the mobile notification sheet when tapped.
- **Mobile Notification Routing**: Fixed a race condition with React Router's `<Link>` that prevented mobile notifications from redirecting to their target URLs.
- **Accurate Online Indicators**: Rewrote the Order Chat header's green tick logic. It now leverages `Socket.io` user presence (`online_users_list`, `user_online`, `user_offline`) to accurately display whether the other party is actually online, instead of blindly trusting the local socket state.
- **Payment Success Payload**: Fixed a blank page crash after payment verification by ensuring the backend `select()` query returns nested buyer, seller, and service relations.
- **Inline Success Banners**: Replaced intrusive browser alerts with smooth, inline green banners during the price locking phase.

---

### May 18, 2026 — Art & Design Customization & Portfolio Uplift
**Objective**: Build a high-fidelity guided posting experience for the **Art & Design** service category, enabling specialized subtypes, automated templates, and work portfolio samples.

**Features Implemented:**
- **Guided Subtype Selector**: Selecting the *Art & Design* category now displays 7 modern tile cards:
  - 🎨 Poster & Banner Help
  - 📊 Presentation Help
  - 📄 Resume Help
  - 📸 Instagram Posts & Thumbnails
  - ▶️ YouTube Thumbnails
  - 🖥️ Website UI Design
  - ✨ Custom Service
- **Smart Description Templates**: Integrated context-aware description templates. When a subtype is clicked, it automatically pre-fills the description with high-quality copy to streamline the onboarding experience for service providers.
- **Past Work Samples (Portfolio)**: Built a multi-image upload component allowing designers to upload up to 5 portfolio images of past work with high-quality upload feedback and a dynamic preview grid.
- **Work Gallery UI**: Enhanced `ServiceDetail.jsx` with a dedicated **Past Work Samples** showcase grid featuring hover zoom transitions, backdrop filters, and click-to-view-full overlays.
- **Backend Services Extension**: Updated `server/routes/services.js` mapper (`mapService`), creator, and updater to fully support arrays under the `portfolio_images` column.

**Difficulties & Solutions:**
- **Supabase RPC/SQL Limits**: We tried running SQL migrations dynamically using client rpc (`exec_sql`) and direct REST headers, but the hosted REST schema cache was not exposed or preconfigured for administrative functions.
- **DNS Resolution Blocker**: Browser subagent was unable to resolve `supabase.com` due to container environment restrictions.
- **Resolution**: Created a local check utility `add_portfolio_column.js` and printed a copy-pasteable SQL block so the user can easily execute the migration directly inside their Supabase dashboard editor.

---

### May 18, 2026 — Food Friendship Category Launch & Dynamic Form Customization
**Objective**: Successfully launch the **Food Friendship** marketplace category to replace the legacy *Writing & CV* category, customize the posting wizard with category-specific options (Veg/Non-Veg/Both), implement dynamic label/placeholder guide systems for Title and Description, and optimize backend validation.

**Features Implemented:**
- **"Food Friendship" Transition**: Fully retired the "Writing & CV" category and deployed "Food Friendship" (using `UtensilsCrossed` icon) across all components (Navbar, Landing page, Browse marketplace, Signup onboarding, and backend service whitelist).
- **Specialized Food Flow**: Selecting *Food Friendship* displays a visual dietary selection card where users choose between Veg 🟢, Non-Veg 🔴, and Both 🟡 options.
- **Dynamic Field Customizer**: Re-engineered Title and Description fields inside the posting wizard:
  - Both fields now change their label (e.g. *Food Item Name*, *Food Description*) and their helper placeholders dynamically depending on which category is chosen, making the seller signup experience intuitive and contextual.
- **Low-Price Threshold**: Allowed peers to share cheap meals on campus by adjusting the frontend/backend minimum price threshold to **₹10** exclusively for the *Food Friendship* category, down from the standard ₹50 minimum.
- **SQL Migration Utilities**: Created a clean PostgreSQL migration script [migrate_food_friendship.sql](file:///c:/Users/HP/OneDrive/Desktop/copy_try/server/supabase/migrate_food_friendship.sql) to add the `'Food Friendship'` enum value to `service_category` and drop/re-add the table's price constraint `CHECK (price >= 10)`.

---

### May 19, 2026 — Photography Category Integration & Rich Media Portfolios
**Objective**: Retire the legacy *Research & Data* category and successfully deploy **Photography**, featuring interactive camera type cards, a custom Camera Model field with smart DB description packing/unpacking, and multi-file image/video past work uploads with looping micro-previews.

**Features Implemented:**
- **"Photography" Category Transition**: Replaced the "Research & Data" category system-wide (Navbar, Browse, Landing page featured portrait photography service, Interest wizard inside Signup, and backend whitelists).
- **Guided Camera Type Selector**: Selecting *Photography* displays 5 camera type selector tiles:
  - 📸 DSLR Cameras
  - 📷 Mirrorless Cameras
  - 🎦 Action Cameras
  - 📸 Point & Shoot
  - 🎞️ Instant Cameras
- **Camera Model Custom Field**: Added a dedicated `Camera Model` input field for Photography. The model is saved by appending it to the `description` text payload using bold emoji markup, and dynamically parsed back on edit state load. This allows custom inputs without database schema column additions.
- **Rich Past Work Gallery (Images & Videos)**: Re-engineered the design portfolio uploader into a generic past work gallery for both Art and Photography. Photography accepts videos as well as images up to **15MB** (`accept="image/*,video/*"`).
- **Micro-preview Loop Player**: Configured both `PostService.jsx` previews and `ServiceDetail.jsx` past work gallery cards to automatically detect video extensions (`.mp4`, `.mov`, etc.) and render a premium, looping, muted `<video>` player element.
- **Supabase Enum Migration**: Created [migrate_photography.sql](file:///c:/Users/HP/OneDrive/Desktop/copy_try/server/supabase/migrate_photography.sql) containing the DDL command to alter the `service_category` type with `'Photography'`.

---

*Last updated: May 19, 2026 | GitHub: cosenhub07/cosen | Status: 🟢 Live in Production*
