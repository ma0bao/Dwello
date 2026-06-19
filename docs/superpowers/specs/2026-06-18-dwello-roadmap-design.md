# Dwello Product Roadmap
**Version:** 1.0
**Date:** June 18, 2026
**Status:** Approved

## Executive Summary

Transform Dwello from a single-user prototype into a production-ready SaaS property management platform through four focused development phases. Timeline: 16 weeks target (4 phases × 2-4 week sprints). **Primary goal: deep learning of full-stack SaaS technologies** (auth, payments, real-time, deployment). Building a feature-complete platform is the vehicle for learning; eventual revenue generation is a secondary aspiration, not a committed outcome.

## Goals

**Primary Objectives:**
- **Master full-stack SaaS fundamentals:** authentication, payments, real-time features, and production deployment
- **Build production-grade infrastructure:** comprehensive testing, CI/CD, monitoring, security best practices
- **Establish quality development habits:** testing first, security by default, iterative refinement
- *(Secondary aspiration)* Demonstrate a feature-complete platform suitable for real users if pursued

**Learning Outcomes:**
- Supabase Auth + RLS policies for multi-tenant applications (or build sessions/JWTs from scratch for deeper learning)
- Stripe integration for subscriptions and webhooks *(goal: understand payment processing, not monetize)*
- Real-time communication fundamentals (WebSockets, live updates, notifications)
- Production hardening (security, performance, monitoring, deployment)

## Learning Depth: Build vs. Managed

For each major capability, there's a tradeoff between using a managed service (ships fast, teaches integration patterns) and building a minimal version from scratch (slower, teaches the underlying primitives). The recommendation: **pick 1-2 areas to build the hard way** and use managed services elsewhere. This balances deep learning with forward progress.

### Authentication
- **Managed (Supabase Auth):** Plug-and-play with OAuth providers, session management, password reset flows. Learn: integration, RLS policies, session lifecycle.
- **Build (Sessions/JWTs/OAuth from scratch):** Implement bcrypt password hashing, session tokens or JWTs, OAuth 2.0 redirect flow manually. Learn: crypto primitives, token security, auth protocols.
- **DECISION:** ____________________

### Payments
- **Managed (Stripe):** Hosted checkout, webhook events, subscription management. Learn: webhook handling, idempotency, subscription state machines.
- **Build (Payment Intents API from scratch):** Implement card tokenization, payment flow, refunds, manual subscription tracking. Learn: PCI compliance concerns, payment state machines, financial reconciliation.
- **DECISION:** ____________________

### Real-time Communication
- **Managed (Supabase Realtime):** Subscribe to database changes, automatic WebSocket connections. Learn: real-time data patterns, optimistic updates, conflict resolution.
- **Build (Raw WebSocket server):** Implement WebSocket server (ws or socket.io), connection management, message routing, presence tracking. Learn: WebSocket protocol, connection lifecycle, scaling considerations.
- **DECISION:** ____________________

### File Storage
- **Managed (Supabase Storage):** S3-compatible API, access control via RLS, CDN distribution. Learn: signed URLs, access patterns, RLS policies for files.
- **Build (S3 SDK + custom middleware):** Integrate AWS S3 directly, implement presigned URLs, build custom access control. Learn: cloud storage APIs, security patterns, direct cloud integration.
- **DECISION:** ____________________

**Recommended deep-dive picks:** Authentication and Real-time. These teach the most transferable primitives (sessions, tokens, OAuth flows for auth; WebSocket protocol, connection management for real-time) that apply across any stack. Payments and storage are commodity services where the managed abstractions are the real-world standard.

## Current State Assessment

**What Exists:**
- Property CRUD operations (add, edit, delete properties)
- Tenant tracking (names, emails, lease dates)
- Email system via Resend API
- Property valuation estimates
- SQLite database with single-user model
- Basic landlord and tenant views
- Dashboard with portfolio statistics

**Technology Stack:**
- Frontend: Vanilla JavaScript, Tailwind CSS
- Backend: Express.js (Node 20+)
- Database: SQLite (better-sqlite3)
- Email: Resend API
- Hosting: Vercel-ready

**Known Gaps:**
- No authentication (single-user only)
- No test coverage
- No payment processing
- No real-time features
- No multi-user support
- No production monitoring
- Manual deployment process

## Roadmap Overview

