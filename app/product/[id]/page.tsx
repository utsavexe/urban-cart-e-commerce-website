"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { HeaderClient } from "@/components/header-client";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatPrice } from "@/lib/utils";
import {
  ShoppingCart,
  Heart,
  Star,
  Minus,
  Plus,
  Loader2,
  ArrowLeft,
  Truck,
  Shield,
  RotateCcw,
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  originalPrice: number;
  image: string;
  images: string[];
  stock: number;
  rating: number;
  reviewCount: number;
  category: { name: string; slug: string };
  variants: { id: string; name: string; value: string; stock: number; priceAdd: number }[];
  reviews: {
    id: string;
    rating: number;
    title: string;
    comment: string;
    createdAt: string;
    user: { name: string; image: string };
  }[];
}

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          toast.error("Product not found");
          return;
        }
        setProduct(data);
        if (data.variants?.length > 0) {
          setSelectedVariant(data.variants[0].id);
        }
      })
      .catch(() => toast.error("Failed to load product"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddToCart = async () => {
    if (!product) return;
    setAddingToCart(true);

    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          variantId: selectedVariant,
          quantity,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Added to cart!");
      } else {
        toast.error(data.error || "Failed to add to cart");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setAddingToCart(false);
    }
  };

  const handleAddToWishlist = async () => {
    if (!product) return;
    try {
      const res = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Added to wishlist!");
      } else {
        toast.error(data.error || "Failed to add to wishlist");
      }
    } catch {
      toast.error("Please sign in to add to wishlist");
    }
  };

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

  if (!product) {
    return (
      <div className="min-h-screen">
        <HeaderClient />
        <div className="container mx-auto px-4 py-32 text-center">
          <p className="text-lg text-muted-foreground">Product not found</p>
          <Button variant="outline" className="mt-4" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Go Back
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  const discount = Math.round(
    ((product.originalPrice - product.price) / product.originalPrice) * 100
  );

  const selectedVariantData = product.variants.find((v) => v.id === selectedVariant);
  const availableStock = selectedVariantData?.stock ?? product.stock;

  // Group variants by name
  const variantGroups: Record<string, typeof product.variants> = {};
  for (const v of product.variants) {
    if (!variantGroups[v.name]) variantGroups[v.name] = [];
    variantGroups[v.name].push(v);
  }

  return (
    <div className="min-h-screen">
      <HeaderClient />
      <main className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="text-sm text-muted-foreground mb-6">
          <button onClick={() => router.back()} className="hover:text-accent inline-flex items-center gap-1">
            <ArrowLeft className="h-3 w-3" /> Back
          </button>
          <span className="mx-2">/</span>
          <span>{product.category.name}</span>
          <span className="mx-2">/</span>
          <span className="text-foreground">{product.name}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Product Image */}
          <div className="aspect-square overflow-hidden rounded-xl bg-muted">
            <img
              src={product.image || "/placeholder.svg"}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          </div>

          {/* Product Info */}
          <div className="flex flex-col">
            <p className="text-sm text-muted-foreground">{product.category.name}</p>
            <h1 className="text-3xl font-bold mt-1">{product.name}</h1>

            {/* Rating */}
            <div className="flex items-center gap-2 mt-3">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-4 w-4 ${
                      star <= Math.round(product.rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                {product.rating.toFixed(1)} ({product.reviewCount} reviews)
              </span>
            </div>

            {/* Price */}
            <div className="mt-4 flex items-baseline gap-3">
              <span className="text-3xl font-bold">{formatPrice(product.price + (selectedVariantData?.priceAdd ?? 0))}</span>
              {discount > 0 && (
                <>
                  <span className="text-lg text-muted-foreground line-through">
                    {formatPrice(product.originalPrice)}
                  </span>
                  <span className="rounded-md bg-accent px-2 py-1 text-xs font-bold text-accent-foreground">
                    -{discount}%
                  </span>
                </>
              )}
            </div>

            {/* Description */}
            <p className="text-muted-foreground mt-4 leading-relaxed">{product.description}</p>

            {/* Variants */}
            {Object.entries(variantGroups).map(([name, variants]) => (
              <div key={name} className="mt-6">
                <label className="text-sm font-medium">{name}</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {variants.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariant(v.id)}
                      className={`rounded-md border px-4 py-2 text-sm transition-colors ${
                        selectedVariant === v.id
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border hover:border-accent"
                      } ${v.stock === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
                      disabled={v.stock === 0}
                    >
                      {v.value}
                      {v.stock === 0 && " (Out of stock)"}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {/* Quantity + Add to Cart */}
            <div className="mt-6 flex items-center gap-4">
              <div className="flex items-center rounded-md border border-border">
                <button
                  className="px-3 py-2 hover:bg-muted transition-colors"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="px-4 py-2 min-w-[48px] text-center font-medium">{quantity}</span>
                <button
                  className="px-3 py-2 hover:bg-muted transition-colors"
                  onClick={() => setQuantity((q) => Math.min(availableStock, q + 1))}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <span className="text-sm text-muted-foreground">
                {availableStock > 0 ? `${availableStock} in stock` : "Out of stock"}
              </span>
            </div>

            <div className="mt-6 flex gap-3">
              <Button
                size="lg"
                className="flex-1 gap-2"
                onClick={handleAddToCart}
                disabled={addingToCart || availableStock === 0}
              >
                {addingToCart ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-4 w-4" />}
                {availableStock > 0 ? "Add to Cart" : "Out of Stock"}
              </Button>
              <Button size="lg" variant="outline" onClick={handleAddToWishlist}>
                <Heart className="h-4 w-4" />
              </Button>
            </div>

            {/* Trust badges */}
            <div className="mt-8 grid grid-cols-3 gap-4 border-t border-border pt-6">
              <div className="text-center">
                <Truck className="h-5 w-5 mx-auto text-muted-foreground" />
                <p className="text-xs text-muted-foreground mt-1">Free Shipping</p>
              </div>
              <div className="text-center">
                <Shield className="h-5 w-5 mx-auto text-muted-foreground" />
                <p className="text-xs text-muted-foreground mt-1">Secure Payment</p>
              </div>
              <div className="text-center">
                <RotateCcw className="h-5 w-5 mx-auto text-muted-foreground" />
                <p className="text-xs text-muted-foreground mt-1">Easy Returns</p>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews section */}
        {product.reviews.length > 0 && (
          <section className="mt-16 border-t border-border pt-8">
            <h2 className="text-2xl font-bold mb-6">Customer Reviews</h2>
            <div className="space-y-6">
              {product.reviews.map((review) => (
                <div key={review.id} className="border-b border-border pb-6">
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-3 w-3 ${
                            star <= review.rating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-muted-foreground"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-medium">{review.user.name || "Anonymous"}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {review.title && <p className="font-medium mt-2">{review.title}</p>}
                  {review.comment && <p className="text-sm text-muted-foreground mt-1">{review.comment}</p>}
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
