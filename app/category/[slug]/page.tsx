"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { HeaderClient } from "@/components/header-client";
import { Footer } from "@/components/footer";
import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft } from "lucide-react";

interface Product {
  id: string;
  name: string;
  slug: string;
  category: { name: string; slug: string };
  price: number;
  originalPrice: number;
  image: string;
  rating: number;
  stock: number;
}

export default function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryName, setCategoryName] = useState("");

  useEffect(() => {
    setLoading(true);
    // Find category to display the name properly
    fetch(`/api/products?category=${slug}&limit=24`)
      .then((res) => res.json())
      .then((data) => {
        setProducts(data.products || []);
        if (data.products && data.products.length > 0) {
          setCategoryName(data.products[0].category.name);
        } else {
          // Format slug as fallback name
          setCategoryName(slug.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" "));
        }
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [slug]);

  const mapProduct = (p: Product) => ({
    id: p.id,
    name: p.name,
    category: p.category?.name || "",
    price: p.price,
    originalPrice: p.originalPrice,
    image: p.image,
  });

  return (
    <div className="min-h-screen">
      <HeaderClient />
      <main className="container mx-auto px-4 py-8">
        <nav className="text-sm text-muted-foreground mb-6">
          <button onClick={() => router.back()} className="hover:text-accent inline-flex items-center gap-1">
            <ArrowLeft className="h-3 w-3" /> Back
          </button>
          <span className="mx-2">/</span>
          <span>Category</span>
          <span className="mx-2">/</span>
          <span className="text-foreground">{categoryName}</span>
        </nav>

        <div className="mb-8">
          <h1 className="text-3xl font-bold">{categoryName}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {products.length} product{products.length !== 1 ? "s" : ""} in this category
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-lg text-muted-foreground">No products found in this category.</p>
            <Link href="/products">
              <Button variant="outline" className="mt-4">Browse All Products</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={mapProduct(product)} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

import Link from "next/link";
