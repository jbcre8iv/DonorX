# DonorX - Enterprise Giving Platform

DonorX is an enterprise donation platform for corporations and family offices. Make one donation, support multiple nonprofits, receive one tax receipt.

## Features

- **One Donation, Multiple Recipients** - Split your donation across multiple nonprofits based on your preferences
- **Single Tax Receipt** - Consolidated tax documentation for all your giving
- **Quarterly Impact Reports** - Track the impact of your donations across all supported organizations
- **Enterprise-Grade** - Built for corporations and family offices with team management and role-based access

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Payments**: Stripe
- **UI Components**: Custom design system with shadcn/ui patterns

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- Stripe account

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd giving-platform
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```

4. Fill in your environment variables in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key
- `STRIPE_SECRET_KEY` - Your Stripe secret key
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Your Stripe publishable key
- `STRIPE_WEBHOOK_SECRET` - Your Stripe webhook signing secret

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
giving-platform/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Authentication pages
│   ├── admin/             # Admin portal
│   ├── dashboard/         # Donor dashboard
│   ├── directory/         # Nonprofit directory
│   ├── donate/            # Donation flow
│   └── api/               # API routes
├── components/            # React components
│   ├── ui/               # Base UI components
│   ├── layout/           # Layout components
│   ├── directory/        # Directory-specific components
│   └── donation/         # Donation-specific components
├── lib/                   # Utility functions and configs
│   ├── supabase/         # Supabase clients
│   └── stripe/           # Stripe client
├── types/                # TypeScript type definitions
└── hooks/                # Custom React hooks
```

## Configuration

The app is configured through `lib/config.ts` for easy rebranding:

```typescript
export const config = {
  appName: "DonorX",
  tagline: "One Donation. Unlimited Impact.",
  // ... other configuration
}
```

## Development Phases

See [ROADMAP.md](./ROADMAP.md) for the full development roadmap.

## License

Private - All rights reserved
