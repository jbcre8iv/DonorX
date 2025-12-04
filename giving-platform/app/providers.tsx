"use client";

import { ToastProvider } from "@/components/ui/toast";
import { CartFavoritesProvider } from "@/contexts/cart-favorites-context";
import { CartFavoritesSidebar } from "@/components/cart-favorites/sidebar";
import { BetaWelcomeModal } from "@/components/layout/beta-welcome-modal";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <CartFavoritesProvider>
        {children}
        <CartFavoritesSidebar />
        <BetaWelcomeModal />
      </CartFavoritesProvider>
    </ToastProvider>
  );
}
