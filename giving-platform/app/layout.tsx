import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { config } from "@/lib/config";
import { HeaderWrapper } from "@/components/layout/header-wrapper";
import { Footer } from "@/components/layout/footer";
import { GivingConcierge } from "@/components/ai/giving-concierge";
import { Providers } from "./providers";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: config.colors.primary,
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: config.appName,
    template: `%s | ${config.appName}`,
  },
  description: config.description,
  keywords: [
    "donation platform",
    "corporate giving",
    "family office",
    "nonprofit",
    "philanthropy",
    "charitable giving",
  ],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: config.appName,
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: config.appName,
    title: config.appName,
    description: config.description,
  },
  twitter: {
    card: "summary_large_image",
    title: config.appName,
    description: config.description,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>
        <Providers>
          <div className="flex min-h-screen flex-col">
            <HeaderWrapper />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
          <GivingConcierge />
        </Providers>
      </body>
    </html>
  );
}
