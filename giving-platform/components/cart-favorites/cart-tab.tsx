"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Trash2, Tag, Building2, AlertCircle, ArrowRight, ShoppingCart } from "lucide-react";
import { useCartFavorites } from "@/contexts/cart-favorites-context";
import { Button } from "@/components/ui/button";

export function CartTab() {
  const router = useRouter();
  const {
    cartItems,
    removeFromCart,
    updateCartPercentage,
    clearCart,
    cartTotal,
    setSidebarOpen,
  } = useCartFavorites();

  const [isClearing, setIsClearing] = useState(false);

  const handleProceedToDonate = () => {
    // Store cart items in sessionStorage for the donate page to pick up
    sessionStorage.setItem("donorx_cart_checkout", JSON.stringify(cartItems));
    setSidebarOpen(false);
    router.push("/donate?from=cart");
  };

  const handleClearCart = async () => {
    setIsClearing(true);
    await clearCart();
    setIsClearing(false);
  };

  const handlePercentageChange = (itemId: string, value: string) => {
    const percentage = Math.min(100, Math.max(0, parseInt(value) || 0));
    updateCartPercentage(itemId, percentage);
  };

  const distributeEvenly = () => {
    const evenPercentage = Math.floor(100 / cartItems.length);
    const remainder = 100 - evenPercentage * cartItems.length;

    cartItems.forEach((item, index) => {
      // Give the remainder to the first item
      const percentage = index === 0 ? evenPercentage + remainder : evenPercentage;
      updateCartPercentage(item.id, percentage);
    });
  };

  if (cartItems.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center">
        <div className="mb-4 rounded-full bg-slate-100 p-4">
          <ShoppingCart className="h-8 w-8 text-slate-400" />
        </div>
        <h3 className="mb-2 text-lg font-medium text-slate-900">
          Your cart is empty
        </h3>
        <p className="mb-6 text-sm text-slate-500">
          Browse the directory and add nonprofits or categories to your
          allocation cart.
        </p>
        <Link href="/directory" onClick={() => setSidebarOpen(false)}>
          <Button>Browse Directory</Button>
        </Link>
      </div>
    );
  }

  const isValidTotal = cartTotal === 100;

  return (
    <div className="flex h-full flex-col">
      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm text-slate-500">
            {cartItems.length} item{cartItems.length !== 1 ? "s" : ""}
          </span>
          <div className="flex gap-2">
            <button
              onClick={distributeEvenly}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Split evenly
            </button>
            <span className="text-slate-300">|</span>
            <button
              onClick={handleClearCart}
              disabled={isClearing}
              className="text-sm text-red-500 hover:text-red-600 disabled:opacity-50"
            >
              {isClearing ? "Clearing..." : "Clear all"}
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {cartItems.map((item) => (
            <div
              key={item.id}
              className="rounded-lg border border-slate-200 bg-white p-3"
            >
              <div className="flex items-start gap-3">
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
                  className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* Percentage Input */}
              <div className="mt-3 flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={item.percentage}
                  onChange={(e) =>
                    handlePercentageChange(item.id, e.target.value)
                  }
                  className="h-2 flex-1 cursor-pointer appearance-none rounded-lg bg-slate-200 accent-blue-600"
                />
                <div className="flex items-center">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={item.percentage}
                    onChange={(e) =>
                      handlePercentageChange(item.id, e.target.value)
                    }
                    className="w-14 rounded border border-slate-200 px-2 py-1 text-center text-sm"
                  />
                  <span className="ml-1 text-sm text-slate-500">%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-200 bg-slate-50 p-4">
        {/* Total Indicator */}
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm font-medium text-slate-700">
            Total Allocation
          </span>
          <div className="flex items-center gap-2">
            <span
              className={`text-lg font-bold ${
                isValidTotal
                  ? "text-green-600"
                  : cartTotal > 100
                  ? "text-red-600"
                  : "text-amber-600"
              }`}
            >
              {cartTotal}%
            </span>
            {!isValidTotal && (
              <AlertCircle
                className={`h-4 w-4 ${
                  cartTotal > 100 ? "text-red-500" : "text-amber-500"
                }`}
              />
            )}
          </div>
        </div>

        {!isValidTotal && (
          <p className="mb-4 text-xs text-amber-600">
            {cartTotal > 100
              ? "Total exceeds 100%. Please adjust your allocations."
              : "Allocations must total 100% to proceed."}
          </p>
        )}

        <Button
          onClick={handleProceedToDonate}
          disabled={!isValidTotal || cartItems.length === 0}
          className="w-full"
        >
          Proceed to Donate
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
