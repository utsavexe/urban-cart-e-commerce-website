import Link from "next/link"
import { ShoppingCart, Heart, User, Menu, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Top banner */}
      <div className="bg-primary py-2 text-center text-sm text-primary-foreground">
        Free shipping on orders over $50 • New arrivals daily
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
          <div className="hidden flex-1 max-w-xl lg:flex">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input type="search" placeholder="Search products..." className="w-full pl-10" />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="hidden md:flex">
              <User className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="hidden md:flex">
              <Heart className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="relative">
              <ShoppingCart className="h-5 w-5" />
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-xs text-accent-foreground">
                0
              </span>
            </Button>
            <Button variant="ghost" size="icon" className="lg:hidden">
              <Menu className="h-5 w-5" />
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
              <Link href="/categories" className="hover:text-accent transition-colors">
                Categories
              </Link>
            </li>
            <li>
              <Link href="/mens" className="hover:text-accent transition-colors">
                Men's
              </Link>
            </li>
            <li>
              <Link href="/womens" className="hover:text-accent transition-colors">
                Women's
              </Link>
            </li>
            <li>
              <Link href="/accessories" className="hover:text-accent transition-colors">
                Accessories
              </Link>
            </li>
            <li>
              <Link href="/sale" className="text-accent">
                Sale
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  )
}
