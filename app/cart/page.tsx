"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { HeaderClient } from "@/components/header-client";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { formatPrice } from "@/lib/utils";
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Loader2 } from "lucide-react";

interface CartItem {
  id: string;
  quantity: number;
  productId: string;
  variantId: string | null;
  product: {
    id: string;
    name: string;
    price: number;
    originalPrice: number;
    image: string;
  };
  variant: {
    id: string;
    name: string;
    value: string;
    priceAdd: number;
  } | null;
}

interface Cart {
  id: string;
  items: CartItem[];
}

export default function CartPage() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  const fetchCart = () => {
    fetch("/api/cart")
      .then((res) => res.json())
      .then((data) => setCart(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const handleUpdateQuantity = async (itemId: string, currentQty: number, change: number, maxStock: number) => {
    const newQty = currentQty + change;
    if (newQty < 1) return;
    if (newQty > maxStock) {
      toast.error(`Only ${maxStock} items available in stock`);
      return;
    }

    try {
      const res = await fetch(`/api/cart/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: newQty }),
      });

      if (res.ok) {
        fetchCart();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to update quantity");
      }
    } catch {
      toast.error("Failed to update quantity");
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    try {
      const res = await fetch(`/api/cart/${itemId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Item removed from cart");
        fetchCart();
      } else {
        toast.error("Failed to remove item");
      }
    } catch {
      toast.error("Failed to remove item");
    }
  };

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    setValidatingCoupon(true);

    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: couponCode.toUpperCase().trim(),
          cartTotal: subtotal,
        }),
      });

      const data = await res.json();

      if (res.ok && data.valid) {
        setCouponDiscount(data.discount);
        setAppliedCoupon(data.code);
        toast.success(`Coupon "${data.code}" applied! You saved ${formatPrice(data.discount)}`);
      } else {
        toast.error(data.error || "Invalid coupon code");
      }
    } catch {
      toast.error("Failed to validate coupon");
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponDiscount(0);
    setAppliedCoupon(null);
    setCouponCode("");
    toast.info("Coupon removed");
  };

  // Calculations
  const subtotal = cart?.items.reduce((sum, item) => {
    const itemPrice = item.product.price + (item.variant?.priceAdd ?? 0);
    return sum + itemPrice * item.quantity;
  }, 0) ?? 0;

  const originalSubtotal = cart?.items.reduce((sum, item) => {
    const origPrice = item.product.originalPrice + (item.variant?.priceAdd ?? 0);
    return sum + origPrice * item.quantity;
  }, 0) ?? 0;

  const itemsDiscount = originalSubtotal - subtotal;
  const shipping = subtotal - couponDiscount >= 50000 || subtotal === 0 ? 0 : 4900; // Free over ₹500
  const tax = Math.floor((subtotal - couponDiscount) * 0.18);
  const total = subtotal - couponDiscount + shipping + tax;

  if (loading) {
    return (
      <div className="min-h-screen">
        <HeaderClient />
        <div className="flex justify-center py-32">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
        <Footer />
      </div>
    );
  }

  const hasItems = cart && cart.items.length > 0;

  return (
    <div className="min-h-screen">
      <HeaderClient />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>

        {!hasItems ? (
          <div className="text-center py-20 bg-muted/20 rounded-xl border border-dashed border-border p-8">
            <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-bold">Your cart is empty</h2>
            <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
              Looks like you haven&apos;t added anything to your cart yet. Let&apos;s find some amazing deals!
            </p>
            <Link href="/products">
              <Button className="mt-6">Start Shopping</Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Cart Items List */}
            <div className="lg:col-span-2 space-y-4">
              {cart.items.map((item) => {
                const itemPrice = item.product.price + (item.variant?.priceAdd ?? 0);
                const origPrice = item.product.originalPrice + (item.variant?.priceAdd ?? 0);
                return (
                  <div
                    key={item.id}
                    className="flex flex-col sm:flex-row items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm"
                  >
                    <div className="h-24 w-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      <img
                        src={item.product.image || "/placeholder.svg"}
                        alt={item.product.name}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <div className="flex-1 text-center sm:text-left min-w-0">
                      <h3 className="font-semibold text-sm line-clamp-2">
                        <Link href={`/product/${item.product.id}`} className="hover:underline">
                          {item.product.name}
                        </Link>
                      </h3>
                      {item.variant && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {item.variant.name}: <span className="font-medium">{item.variant.value}</span>
                        </p>
                      )}
                      <div className="flex items-center justify-center sm:justify-start gap-2 mt-2">
                        <span className="font-bold text-sm">{formatPrice(itemPrice)}</span>
                        {origPrice > itemPrice && (
                          <span className="text-xs text-muted-foreground line-through">
                            {formatPrice(origPrice)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Quantity Selector */}
                      <div className="flex items-center rounded-md border border-border">
                        <button
                          className="p-2 hover:bg-muted transition-colors"
                          onClick={() => handleUpdateQuantity(item.id, item.quantity, -1, 999)}
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="px-3 min-w-[32px] text-center text-sm font-semibold">
                          {item.quantity}
                        </span>
                        <button
                          className="p-2 hover:bg-muted transition-colors"
                          onClick={() => handleUpdateQuantity(item.id, item.quantity, 1, 999)}
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => handleRemoveItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Order Summary */}
            <div className="space-y-6">
              <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                <h2 className="font-bold text-lg mb-4">Order Summary</h2>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal (original MRP)</span>
                    <span>{formatPrice(originalSubtotal)}</span>
                  </div>
                  {itemsDiscount > 0 && (
                    <div className="flex justify-between text-accent">
                      <span>Product Discount</span>
                      <span>-{formatPrice(itemsDiscount)}</span>
                    </div>
                  )}
                  {appliedCoupon && (
                    <div className="flex justify-between text-accent font-medium">
                      <span>Coupon Discount ({appliedCoupon})</span>
                      <div className="flex items-center gap-1">
                        <span>-{formatPrice(couponDiscount)}</span>
                        <button
                          onClick={handleRemoveCoupon}
                          className="text-destructive hover:underline text-xs"
                        >
                          (remove)
                        </button>
                      </div>
                    </div>
                  )}
                  <div className="flex justify-between text-muted-foreground">
                    <span>Shipping</span>
                    <span>{shipping === 0 ? "FREE" : formatPrice(shipping)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>GST (18%)</span>
                    <span>{formatPrice(tax)}</span>
                  </div>
                  <hr className="border-border my-2" />
                  <div className="flex justify-between font-bold text-base">
                    <span>Total</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                </div>

                {/* Coupon Code Input */}
                {!appliedCoupon && (
                  <form onSubmit={handleApplyCoupon} className="mt-6 flex gap-2">
                    <Input
                      placeholder="COUPON CODE"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="uppercase text-sm"
                    />
                    <Button type="submit" variant="secondary" size="sm" disabled={validatingCoupon}>
                      {validatingCoupon ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
                    </Button>
                  </form>
                )}

                <Link href="/checkout">
                  <Button className="w-full mt-6 gap-2">
                    Proceed to Checkout <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>

              {/* Delivery info banner */}
              <div className="rounded-xl border border-border bg-muted/30 p-4 text-xs text-muted-foreground space-y-1">
                <p>🚚 Free shipping applies to orders above ₹500.</p>
                <p>🛡️ Secure checkouts guaranteed with Razorpay.</p>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