### Timeline
**Total Duration:** 16 weeks *(target, not commitment)*
**Cadence:** 2-week sprints (8 sprints total)
**Phases:** 4 major phases (Phases 1-2 core, Phases 3-4 optional stretch goals)

**Learning Pace Note:** Learning while building roughly doubles time estimates compared to implementation alone. These timelines assume exploration, mistakes, refactoring, and deep understanding — not just feature completion. **Finishing two phases deeply beats rushing through four.** Phases 3-4 are stretch goals; delivering Phases 1-2 with mastery is a successful outcome.

### Phase Progression
1. **Phase 1 (Weeks 1-4):** Auth + Testing Foundation *(core)*
2. **Phase 2 (Weeks 5-8):** Payments + Financial Tracking *(core)*
3. **Phase 3 (Weeks 9-12):** Real-time Features + Tenant Portal *(optional stretch goal)*
4. **Phase 4 (Weeks 13-16):** Production Hardening + Launch Prep *(optional stretch goal)*

### State Transitions
- **Current → Phase 1:** Single-user prototype → Multi-user authenticated app with comprehensive testing
- **Phase 1 → Phase 2:** Auth foundation → Payment integration and financial tracking
- **Phase 2 → Phase 3:** Payment processing learned → Real-time communication and tenant features *(stretch)*
- **Phase 3 → Phase 4:** Feature-complete → Production-hardened SaaS *(stretch)*

---

## Phase 1: Auth + Testing Foundation
**Duration:** Weeks 1-4 (2 sprints, split into 3 sub-milestones)
**Goal:** Enable multiple landlords to use the app independently with comprehensive test coverage

### Sprint 1a: Database Migration + RLS Foundation

**Why separate:** Migrating from SQLite to Postgres plus implementing Row Level Security policies is substantial work with a steep learning curve. RLS is security-critical and deserves focused attention before layering on OAuth complexity.

**Features:**
- Supabase project setup and configuration
- Migrate schema from SQLite to Supabase Postgres
- Migrate existing data (properties, demo data)
- Add `user_id` column to `properties` table
- Create `profiles` table (extends Supabase auth.users)
- Implement Row Level Security (RLS) policies:
  - Users can only SELECT/INSERT/UPDATE/DELETE their own properties
  - Users can only view their own profile
- Test RLS policies with multiple test users

**Technical Implementation:**
- Export SQLite data, transform to Postgres-compatible format
- Use Supabase SQL editor or migration files
- RLS policies use `auth.uid()` to filter by current user
- Test with multiple users to verify isolation

**Success Criteria:**
- ✅ All existing properties migrated to Postgres
- ✅ RLS policies prevent cross-user data access
- ✅ Test users cannot see each other's properties

### Sprint 1b: Email/Password Authentication

**Features:**
- User registration flow (email/password)
- User login flow (email/password only, OAuth deferred)
- Session management and JWT handling
- Protected route middleware (frontend + backend)
- User profile page (view/edit name, email, avatar)
- Password reset flow
- Rate limiting on auth endpoints (5 requests/minute)

**Technical Implementation:**
- Supabase Auth SDK (@supabase/supabase-js)
- Store session in localStorage with automatic refresh
- Frontend auth state management
- Express middleware to verify Supabase JWT
- Rate limiting with express-rate-limit (security best practice from the start)

**Success Criteria:**
- ✅ Users can register with email/password
- ✅ Users can log in and sessions persist across page reloads
- ✅ Users can reset forgotten passwords
- ✅ Protected routes redirect to login when unauthenticated
- ✅ Multiple users can create accounts and see only their own properties
- ✅ Rate limiting blocks brute-force login attempts

**Note on OAuth:** Google OAuth is deferred to Sprint 2 or later. Email/password auth is sufficient to learn session management and test multi-user isolation. OAuth adds redirect flows and token exchange—valuable, but not critical for the foundation.

### Sprint 2 (Weeks 3-4): Testing Infrastructure

**Features:**
- Vitest configuration for unit and integration tests
- Playwright setup for end-to-end tests
- Test database utilities (seed, teardown, fixtures)
- GitHub Actions CI/CD pipeline
- Pre-commit hooks (lint, type-check, test)

**Test Coverage:**
- Auth flows (register, login, logout, password reset)
- Protected routes (redirect behavior, session validation)
- Property CRUD with multi-user scenarios
- RLS policy enforcement
- API endpoint tests (properties, user profile)
- E2E user journeys (signup → add property → logout → login)

