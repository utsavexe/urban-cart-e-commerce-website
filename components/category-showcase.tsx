"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

interface SubCategory {
  id: string;
  name: string;
  slug: string;
  _count: {
    products: number;
  };
}

interface ParentCategory {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  children: SubCategory[];
}

export function CategoryShowcase() {
  const [categories, setCategories] = useState<ParentCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => {
        setCategories((data.categories || []).slice(0, 4));
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

  if (categories.length === 0) return null;

  return (
    <section className="border-y border-border bg-muted/30 py-12">
      <div className="container mx-auto px-4">
        <h2 className="mb-8 text-2xl font-bold">Shop by Category</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => (
            <div key={category.id} className="rounded-lg border border-border bg-card p-6 flex flex-col justify-between">
              <div>
                <div className="mb-4 flex items-start gap-4">
                  <div className="h-16 w-16 overflow-hidden rounded-lg bg-muted flex-shrink-0">
                    <img
                      src={category.image || "/placeholder.svg"}
                      alt={category.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{category.name}</h3>
                  </div>
                </div>
                <ul className="space-y-2">
                  {category.children.slice(0, 4).map((sub) => (
                    <li key={sub.id}>
                      <Link
                        href={`/category/${sub.slug}`}
                        className="flex items-center justify-between text-sm text-muted-foreground hover:text-accent transition-colors"
                      >
                        <span>{sub.name}</span>
                        <span className="text-xs">({sub._count?.products ?? 0})</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
