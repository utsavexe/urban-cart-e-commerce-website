"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Loader2, IndianRupee, ShoppingCart, Users, Package, AlertTriangle } from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface Stats {
  totalOrders: number;
  totalRevenue: number;
  totalUsers: number;
  totalProducts: number;
}

interface RecentOrder {
  id: string;
  orderNumber: string;
  total: number;
  status: string;
  createdAt: string;
  user: {
    name: string;
  };
  _count: {
    items: number;
  };
}

interface LowStockProduct {
  id: string;
  name: string;
  stock: number;
  image: string;
}

export default function AdminStatsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [lowStock, setLowStock] = useState<LowStockProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((res) => res.json())
      .then((data) => {
        setStats(data.stats);
        setRecentOrders(data.recentOrders || []);
        setLowStock(data.lowStockProducts || []);
      })
      .catch(() => setError("Failed to load dashboard stats"))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !stats) {
    return (
      <div className="flex justify-center items-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold">Business Overview</h2>
        </div>
        <p className="text-center text-destructive py-16">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold">Business Overview</h2>
        <p className="text-xs text-muted-foreground mt-1">Real-time metrics for UrbanCart store activities</p>
      </div>

      {/* Grid of Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Revenue */}
        <div className="rounded-xl border border-border bg-card p-5 flex items-center gap-4 shadow-sm">
          <div className="rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 p-3">
            <IndianRupee className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Revenue</p>
            <p className="text-lg font-bold">{formatPrice(stats.totalRevenue)}</p>
          </div>
        </div>

        {/* Orders */}
        <div className="rounded-xl border border-border bg-card p-5 flex items-center gap-4 shadow-sm">
          <div className="rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 p-3">
            <ShoppingCart className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Orders</p>
            <p className="text-lg font-bold">{stats.totalOrders}</p>
          </div>
        </div>

        {/* Customers */}
        <div className="rounded-xl border border-border bg-card p-5 flex items-center gap-4 shadow-sm">
          <div className="rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 p-3">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Customers</p>
            <p className="text-lg font-bold">{stats.totalUsers}</p>
          </div>
        </div>

        {/* Products */}
        <div className="rounded-xl border border-border bg-card p-5 flex items-center gap-4 shadow-sm">
          <div className="rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 p-3">
            <Package className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Products</p>
            <p className="text-lg font-bold">{stats.totalProducts}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Orders List */}
        <div className="border border-border rounded-xl p-5 bg-card space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Recent Orders</h3>
            <Link href="/admin/orders">
              <Button variant="ghost" size="xs">View All</Button>
            </Link>
          </div>

          <div className="space-y-3">
            {recentOrders.length === 0 ? (
              <p className="text-center text-xs text-muted-foreground py-8">No orders placed yet.</p>
            ) : (
              recentOrders.map((o) => (
                <div key={o.id} className="flex justify-between items-center text-xs border-b border-border pb-2 last:border-0 last:pb-0">
                  <div>
                    <p className="font-bold">{o.orderNumber}</p>
                    <p className="text-[10px] text-muted-foreground">{o.user.name} • {o._count.items} items</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatPrice(o.total)}</p>
                    <span className="inline-block text-[9px] font-bold text-muted-foreground capitalize">{o.status.toLowerCase()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="border border-border rounded-xl p-5 bg-card space-y-4">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Low-Stock Alerts</h3>
          </div>

          <div className="space-y-3">
            {lowStock.length === 0 ? (
              <p className="text-center text-xs text-green-600 font-medium py-8">🎉 All products are sufficiently stocked!</p>
            ) : (
              lowStock.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-3 text-xs border-b border-border pb-2 last:border-0 last:pb-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <img src={p.image} alt={p.name} className="h-8 w-8 object-cover rounded bg-muted flex-shrink-0" />
                    <p className="font-semibold truncate">{p.name}</p>
                  </div>
                  <span className={`font-bold px-2 py-0.5 rounded ${p.stock === 0 ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"}`}>
                    {p.stock === 0 ? "Out of Stock" : `${p.stock} Left`}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
