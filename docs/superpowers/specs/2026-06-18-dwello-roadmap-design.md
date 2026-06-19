# Dwello Product Roadmap
**Version:** 1.0
**Date:** June 18, 2026
**Status:** Approved

## Executive Summary

Transform Dwello from a single-user prototype into a production-ready SaaS property management platform through four focused development phases. Timeline: 16 weeks (4 phases × 2-4 week sprints). Primary goal: deep learning of full-stack SaaS technologies, culminating in a revenue-generating product.

## Goals

**Primary Objectives:**
- Master authentication, payments, real-time features, and production deployment
- Build production-ready SaaS infrastructure with comprehensive testing
- Create a revenue-generating property management platform
- Establish patterns for quality software development (testing, CI/CD, monitoring)

**Learning Outcomes:**
- Supabase Auth + RLS policies for multi-tenant applications
- Stripe integration (subscriptions, webhooks, financial tracking)
- Real-time communication (WebSockets, live updates, notifications)
- Production hardening (security, performance, monitoring, deployment)

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
**Total Duration:** 16 weeks
**Cadence:** 2-week sprints (8 sprints total)
**Phases:** 4 major phases

### Phase Progression
1. **Phase 1 (Weeks 1-4):** Auth + Testing Foundation
2. **Phase 2 (Weeks 5-8):** Payments + Financial Tracking
3. **Phase 3 (Weeks 9-12):** Real-time Features + Tenant Portal
4. **Phase 4 (Weeks 13-16):** Production Hardening + Launch Prep

### State Transitions
- **Current → Phase 1:** Single-user prototype → Multi-user authenticated app
- **Phase 1 → Phase 2:** Auth foundation → Revenue-capable platform
- **Phase 2 → Phase 3:** Payment processing → Feature-complete platform
- **Phase 3 → Phase 4:** Complete features → Production SaaS

---

## Phase 1: Auth + Testing Foundation
**Duration:** Weeks 1-4 (2 sprints)
**Goal:** Enable multiple landlords to use the app independently with comprehensive test coverage

### Sprint 1 (Weeks 1-2): Authentication Core

**Features:**
- Supabase project setup and configuration
- User registration flow (email/password)
- User login flow (email/password + Google OAuth)
- Session management and JWT handling
- Protected route middleware
- User profile page (view/edit name, email, avatar)
- Password reset flow

**Database Changes:**
- Migrate from SQLite to Supabase Postgres
- Add `user_id` column to `properties` table
- Create Row Level Security (RLS) policies:
  - Users can only SELECT/INSERT/UPDATE/DELETE their own properties
  - Users can only view their own profile
- Create `profiles` table (extends Supabase auth.users)

**Technical Implementation:**
- Use Supabase Auth SDK (@supabase/supabase-js)
- Store session in localStorage with automatic refresh
- Implement auth state management in frontend
- Add auth middleware to Express API routes
- RLS policies enforce data isolation at database level

**Success Criteria:**
- ✅ Users can register with email/password
- ✅ Users can log in with Google OAuth
- ✅ Users can reset forgotten passwords
- ✅ Protected routes redirect to login when unauthenticated
- ✅ Multiple users can create accounts and see only their own properties
- ✅ RLS policies prevent data leakage between users

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

### Phase 1 Deliverables
- Multi-user authentication system with OAuth
- Comprehensive test suite with CI/CD
- Migrated to Supabase Postgres with RLS
- Protected routes and data isolation
- Test coverage reports in CI

### Phase 1 Technical Stack
- **Auth:** Supabase Auth (email/password, Google OAuth)
- **Database:** Supabase Postgres with Row Level Security
- **Testing:** Vitest (unit/integration), Playwright (E2E)
- **CI/CD:** GitHub Actions
- **Frontend Auth:** @supabase/supabase-js client library

---

## Phase 2: Payments + Financial Tracking
**Duration:** Weeks 5-8 (2 sprints)
**Goal:** Enable revenue generation through subscriptions and comprehensive financial tracking

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
- Chart.js or Recharts for financial graphs
- Scheduled job (cron) for payment reminders:
  - Check for rent due within 3 days
  - Send email via Resend to tenants
- CSV generation with proper escaping
- Currency formatting (always store as cents/smallest unit)

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
- **Charts:** Chart.js or Recharts
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

### Sprint 7 (Weeks 13-14): Multi-tenancy & Analytics

**Features:**
- Analytics dashboard (properties, revenue, tenants, requests)
- Key metrics: occupancy rate, average rent, maintenance costs
- Performance monitoring setup
- Error tracking and alerting
- Database query optimization
- Rate limiting on public endpoints
- Advanced RLS policy audit

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
- Rate limiting with express-rate-limit:
  - Auth endpoints: 5 requests/minute
  - Payment endpoints: 10 requests/minute
  - API endpoints: 100 requests/minute
- RLS policy review and penetration testing
- Query performance analysis (EXPLAIN ANALYZE)

**Success Criteria:**
- ✅ Analytics dashboard shows real-time metrics
- ✅ All critical queries execute in <200ms
- ✅ Sentry captures and reports errors automatically
- ✅ Rate limiting blocks abusive requests
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
- Rate limiting on all public endpoints
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
- ✅ App handles 100 concurrent users without degradation
- ✅ All OWASP Top 10 vulnerabilities addressed
- ✅ Zero-downtime deployments working reliably
- ✅ Database backups tested and restorable
- ✅ Monitoring catches issues before users report them
- ✅ First paying customer can successfully sign up and use all features
- ✅ API documentation complete and accurate
- ✅ Marketing landing page converts visitors to signups

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
- Email/password and OAuth login both functional

### Phase 2 Success
- First paying subscriber (Pro or Enterprise plan)
- Stripe webhooks update subscription status correctly
- Financial reports show accurate calculations
- Payment reminders sent automatically

### Phase 3 Success
- Messages deliver in real-time (<500ms)
- Tenants submit maintenance requests with photos
- Push notifications work on desktop and mobile
- Tenant portal fully functional on mobile devices

### Phase 4 Success
- App stable with 100+ concurrent users
- Zero critical security vulnerabilities
- <2s average page load time
- 99.9% uptime in production
- First 10 paying customers using the platform

## Risk Mitigation

### Technical Risks
- **Supabase RLS complexity:** Start simple, add complexity incrementally, test extensively
- **Real-time scaling:** Use Supabase Realtime limits wisely, implement fallback polling
- **Stripe webhook failures:** Implement retry logic, manual sync tool, webhook monitoring

### Timeline Risks
- **Sprint overruns:** Each sprint has MVP scope + nice-to-have features (cut nice-to-haves if needed)
- **Learning curve:** Allocate 20% time buffer per sprint for learning new technologies
- **Scope creep:** Stick to roadmap, defer new ideas to Phase 5 (post-launch iterations)

### Business Risks
- **No users:** Launch with free tier, gather feedback, iterate quickly
- **Competition:** Focus on quality and user experience, not feature parity
- **Pricing wrong:** Start conservative ($15/mo), adjust based on customer feedback

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

This roadmap transforms Dwello from a prototype into a production SaaS platform in 16 focused weeks. Each phase builds essential skills while delivering tangible value. By Phase 4, you'll have:

- Deep expertise in auth, payments, real-time features, and production infrastructure
- A revenue-generating SaaS product ready for customers
- A portfolio project demonstrating full-stack mastery
- Foundation for future iterations and business growth

The sprint-focused cadence ensures momentum while allowing time for learning. Testing and quality are built in from Phase 1, establishing patterns that scale. By the end, Dwello will be a showcase of modern SaaS development practices.
