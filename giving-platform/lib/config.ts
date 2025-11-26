export const config = {
  appName: "DonorX",
  tagline: "One Donation. Unlimited Impact.",
  description: "The enterprise giving platform for corporations and family offices.",

  colors: {
    primary: "#1d4ed8", // blue-700
    accent: "#059669", // emerald-600
  },

  links: {
    twitter: "https://twitter.com/donorx",
    linkedin: "https://linkedin.com/company/donorx",
  },

  contact: {
    email: "hello@donorx.org",
    support: "support@donorx.org",
  },

  legal: {
    entityName: "Donation Exchange, Inc.",
    ein: "",
  },

  features: {
    maxAllocationItems: 10,
    minDonationCents: 1000, // $10 minimum
    platformFeePercent: 0, // No platform fee
    adminFeeReservePercent: 10, // Up to 10% for admin expenses
  },
} as const;

export type Config = typeof config;
