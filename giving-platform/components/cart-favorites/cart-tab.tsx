"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2, Tag, ArrowRight, HandHeart, Eye, X, Globe } from "lucide-react";
import { useCartFavorites, type CartItem } from "@/contexts/cart-favorites-context";
import { Button } from "@/components/ui/button";

export function CartTab() {
  const router = useRouter();
  const {
    cartItems,
    removeFromCart,
    clearCart,
    setSidebarOpen,
  } = useCartFavorites();

  const [isClearing, setIsClearing] = useState(false);
  const [quickViewItem, setQuickViewItem] = useState<CartItem | null>(null);

  const handleProceedToDonate = () => {
    // Store cart items in sessionStorage for the donate page to pick up
    // The donate page will handle the percentage allocation
    const cartData = cartItems.map(item => ({
      nonprofitId: item.nonprofitId,
      categoryId: item.categoryId,
      nonprofit: item.nonprofit,
      category: item.category,
    }));
    sessionStorage.setItem("donorx_cart_checkout", JSON.stringify(cartData));
    setSidebarOpen(false);
    router.push("/donate?from=cart");
  };

  const handleClearCart = async () => {
    setIsClearing(true);
    await clearCart();
    setIsClearing(false);
  };

  if (cartItems.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center">
        <div className="mb-4 rounded-full bg-slate-100 p-4">
          <HandHeart className="h-8 w-8 text-slate-400" />
        </div>
        <h3 className="mb-2 text-lg font-medium text-slate-900">
          Your giving list is empty
        </h3>
        <p className="mb-6 text-sm text-slate-500">
          Browse the directory and add nonprofits or categories to quickly
          build your donation allocation.
        </p>
        <Link href="/directory" onClick={() => setSidebarOpen(false)}>
          <Button>Browse Directory</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Sticky Header with Proceed Button */}
      <div className="border-b border-slate-200 bg-white p-4 shadow-sm">
        <Button
          onClick={handleProceedToDonate}
          className="w-full mb-3"
          size="lg"
        >
          Proceed to Donate
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
        <p className="text-xs text-slate-500 text-center">
          Set your donation amount and allocation percentages on the next page.
        </p>
      </div>

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm text-slate-500">
            {cartItems.length} item{cartItems.length !== 1 ? "s" : ""} selected
          </span>
          <button
            onClick={handleClearCart}
            disabled={isClearing}
            className="text-sm text-red-500 hover:text-red-600 disabled:opacity-50"
          >
            {isClearing ? "Clearing..." : "Clear all"}
          </button>
        </div>

        <div className="space-y-2">
          {cartItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3"
            >
              {/* Logo/Icon */}
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 overflow-hidden">
                {item.nonprofit?.logoUrl ? (
                  <img
                    src={item.nonprofit.logoUrl}
                    alt={item.nonprofit.name}
                    className="h-10 w-10 rounded-lg object-contain"
                  />
                ) : item.category?.icon ? (
                  <span className="text-xl">{item.category.icon}</span>
                ) : item.nonprofit ? (
                  <span className="text-lg font-semibold text-slate-600">
                    {item.nonprofit.name.charAt(0)}
                  </span>
                ) : (
                  <Tag className="h-5 w-5 text-slate-400" />
                )}
              </div>

              {/* Name and Type */}
              <div className="min-w-0 flex-1">
                <h4 className="truncate font-medium text-slate-900">
                  {item.nonprofit?.name || item.category?.name}
                </h4>
                <p className="text-xs text-slate-500">
                  {item.nonprofit ? "Nonprofit" : "Category"}
                </p>
              </div>

              {/* Quick View button (nonprofits only) */}
              {item.nonprofitId && (
                <button
                  onClick={() => setQuickViewItem(item)}
                  className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                  title="Quick view"
                >
                  <Eye className="h-4 w-4" />
                </button>
              )}

              {/* Remove button */}
              <button
                onClick={() => removeFromCart(item.id)}
                className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                title="Remove from giving list"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Quick View Modal */}
        {quickViewItem && quickViewItem.nonprofit && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setQuickViewItem(null)}
            />
            {/* Modal */}
            <div className="relative w-full max-w-md rounded-xl bg-white shadow-xl">
              {/* Header */}
              <div className="flex items-start gap-4 p-4 border-b border-slate-200">
                {quickViewItem.nonprofit.logoUrl ? (
                  <img
                    src={quickViewItem.nonprofit.logoUrl}
                    alt={quickViewItem.nonprofit.name}
                    className="h-14 w-14 rounded-xl object-contain border border-slate-200"
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-slate-100 text-slate-600 font-bold text-xl">
                    {quickViewItem.nonprofit.name.charAt(0)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-slate-900">
                    {quickViewItem.nonprofit.name}
                  </h3>
                  <p className="text-sm text-slate-500">Nonprofit</p>
                </div>
                <button
                  onClick={() => setQuickViewItem(null)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-4">
                {quickViewItem.nonprofit.mission ? (
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 mb-2">Mission</h4>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {quickViewItem.nonprofit.mission}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 italic">
                    No mission statement available.
                  </p>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center gap-2 p-4 border-t border-slate-200 bg-slate-50 rounded-b-xl">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => setQuickViewItem(null)}
                >
                  Close
                </Button>
                <Button
                  size="sm"
                  className="flex-1"
                  asChild
                >
                  <Link
                    href={`/directory/${quickViewItem.nonprofitId}`}
                    onClick={() => {
                      setQuickViewItem(null);
                      setSidebarOpen(false);
                    }}
                  >
                    <Globe className="h-4 w-4 mr-1" />
                    Full Profile
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
