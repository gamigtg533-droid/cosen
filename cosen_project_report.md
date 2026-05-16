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

### Phase 8 — Negotiable Services & Advanced UX ✅
- **Dynamic Pricing Negotiation** — Sellers can post services as "Negotiable" (e.g. Study Helper)
- **Pending Negotiation Workflow** — Orders start in `pending_negotiation` status; sellers set the final locked price in the chat UI
- **Razorpay Pending Payment** — Buyers review locked price and pay securely to initialize the order to `inProgress`
- **Sub-Categorization** — Added specialized sub-categories (Assignment, Tutorial, Manual, Custom) to service creation
- **In-App Notifications** — Bell icon drop-down with unread status counting and navigation redirection

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
| Missing order data crashing frontend | Server routes returned flat IDs instead of joining user/service tables | Added `select('*, buyer:users!buyer_id(...), ...')` SQL joins in backend routes |
| Mobile notifications instantly closing | `document.addEventListener('mousedown')` triggered closing on mobile sheet click | Added DOM ID whitelisting for `mobile-bell-sheet` inside detector |
| Mobile notifications not navigating | React Router `<Link>` cancelled inside closing timeout | Switched mobile bell wrapper to `<button>` + explicit programmatic `navigate()` hook |
| Order chat "online" tick always green | Hardcoded to local socket status `connected` | Synced socket events (`online_users_list`, `user_online`) to track other party's presence |

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

*Last updated: May 14, 2026 | GitHub: cosenhub07/cosen | Status: 🟢 Live in Production*

