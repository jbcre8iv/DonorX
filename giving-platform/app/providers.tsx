"use client";

import { ToastProvider } from "@/components/ui/toast";
import { CartFavoritesProvider } from "@/contexts/cart-favorites-context";
import { CartFavoritesSidebar } from "@/components/cart-favorites/sidebar";
import { BetaWelcomeModal } from "@/components/layout/beta-welcome-modal";
import { FloatingHeartProvider } from "@/components/ui/floating-heart";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <CartFavoritesProvider>
        <FloatingHeartProvider>
          {children}
          <CartFavoritesSidebar />
          <BetaWelcomeModal />
        </FloatingHeartProvider>
      </CartFavoritesProvider>
    </ToastProvider>
  );
}
