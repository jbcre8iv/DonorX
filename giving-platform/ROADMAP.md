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
- [ ] Supabase Auth integration
- [ ] Registration flow (org + user creation)
- [ ] Login flow
- [ ] Password reset flow
- [ ] Protected route middleware
- [ ] Auth context/provider
- [ ] User session management

## PHASE 3: NONPROFIT DIRECTORY
- [ ] Public directory page
- [ ] Category filter pills
- [ ] Search functionality
- [ ] Nonprofit cards with key info
- [ ] Nonprofit detail modal/page
- [ ] "Featured" nonprofits section
- [ ] Load from Supabase

## PHASE 4: DONATION FLOW (Core Feature)
- [ ] Donation page layout
- [ ] Amount input with preset options
- [ ] Allocation builder UI (visual, intuitive)
- [ ] Split by specific nonprofits
- [ ] Split by category (equal distribution)
- [ ] Real-time allocation percentage display
- [ ] Stripe Checkout integration
- [ ] Payment processing
- [ ] Success/confirmation page
- [ ] Tax receipt generation (PDF)
- [ ] Receipt email delivery

## PHASE 5: DONOR DASHBOARD
- [ ] Dashboard layout with sidebar
- [ ] Overview page (stats, recent activity)
- [ ] Donation history with filters
- [ ] Individual donation detail view
- [ ] Tax receipts page (download PDFs)
- [ ] Saved allocation templates
- [ ] Create/edit/delete templates
- [ ] One-click donate from template
- [ ] Account settings
- [ ] Team/org member management

## PHASE 6: ADMIN PORTAL
- [ ] Admin layout with sidebar
- [ ] Admin dashboard (platform stats)
- [ ] Nonprofit management (CRUD)
- [ ] Nonprofit approval workflow
- [ ] View all donations
- [ ] Donation disbursement tracking
- [ ] Category management
- [ ] Basic reporting/exports

## PHASE 7: POLISH & PWA
- [ ] Progressive Web App setup
- [ ] Add to homescreen support
- [ ] Offline fallback page
- [ ] Loading states and skeletons
- [ ] Error boundaries
- [ ] Toast notifications
- [ ] Animations and transitions
- [ ] Performance optimization
- [ ] SEO meta tags
- [ ] Open Graph images

## PHASE 8: ADVANCED FEATURES
- [ ] Recurring donations (monthly/quarterly/annual)
- [ ] Impact feed (updates from nonprofits)
- [ ] Quarterly impact report generator
- [ ] Email notifications system
- [ ] Donor public profile (optional)
- [ ] Nonprofit dashboard (submit impact reports)

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
