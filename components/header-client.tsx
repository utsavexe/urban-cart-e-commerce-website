"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShoppingCart,
  Heart,
  User,
  Menu,
  Search,
  LogOut,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";

export function HeaderClient() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [cartCount, setCartCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    // Fetch cart count
    fetch("/api/cart")
      .then((res) => res.json())
      .then((data) => {
        if (data.items) {
          setCartCount(
            data.items.reduce(
              (sum: number, item: { quantity: number }) => sum + item.quantity,
              0
            )
          );
        }
      })
      .catch(() => {});
  }, [pathname]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/products?search=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Top banner */}
      <div className="bg-primary py-2 text-center text-sm text-primary-foreground">
        Free shipping on orders over ₹500 • New arrivals daily
      </div>

      {/* Main header */}
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between gap-4 py-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <span className="text-xl font-bold text-primary-foreground">U</span>
            </div>
            <span className="text-2xl font-bold tracking-tight">UrbanCart</span>
          </Link>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="hidden flex-1 max-w-xl lg:flex">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search products..."
                className="w-full pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </form>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {session?.user ? (
              <div className="hidden md:flex items-center gap-2">
                <Link href="/account">
                  <Button variant="ghost" size="icon" title={session.user.name || "Account"}>
                    <User className="h-5 w-5" />
                  </Button>
                </Link>
                {session.user.role === "ADMIN" && (
                  <Link href="/admin">
                    <Button variant="ghost" size="sm" className="text-xs">
                      Admin
                    </Button>
                  </Link>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => signOut({ callbackUrl: "/" })}
                  title="Sign out"
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            ) : (
              <Link href="/login" className="hidden md:flex">
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                </Button>
              </Link>
            )}
            <Link href="/wishlist">
              <Button variant="ghost" size="icon" className="hidden md:flex">
                <Heart className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/cart">
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="h-5 w-5" />
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-xs text-accent-foreground">
                  {cartCount}
                </span>
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="hidden border-t border-border py-3 lg:block">
          <ul className="flex items-center justify-center gap-8 text-sm font-medium">
            <li>
              <Link href="/" className="hover:text-accent transition-colors">
                Home
              </Link>
            </li>
            <li>
              <Link href="/products" className="hover:text-accent transition-colors">
                Shop
              </Link>
            </li>
            <li>
              <Link href="/products?category=clothes" className="hover:text-accent transition-colors">
                Men&apos;s
              </Link>
            </li>
            <li>
              <Link href="/products?category=jewelry" className="hover:text-accent transition-colors">
                Women&apos;s
              </Link>
            </li>
            <li>
              <Link href="/products?category=accessories" className="hover:text-accent transition-colors">
                Accessories
              </Link>
            </li>
            <li>
              <Link href="/products?sort=price_asc" className="text-accent">
                Sale
              </Link>
            </li>
          </ul>
        </nav>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="border-t border-border py-4 lg:hidden">
            <form onSubmit={handleSearch} className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search products..."
                  className="w-full pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </form>
            <ul className="space-y-3 text-sm font-medium">
              <li><Link href="/" className="block py-1 hover:text-accent" onClick={() => setMobileMenuOpen(false)}>Home</Link></li>
              <li><Link href="/products" className="block py-1 hover:text-accent" onClick={() => setMobileMenuOpen(false)}>Shop</Link></li>
              <li><Link href="/products?category=clothes" className="block py-1 hover:text-accent" onClick={() => setMobileMenuOpen(false)}>Men&apos;s</Link></li>
              <li><Link href="/products?category=jewelry" className="block py-1 hover:text-accent" onClick={() => setMobileMenuOpen(false)}>Women&apos;s</Link></li>
              <li><Link href="/products?category=accessories" className="block py-1 hover:text-accent" onClick={() => setMobileMenuOpen(false)}>Accessories</Link></li>
              {session?.user ? (
                <>
                  <li><Link href="/account" className="block py-1 hover:text-accent" onClick={() => setMobileMenuOpen(false)}>My Account</Link></li>
                  <li><Link href="/orders" className="block py-1 hover:text-accent" onClick={() => setMobileMenuOpen(false)}>Orders</Link></li>
                  <li><Link href="/wishlist" className="block py-1 hover:text-accent" onClick={() => setMobileMenuOpen(false)}>Wishlist</Link></li>
                  {session.user.role === "ADMIN" && (
                    <li><Link href="/admin" className="block py-1 hover:text-accent" onClick={() => setMobileMenuOpen(false)}>Admin</Link></li>
                  )}
                  <li>
                    <button className="block py-1 text-destructive" onClick={() => signOut({ callbackUrl: "/" })}>
                      Sign Out
                    </button>
                  </li>
                </>
              ) : (
                <li><Link href="/login" className="block py-1 hover:text-accent" onClick={() => setMobileMenuOpen(false)}>Sign In</Link></li>
              )}
            </ul>
          </div>
        )}
      </div>
    </header>
  );
}
