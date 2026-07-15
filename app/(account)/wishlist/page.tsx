"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Heart, Trash2, ShoppingCart } from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface WishlistItem {
  id: string;
  productId: string;
  product: {
    id: string;
    name: string;
    price: number;
    originalPrice: number;
    image: string;
    category: { name: string };
  };
}

export default function WishlistPage() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWishlist = () => {
    fetch("/api/wishlist")
      .then((res) => res.json())
      .then((data) => setItems(data.items || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  const handleRemove = async (productId: string) => {
    try {
      const res = await fetch(`/api/wishlist/${productId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Removed from wishlist");
        fetchWishlist();
      } else {
        toast.error("Failed to remove item");
      }
    } catch {
      toast.error("Failed to remove item");
    }
  };

  const handleAddToCart = async (productId: string) => {
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity: 1 }),
      });

      if (res.ok) {
        toast.success("Added to cart!");
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to add to cart");
      }
    } catch {
      toast.error("Failed to add to cart");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Wishlist</h1>
        <p className="text-sm text-muted-foreground mt-1">Keep track of products you want to buy later</p>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16 bg-muted/10 rounded-xl border border-dashed p-8">
          <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-lg font-bold">Your wishlist is empty</h2>
          <p className="text-muted-foreground text-sm mt-1 max-w-xs mx-auto">
            Explore our collection and click the heart icon on any product to save it here.
          </p>
          <Link href="/products" className="mt-4 inline-block">
            <Button size="sm">Explore Products</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const discount = Math.round(
              ((item.product.originalPrice - item.product.price) / item.product.originalPrice) * 100
            );

            return (
              <div key={item.id} className="group relative overflow-hidden rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                <div>
                  <div className="relative aspect-square overflow-hidden bg-muted">
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                    {discount > 0 && (
                      <div className="absolute left-2 top-2 rounded-md bg-accent px-2 py-1 text-xs font-bold text-accent-foreground">
                        -{discount}%
                      </div>
                    )}
                    <button
                      onClick={() => handleRemove(item.product.id)}
                      className="absolute right-2 top-2 rounded-full bg-background/80 p-1.5 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors shadow-sm"
                      title="Remove"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="p-4">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">{item.product.category.name}</p>
                    <h3 className="mt-1 font-semibold text-sm line-clamp-2">
                      <Link href={`/product/${item.product.id}`} className="hover:underline">
                        {item.product.name}
                      </Link>
                    </h3>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-base font-bold">{formatPrice(item.product.price)}</span>
                      {item.product.originalPrice > item.product.price && (
                        <span className="text-xs text-muted-foreground line-through">
                          {formatPrice(item.product.originalPrice)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-4 border-t border-border pt-3">
                  <Button className="w-full gap-1.5 text-xs h-9" size="sm" onClick={() => handleAddToCart(item.product.id)}>
                    <ShoppingCart className="h-3.5 w-3.5" /> Add to Cart
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
