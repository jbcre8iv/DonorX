# DonorX Platform Roadmap

Enterprise donation platform for corporations and family offices.

## Overview

DonorX allows corporate donors to make a single donation that gets split across multiple nonprofits based on their preferences.

**Key Value Props:**
- One donation → multiple nonprofits
- Single tax receipt
- Quarterly impact reports
- Enterprise-grade with team/org accounts

---

## PHASE 1: FOUNDATION
- [x] Project scaffold with folder structure
- [x] Design system and UI components
- [x] Brand config file (easy rebranding)
- [x] Supabase client setup
- [x] Stripe client setup
- [x] Database schema (run separately in Supabase)
- [x] Root layout with header/footer
- [x] Homepage with hero section
- [x] Basic responsive navigation

## PHASE 2: AUTHENTICATION
- [x] Supabase Auth integration
- [x] Registration flow (org + user creation)
- [x] Login flow
- [x] Password reset flow
- [x] Protected route middleware
- [x] Auth context/provider
- [x] User session management

## PHASE 3: NONPROFIT DIRECTORY
- [x] Public directory page
- [x] Category filter pills
- [x] Search functionality
- [x] Nonprofit cards with key info
- [x] Nonprofit detail modal/page
- [x] "Featured" nonprofits section
- [x] Load from Supabase
- [x] Pagination

## PHASE 4: DONATION FLOW (Core Feature)
- [x] Donation page layout
- [x] Amount input with preset options
- [x] Allocation builder UI (visual, intuitive)
- [x] Split by specific nonprofits
- [x] Split by category (equal distribution)
- [x] Real-time allocation percentage display
- [x] Stripe Checkout integration
- [x] Payment processing
- [x] Success/confirmation page
- [ ] Tax receipt generation (PDF)
- [ ] Receipt email delivery

## PHASE 5: DONOR DASHBOARD
- [x] Dashboard layout with sidebar
- [x] Overview page (stats, recent activity)
- [x] Donation history with filters
- [x] Individual donation detail view
- [x] Tax receipts page (download PDFs)
- [x] Saved allocation templates
- [ ] Create/edit/delete templates
- [x] One-click donate from template
- [x] Account settings
- [ ] Team/org member management

## PHASE 6: ADMIN PORTAL
- [x] Admin layout with sidebar
- [x] Admin dashboard (platform stats)
- [x] Nonprofit management (CRUD)
- [x] Nonprofit approval workflow
- [x] View all donations
- [ ] Donation disbursement tracking
- [x] Category management
- [ ] Basic reporting/exports

## PHASE 7: POLISH & PWA
- [x] Progressive Web App setup
- [x] Add to homescreen support
- [x] Offline fallback page
- [x] Loading states and skeletons
- [x] Error boundaries
- [x] Toast notifications
- [ ] Animations and transitions
- [ ] Performance optimization
- [x] SEO meta tags
- [x] Open Graph images

## PHASE 8: ADVANCED FEATURES
- [x] Recurring donations (monthly/quarterly/annual)
- [x] Impact feed (updates from nonprofits)
- [x] Quarterly impact report generator
- [x] Email notifications system
- [x] Donor public profile (optional)
- [x] Nonprofit dashboard (submit impact reports)

## PHASE 9: AI FEATURES (Future)
- [ ] Claude SDK integration
- [ ] Giving Concierge chat widget
- [ ] Smart nonprofit recommendations
- [ ] AI-generated impact summaries
- [ ] Allocation advisor

## PHASE 10: MOBILE APP (Future)
- [ ] React Native + Expo setup
- [ ] Shared business logic from web
- [ ] Native navigation
- [ ] iOS app
- [ ] Android app

---

## Tech Stack

- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend:** Supabase (PostgreSQL, Auth, Storage)
- **Payments:** Stripe
- **Architecture:** PWA-ready, Mobile-first responsive design

## Target Users

Corporations and family offices with $50K-$5M+ annual giving budgets.
