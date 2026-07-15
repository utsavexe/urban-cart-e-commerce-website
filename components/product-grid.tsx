"use client";

import { useEffect, useState } from "react";
import { ProductCard } from "@/components/product-card";
import { Loader2 } from "lucide-react";

interface Product {
  id: string;
  name: string;
  category: { name: string };
  price: number;
  originalPrice: number;
  image: string;
}

export function ProductGrid() {
  const [sections, setSections] = useState<{
    "New Arrivals": Product[];
    Trending: Product[];
    "Top Rated": Product[];
  }>({
    "New Arrivals": [],
    Trending: [],
    "Top Rated": [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/products?newArrivals=true&limit=4").then((res) => res.json()),
      fetch("/api/products?trending=true&limit=4").then((res) => res.json()),
      fetch("/api/products?topRated=true&limit=4").then((res) => res.json()),
    ])
      .then(([newArrivalsData, trendingData, topRatedData]) => {
        setSections({
          "New Arrivals": newArrivalsData.products || [],
          Trending: trendingData.products || [],
          "Top Rated": topRatedData.products || [],
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const mapProduct = (p: Product) => ({
    id: p.id,
    name: p.name,
    category: p.category?.name || "Clothes",
    price: p.price,
    originalPrice: p.originalPrice,
    image: p.image,
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <section className="container mx-auto px-4 py-12">
      {Object.entries(sections).map(([section, items]) => {
        if (items.length === 0) return null;
        return (
          <div key={section} className="mb-16">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold">{section}</h2>
              <a
                href={`/products?${
                  section === "New Arrivals"
                    ? "newArrivals=true"
                    : section === "Trending"
                    ? "trending=true"
                    : "topRated=true"
                }`}
                className="text-sm font-medium text-accent hover:underline"
              >
                View all
              </a>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {items.map((product) => (
                <ProductCard key={product.id} product={mapProduct(product)} />
              ))}
            </div>
          </div>
        );
      })}
    </section>
  );
}
