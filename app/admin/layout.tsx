"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HeaderClient } from "@/components/header-client";
import { Footer } from "@/components/footer";
import { BarChart3, Package, ShoppingCart, ArrowLeft, Globe } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const links = [
    { name: "Stats Dashboard", href: "/admin", icon: BarChart3 },
    { name: "Manage Products", href: "/admin/products", icon: Package },
    { name: "Manage Orders", href: "/admin/orders", icon: ShoppingCart },
    { name: "Product Scraper", href: "/admin/scraper", icon: Globe },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-muted/10">
      <HeaderClient />
      <div className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Admin Console</h1>
          <Link href="/">
            <button className="flex items-center gap-1 text-sm font-semibold text-accent hover:underline">
              <ArrowLeft className="h-4 w-4" /> Return to Storefront
            </button>
          </Link>
        </div>

        <div className="grid gap-8 lg:grid-cols-4">
          {/* Admin Sidebar Navigation */}
          <aside className="lg:col-span-1">
            <div className="rounded-xl border border-border bg-card p-4 shadow-sm space-y-1">
              <div className="px-3 py-2">
                <h2 className="font-bold text-xs text-muted-foreground uppercase tracking-wider">Management Center</h2>
              </div>
              <nav className="space-y-1">
                {links.map((link) => {
                  const Icon = link.icon;
                  const isActive = pathname === link.href || (link.href !== "/admin" && pathname.startsWith(link.href));
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {link.name}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </aside>

          {/* Admin Content Area */}
          <main className="lg:col-span-3">
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm min-h-[500px]">
              {children}
            </div>
          </main>
        </div>
      </div>
      <Footer />
    </div>
  );
}
