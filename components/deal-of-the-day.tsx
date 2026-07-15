"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { formatPrice } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  image: string;
  description: string;
  stock: number;
}

export function DealOfTheDay() {
  const [timeLeft, setTimeLeft] = useState({
    days: 2,
    hours: 24,
    minutes: 59,
    seconds: 45,
  });
  const [deals, setDeals] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState<string | null>(null);

  useEffect(() => {
    // Fetch deal of the day products
    fetch("/api/products?dealOfDay=true&limit=2")
      .then((res) => res.json())
      .then((data) => setDeals(data.products || []))
      .catch(() => {})
      .finally(() => setLoading(false));

    // Countdown Timer
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else if (prev.days > 0) {
          return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleAddToCart = async (productId: string) => {
    setAddingId(productId);
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity: 1 }),
      });

      if (res.ok) {
        toast.success("Added to cart!");
        // Force header update
        window.location.reload();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to add to cart");
      }
    } catch {
      toast.error("Failed to add to cart");
    } finally {
      setAddingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 bg-muted/50">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (deals.length === 0) return null;

  return (
    <section className="border-y border-border bg-muted/50 py-12">
      <div className="container mx-auto px-4">
        <h2 className="mb-8 text-2xl font-bold">Deal of the Day</h2>
        <div className="grid gap-8 lg:grid-cols-2">
          {deals.map((product) => {
            const price = product.price / 100;
            const originalPrice = product.originalPrice / 100;
            return (
              <div key={product.id} className="overflow-hidden rounded-lg border border-border bg-card">
                <div className="grid gap-6 p-6 md:grid-cols-2">
                  <div className="aspect-square overflow-hidden rounded-lg bg-muted">
                    <img
                      src={product.image || "/placeholder.svg"}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex flex-col justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-balance">{product.name}</h3>
                      <p className="mt-2 text-sm text-muted-foreground text-pretty">
                        {product.description}
                      </p>
                      <div className="mt-4 flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-accent">{formatPrice(product.price)}</span>
                        <span className="text-lg text-muted-foreground line-through">{formatPrice(product.originalPrice)}</span>
                      </div>
                      <Button
                        className="mt-4 w-full gap-2"
                        onClick={() => handleAddToCart(product.id)}
                        disabled={addingId === product.id}
                      >
                        {addingId === product.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <ShoppingCart className="h-4 w-4" />
                        )}
                        Add to Cart
                      </Button>
                    </div>
                    <div className="mt-6">
                      <div className="mb-2 flex justify-between text-sm">
                        <span className="text-muted-foreground">Limited Stock</span>
                        <span className="text-muted-foreground">Available: {product.stock}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div className="h-full w-1/3 bg-accent" />
                      </div>
                      <p className="mt-4 text-sm font-medium">Hurry Up! Offer ends in:</p>
                      <div className="mt-2 grid grid-cols-4 gap-2">
                        <div className="rounded-lg bg-muted p-2 text-center">
                          <div className="text-2xl font-bold">{timeLeft.days}</div>
                          <div className="text-xs text-muted-foreground">Days</div>
                        </div>
                        <div className="rounded-lg bg-muted p-2 text-center">
                          <div className="text-2xl font-bold">{timeLeft.hours}</div>
                          <div className="text-xs text-muted-foreground">Hours</div>
                        </div>
                        <div className="rounded-lg bg-muted p-2 text-center">
                          <div className="text-2xl font-bold">{timeLeft.minutes}</div>
                          <div className="text-xs text-muted-foreground">Min</div>
                        </div>
                        <div className="rounded-lg bg-muted p-2 text-center">
                          <div className="text-2xl font-bold">{timeLeft.seconds}</div>
                          <div className="text-xs text-muted-foreground">Sec</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
