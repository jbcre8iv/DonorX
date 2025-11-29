"use client";

import { useEffect } from "react";
import { X, HandHeart, Heart } from "lucide-react";
import { useCartFavorites } from "@/contexts/cart-favorites-context";
import { CartTab } from "./cart-tab";
import { FavoritesTab } from "./favorites-tab";

export function CartFavoritesSidebar() {
  const {
    isSidebarOpen,
    setSidebarOpen,
    activeTab,
    setActiveTab,
    cartItems,
    favorites,
  } = useCartFavorites();

  // Close sidebar on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isSidebarOpen) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isSidebarOpen, setSidebarOpen]);

  // Prevent body scroll when sidebar is open
  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isSidebarOpen]);

  if (!isSidebarOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 transition-opacity"
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <div
        className={`fixed right-0 top-0 z-50 h-full w-full max-w-md bg-white shadow-xl transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
          {/* Tabs */}
          <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
            <button
              onClick={() => setActiveTab("cart")}
              className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                activeTab === "cart"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <HandHeart className="h-4 w-4" />
              Giving List
              {cartItems.length > 0 && (
                <span className="ml-1 rounded-full bg-blue-100 px-1.5 py-0.5 text-xs font-semibold text-blue-700">
                  {cartItems.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("favorites")}
              className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                activeTab === "favorites"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Heart className="h-4 w-4" />
              Favorites
              {favorites.length > 0 && (
                <span className="ml-1 rounded-full bg-pink-100 px-1.5 py-0.5 text-xs font-semibold text-pink-700">
                  {favorites.length}
                </span>
              )}
            </button>
          </div>

          {/* Close button */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="h-[calc(100%-65px)] overflow-hidden">
          {activeTab === "cart" ? <CartTab /> : <FavoritesTab />}
        </div>
      </div>
    </>
  );
}