**Technical Implementation:**
- Vitest for unit/integration tests
- Playwright for E2E browser tests
- Separate test database instance
- Factory functions for test data generation
- GitHub Actions workflow:
  - Run tests on every push
  - Block merge if tests fail
  - Code coverage reporting

**Success Criteria:**
- ✅ >80% test coverage on critical paths
- ✅ All tests pass in CI before merging
- ✅ E2E tests cover major user flows
- ✅ Tests run in <60 seconds locally
- ✅ Clear test failure messages for debugging

### Tenant Identity Model (Design Early)

**The Problem:** Currently, tenants are just email strings on property records. In Phase 3, tenants become authenticated users with roles. How do you connect a tracked tenant (email on a property) to a logged-in tenant account?

**Solution: Invite/Linking Flow**
1. **Phase 1 data model:** Properties have `tenant_email` (string, nullable). No tenant accounts yet.
2. **Phase 3 transition:** When a tenant registers/logs in:
   - Check if their email matches any `tenant_email` in properties
   - If match found, link that user account to those properties (add `tenant_id` column, populate from email match)
   - Update RLS policies to grant tenants read access to their assigned properties
3. **Invite flow (optional enhancement):**
   - Landlord invites tenant by email → sends invite link
   - Tenant clicks link → creates account with pre-filled email
   - Account auto-links to property on creation

**Why design this early:** The data model (email → user_id linking) affects the properties table schema and RLS policies built in Phase 1. Planning the transition now avoids painful refactoring later.

**Implementation note:** Keep it simple in Phase 1—just ensure the schema supports adding `tenant_id` later. The actual linking logic can be implemented in Phase 3.

### Phase 1 Deliverables
- Multi-user authentication system (email/password, OAuth deferred)
- Comprehensive test suite with CI/CD
- Migrated to Supabase Postgres with RLS
- Protected routes and data isolation
- Rate limiting on auth endpoints (security built in from the start)
- Test coverage reports in CI

### Phase 1 Technical Stack
- **Auth:** Supabase Auth (email/password; OAuth can be added later)
- **Database:** Supabase Postgres with Row Level Security
- **Testing:** Vitest (unit/integration), Playwright (E2E)
- **CI/CD:** GitHub Actions
- **Frontend Auth:** @supabase/supabase-js client library
- **Security:** express-rate-limit (practice "build it in" from day one, not for production risk)

**Note on Security Timing:** Rate limiting and other security measures are implemented early to establish good habits (security by default), not because there's production risk with no real users. This teaches you to build secure systems from the start, which is far easier than retrofitting security later.

---

## Phase 2: Payments + Financial Tracking
**Duration:** Weeks 5-8 (2 sprints)
**Goal:** Master payment processing (Stripe integration, webhooks, subscription state) and implement financial tracking features

### Sprint 3 (Weeks 5-6): Stripe Integration

**Features:**
- Stripe account setup (test + production modes)
- Subscription plan creation in Stripe Dashboard
- Stripe Checkout integration for subscriptions
- Customer portal for plan management
- Webhook endpoint for payment events
- Subscription status tracking and enforcement

**Subscription Tiers:**
- **Free:** 3 properties, basic features, community support
- **Pro ($15/month):** 25 properties, financial reports, priority support
- **Enterprise ($50/month):** Unlimited properties, advanced analytics, API access

**Note:** These tiers exist to practice building tiered pricing, enforcing limits, and handling subscription state—not to generate actual revenue. Stripe test mode is sufficient; real billing is optional.

**Database Changes:**
- Create `subscriptions` table:
  - user_id, stripe_customer_id, stripe_subscription_id
  - plan (free/pro/enterprise), status (active/canceled/past_due)
  - current_period_end, cancel_at_period_end
- Add property count limits based on subscription tier

**Technical Implementation:**
- Stripe SDK for Node.js (stripe npm package)
- Stripe Checkout for hosted payment page
- Webhook signature verification for security
- Handle subscription lifecycle events:
  - checkout.session.completed (new subscription)
  - customer.subscription.updated (plan change)
  - customer.subscription.deleted (cancellation)
  - invoice.payment_failed (failed payment)
- Enforce property limits in API (reject create if over limit)

**Success Criteria:**
- ✅ Users can subscribe to Pro/Enterprise plans
- ✅ Users can upgrade/downgrade plans via customer portal
- ✅ Webhooks correctly update subscription status in database
- ✅ Property creation blocked when user exceeds plan limit
- ✅ Failed payments trigger email notification
- ✅ All Stripe flows covered by tests

