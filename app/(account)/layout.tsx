"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HeaderClient } from "@/components/header-client";
import { Footer } from "@/components/footer";
import { User, ShoppingBag, Heart, MapPin, Search } from "lucide-react";

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const links = [
    { name: "My Profile", href: "/account", icon: User },
    { name: "Order History", href: "/orders", icon: ShoppingBag },
    { name: "Wishlist", href: "/wishlist", icon: Heart },
    { name: "Manage Addresses", href: "/addresses", icon: MapPin },
    { name: "Track Order", href: "/track", icon: Search },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-muted/10">
      <HeaderClient />
      <div className="flex-1 container mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-4">
          {/* Account Sidebar Navigation */}
          <aside className="lg:col-span-1">
            <div className="rounded-xl border border-border bg-card p-4 shadow-sm space-y-1">
              <div className="px-3 py-2">
                <h2 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">Account Center</h2>
              </div>
              <nav className="space-y-1">
                {links.map((link) => {
                  const Icon = link.icon;
                  const isActive = pathname === link.href || (link.href !== "/account" && pathname.startsWith(link.href));
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

          {/* Account Content Area */}
          <main className="lg:col-span-3">
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm min-h-[400px]">
              {children}
            </div>
          </main>
        </div>
      </div>
      <Footer />
    </div>
  );
}
