"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  _count: {
    products: number;
  };
}

export function CategoryGrid() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => {
        // filter to subcategories/leaf categories or select top 8 flat categories
        const list = data.allCategories || [];
        setCategories(list.slice(0, 8));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <section className="container mx-auto px-4 py-12">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/category/${category.slug}`}
            className="group relative overflow-hidden rounded-lg border border-border bg-card p-4 transition-all hover:border-accent hover:shadow-lg"
          >
            <div className="aspect-square overflow-hidden rounded-md bg-muted">
              <img
                src={category.image || "/placeholder.svg"}
                alt={category.name}
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
              />
            </div>
            <div className="mt-3 text-center">
              <h3 className="font-semibold text-sm">{category.name}</h3>
              <p className="text-xs text-muted-foreground">({category._count?.products ?? 0})</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