### Sprint 4 (Weeks 7-8): Financial Features

**Features:**
- Rent payment tracking per property
- Manual rent payment entry (date, amount, method, notes)
- Expense logging (maintenance, repairs, utilities, taxes)
- Expense categories and tags
- Revenue vs. expense reports
- Profit/loss calculation per property
- Dashboard financial summary (total revenue, expenses, profit)
- Automated payment reminders via email
- Transaction history with search and filters
- CSV export for accounting software

**Database Changes:**
- Create `rent_payments` table:
  - property_id, tenant_email, amount, payment_date
  - payment_method (cash/check/bank_transfer/online)
  - status (pending/received/late), notes
- Create `expenses` table:
  - property_id, amount, expense_date, category
  - description, receipt_url, tax_deductible
- Create `transactions` view (unified rent + expenses ledger)

**Technical Implementation:**
- Financial calculations in backend (never client-side)
- Chart.js for financial graphs (vanilla JS compatible; Recharts is React-only)
- Scheduled job (cron) for payment reminders:
  - Check for rent due within 3 days
  - Send email via Resend to tenants
- CSV generation with proper escaping
- Currency formatting (always store as cents/smallest unit)

**Note on Vanilla JS:** Staying vanilla through Phase 2 (and even Phase 3's real-time work) is deliberate. Hitting the limits of vanilla JS—especially when managing real-time state updates—and *then* adopting a framework is a key learning experience. You'll understand why frameworks exist because you've felt the pain they solve.

**Success Criteria:**
- ✅ Landlords can log rent payments and expenses
- ✅ Financial reports show accurate profit/loss per property
- ✅ Dashboard displays portfolio-wide financials
- ✅ Payment reminders sent 3 days before due date
- ✅ CSV export works with common accounting tools
- ✅ All financial calculations tested with edge cases

### Phase 2 Deliverables
- Stripe subscription system with three tiers
- Complete financial tracking (rent + expenses)
- Revenue/expense reporting dashboard
- Automated payment reminders
- CSV export functionality

### Phase 2 Technical Stack
- **Payments:** Stripe API, Stripe Checkout, Stripe Webhooks
- **Scheduled Jobs:** Node-cron or Vercel Cron
- **Charts:** Chart.js (vanilla JS compatible)
- **CSV:** papaparse or custom CSV generator

---

## Phase 3: Real-time Features + Tenant Portal
**Duration:** Weeks 9-12 (2 sprints)
**Goal:** Enable live communication and complete tenant-facing features

### Sprint 5 (Weeks 9-10): Real-time Communication

**Features:**
- Live messaging between landlords and tenants
- Message persistence in database
- Typing indicators (show "User is typing...")
- Read receipts (message read status)
- Real-time notification system
- Browser push notifications (with permission)
- Email notification fallback
- Notification preferences (email, push, both, none)

**Database Changes:**
- Create `messages` table:
  - sender_id, recipient_id, property_id (optional context)
  - content, created_at, read_at
  - thread_id (group related messages)
- Create `notifications` table:
  - user_id, type (message/maintenance/payment/lease)
  - title, body, action_url, read, created_at

**Technical Implementation:**
- Use Supabase Realtime for WebSocket connections
- Subscribe to message inserts filtered by user_id
- Browser Notification API for push notifications
- Service Worker for background notifications
- Notification queue processed in batches
- Mark messages as read on view
- Message pagination (load older messages on scroll)

**Success Criteria:**
- ✅ Messages appear instantly (<500ms latency)
- ✅ Typing indicators work reliably
- ✅ Push notifications appear even when tab inactive
- ✅ Unread message count badge updates in real-time
- ✅ Message history loads quickly (paginated)
- ✅ All real-time features degrade gracefully if WebSocket fails

### Sprint 6 (Weeks 11-12): Tenant Portal

**Features:**
- Tenant registration and login (separate from landlords)
- Tenant dashboard (view assigned property, lease info)
- Maintenance request submission
- Photo upload for maintenance requests (before/after)
- Maintenance request status tracking (Open → In Progress → Resolved)
- Document library (view lease, receipts, notices)
- Payment history view for tenants
- Notifications for request updates
- Mobile-responsive design for tenant portal

**Database Changes:**
- Add `role` column to profiles (landlord/tenant)
- Create `maintenance_requests` table:
  - property_id, tenant_id, title, description
  - status (open/in_progress/resolved), priority (low/medium/high)
  - created_at, resolved_at, photos (array of URLs)
- Create `documents` table:
  - property_id, uploader_id, type (lease/receipt/notice)
  - file_url, file_name, file_size, uploaded_at
  - shared_with (array of user IDs who can access)

**Technical Implementation:**
- Supabase Storage for file uploads (photos, documents)
- Storage buckets with RLS policies (tenants can upload to their requests)
- Image optimization (compress before upload, generate thumbnails)
- Document access control via RLS (only property owner + assigned tenant)
- Mobile-first CSS (responsive design from the start)
- Progressive Web App (PWA) manifest for mobile home screen

**Success Criteria:**
- ✅ Tenants can submit maintenance requests with photos
- ✅ Landlords receive instant notification of new requests
- ✅ Tenants can track request status in real-time
- ✅ Document uploads stored securely with access control
- ✅ Mobile experience is smooth (tested on iOS + Android)
- ✅ File upload works with images up to 10MB

### Phase 3 Deliverables
- Live messaging system with notifications
- Complete tenant portal with maintenance tracking
- Document storage and sharing
- Mobile-responsive design
- Real-time updates across all features

### Phase 3 Technical Stack
- **Real-time:** Supabase Realtime (WebSocket subscriptions)
- **Storage:** Supabase Storage (files, images)
- **Notifications:** Browser Notification API + email fallback
- **Image Processing:** Sharp or browser-side canvas compression
- **PWA:** Workbox or manual service worker

---

## Phase 4: Production Hardening + Launch Prep
**Duration:** Weeks 13-16 (2 sprints)
**Goal:** Production-ready infrastructure with monitoring, security, and performance optimization

### Sprint 7 (Weeks 13-14): Analytics, Performance & Monitoring

**Note:** Multi-tenancy is already handled by Row Level Security policies from Phase 1. This sprint focuses on analytics, performance optimization, and production monitoring.

**Features:**
- Analytics dashboard (properties, revenue, tenants, requests)
- Key metrics: occupancy rate, average rent, maintenance costs
- Performance monitoring setup
- Error tracking and alerting
- Database query optimization
- Advanced RLS policy audit and penetration testing

**Analytics Metrics:**
- Portfolio overview: total properties, total revenue, total expenses
- Property performance: occupancy, revenue per property, ROI
- Tenant metrics: average lease length, payment timeliness
- Maintenance metrics: average resolution time, cost per request
- Financial trends: monthly revenue/expense charts

**Technical Implementation:**
- Sentry for error tracking and performance monitoring
- Database indexes on frequently queried columns:
  - properties(user_id, created_at)
  - rent_payments(property_id, payment_date)
  - expenses(property_id, expense_date)
  - messages(recipient_id, read_at)
- RLS policy review and penetration testing
- Query performance analysis (EXPLAIN ANALYZE)
- Load testing preparation (tools setup, baseline metrics)

**Success Criteria:**
- ✅ Analytics dashboard shows real-time metrics
- ✅ All critical queries execute in <200ms
- ✅ Sentry captures and reports errors automatically
- ✅ RLS policies verified secure (no cross-user data leaks)
- ✅ Database indexes improve query performance by >50%

### Sprint 8 (Weeks 15-16): Production Launch

**Features:**
- Automated deployment pipeline
- Database backup and disaster recovery
- Security audit and fixes
- Performance testing (load testing)
- API documentation
- User onboarding flow
- Marketing landing page
- Customer support system

**Production Checklist:**
- Environment secrets in Vercel/Supabase dashboards (never in code)
- HTTPS enforced everywhere (HSTS headers)
- CORS properly configured (whitelist domains)
- SQL injection prevention verified (parameterized queries)
- XSS protection (Content Security Policy headers)
- CSRF protection on forms
- Rate limiting verified working (already implemented in Phase 1)
- Database daily backups to S3 or Supabase backup service
- Error monitoring with Sentry alerts
- Uptime monitoring (UptimeRobot or Vercel Analytics)
- Performance targets: <2s page load, <200ms API responses
- Accessibility audit (WCAG 2.1 AA compliance)

**Technical Implementation:**
- Vercel deployment with automatic preview environments
- GitHub branch protection (require PR reviews, passing CI)
- Rollback strategy (Vercel instant rollback)
- Supabase production tier (automatic backups, point-in-time recovery)
- Load testing with Artillery or k6 (simulate 100+ concurrent users)
- API docs with OpenAPI/Swagger
- Onboarding flow: welcome email, product tour, sample data
- Marketing site with benefits, pricing, testimonials

**Success Criteria:**
- ✅ App handles 100 concurrent users without degradation (load tested)
- ✅ All OWASP Top 10 vulnerabilities addressed
- ✅ Zero-downtime deployments working reliably
- ✅ Database backups tested and restorable
- ✅ Monitoring catches and alerts on errors automatically
- ✅ Test users can complete full signup → usage → subscription flows
- ✅ API documentation complete and accurate
- ✅ *(Optional)* Landing page ready if pursuing real users

### Phase 4 Deliverables
- Production-grade monitoring and error tracking
- Optimized database performance
- Complete security audit
- Automated deployment pipeline
- Marketing landing page
- Ready for public launch

### Phase 4 Technical Stack
- **Monitoring:** Sentry (errors), Vercel Analytics (performance)
- **Deployment:** Vercel (hosting), GitHub Actions (CI/CD)
- **Backups:** Supabase automated backups
- **Load Testing:** Artillery or k6
- **API Docs:** OpenAPI/Swagger UI

---

## Success Metrics

### Phase 1 Success
- 3+ test users can independently manage properties
- Test coverage >80% on critical paths
- All tests pass in CI/CD pipeline
- Email/password auth working (OAuth deferred to later)
- RLS policies prevent cross-user data leaks

### Phase 2 Success
- Test users can subscribe to Pro/Enterprise plans (Stripe test mode)
- Stripe webhooks update subscription status correctly
- Financial reports show accurate calculations
- Payment reminders sent automatically

### Phase 3 Success *(stretch goal)*
- Messages deliver in real-time (<500ms)
- Tenants submit maintenance requests with photos
- Push notifications work on desktop and mobile
- Tenant portal fully functional on mobile devices

### Phase 4 Success *(stretch goal)*
- App stable with 100+ concurrent users (load tested)
- Zero critical security vulnerabilities
- <2s average page load time
- Monitoring and alerting fully operational
- *(Optional)* Platform ready for real users if pursued

## Risk Mitigation

### Technical Risks
- **Supabase RLS complexity:** Start simple, add complexity incrementally, test extensively
- **Real-time scaling:** Use Supabase Realtime limits wisely, implement fallback polling
- **Stripe webhook failures:** Implement retry logic, manual sync tool, webhook monitoring

### Timeline Risks
- **Sprint overruns:** Each sprint has MVP scope + nice-to-have features (cut nice-to-haves if needed)
- **Learning curve:** Allocate 20% time buffer per sprint for learning new technologies
- **Scope creep:** Stick to roadmap, defer new ideas to Phase 5 (post-launch iterations)

### Learning Risks
- **Burnout from overcommitment:** Remember Phases 3-4 are stretch goals; two phases done deeply is success
- **Tutorial hell:** Balance learning from docs/courses with hands-on building; make mistakes and debug them
- **Perfectionism:** Ship working code over perfect code; refactor later with knowledge gained

## Post-Launch (Phase 5+)

**Not in scope for initial 16 weeks, but logical next steps:**
- Mobile apps (React Native or Flutter)
- Advanced analytics and reporting
- Automated rent collection (Stripe direct charges)
- E-signature for lease agreements
- Accounting software integrations (QuickBooks, Xero)
- Multi-property portfolio management tools
- Tenant screening and background checks
- Insurance integrations
- Property listing syndication
- API for third-party integrations

## Conclusion

This roadmap transforms Dwello from a prototype into a learning platform for mastering full-stack SaaS development. **The primary goal is learning**, not shipping a business. Each phase teaches essential technologies through hands-on building. Even completing just Phases 1-2 deeply will give you:

- **Deep expertise** in authentication (sessions, JWTs, RLS policies) and payment processing (Stripe webhooks, subscription state)
- **Production habits** built in from the start: testing, security by default, CI/CD, monitoring
- **A portfolio-grade project** demonstrating full-stack mastery with real complexity
- **Foundation for any SaaS idea** you pursue in the future (these patterns transfer)

Remember: **finishing two phases deeply beats rushing through four**. Phases 3-4 are stretch goals. The sprint-focused cadence ensures momentum while allowing time for mistakes, debugging, and deep understanding. By the end, you'll understand why frameworks exist, how payments really work, and what "production-ready" actually means—knowledge that transfers to any stack or project.
