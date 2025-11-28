"use client";

import { ToastProvider } from "@/components/ui/toast";
import { CartFavoritesProvider } from "@/contexts/cart-favorites-context";
import { CartFavoritesSidebar } from "@/components/cart-favorites/sidebar";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <CartFavoritesProvider>
        {children}
        <CartFavoritesSidebar />
      </CartFavoritesProvider>
    </ToastProvider>
  );
}
