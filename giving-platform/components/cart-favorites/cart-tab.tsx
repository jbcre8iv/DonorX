"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Trash2, Tag, Building2, ArrowRight, HandHeart } from "lucide-react";
import { useCartFavorites } from "@/contexts/cart-favorites-context";
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
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100">
                {item.nonprofit?.logoUrl ? (
                  <Image
                    src={item.nonprofit.logoUrl}
                    alt={item.nonprofit.name}
                    width={40}
                    height={40}
                    className="rounded-lg object-cover"
                  />
                ) : item.category?.icon ? (
                  <span className="text-xl">{item.category.icon}</span>
                ) : item.nonprofit ? (
                  <Building2 className="h-5 w-5 text-slate-400" />
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

              {/* Remove button */}
              <button
                onClick={() => removeFromCart(item.id)}
                className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                title="Remove from cart"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-200 bg-slate-50 p-4">
        <p className="mb-3 text-xs text-slate-500 text-center">
          Set your donation amount and allocation percentages on the next page.
        </p>
        <Button
          onClick={handleProceedToDonate}
          className="w-full"
        >
          Proceed to Donate
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
