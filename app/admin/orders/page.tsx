"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search, Eye } from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface Order {
  id: string;
  orderNumber: string;
  total: number;
  status: string;
  createdAt: string;
  user: {
    name: string;
    email: string;
  };
  _count: {
    items: number;
  };
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchOrders = () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search);
    if (status) params.set("status", status);
    params.set("page", String(page));
    params.set("limit", "15");

    fetch(`/api/admin/orders?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setOrders(data.orders || []);
        setTotalPages(data.pagination?.totalPages || 1);
      })
      .catch(() => setError("Failed to load orders"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();
  }, [page, status, search]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "PLACED": return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "CONFIRMED": return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400";
      case "SHIPPED": return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400";
      case "DELIVERED": return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "CANCELLED": return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Manage Orders</h2>
        <p className="text-xs text-muted-foreground mt-1">Review shop orders, update preparation and tracking statuses</p>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="flex gap-2 max-w-md flex-1">
          <Input
            placeholder="Search order #, customer name/email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button type="submit">
            <Search className="h-4 w-4 mr-1" /> Find
          </Button>
        </form>

        <select
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value);
          }}
          className="rounded-md border border-input bg-background px-3 py-2 text-xs"
        >
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="PLACED">Placed</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="SHIPPED">Shipped</option>
          <option value="DELIVERED">Delivered</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <p className="text-center text-destructive py-16">{error}</p>
      ) : orders.length === 0 ? (
        <p className="text-center text-xs text-muted-foreground py-16">No orders found.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-muted/50 border-b border-border font-bold">
                <th className="p-3">Order Number</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Placed On</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-border hover:bg-muted/10 last:border-0">
                  <td className="p-3 font-semibold">{o.orderNumber}</td>
                  <td className="p-3">
                    <p className="font-medium">{o.user.name}</p>
                    <p className="text-[10px] text-muted-foreground">{o.user.email}</p>
                  </td>
                  <td className="p-3">{new Date(o.createdAt).toLocaleDateString()}</td>
                  <td className="p-3">{formatPrice(o.total)}</td>
                  <td className="p-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${getStatusColor(o.status)}`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <Link href={`/admin/orders/${o.orderNumber}`}>
                      <Button variant="outline" size="xs" className="h-7 gap-1">
                        <Eye className="h-3 w-3" /> View
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <Button size="xs" variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            Previous
          </Button>
          <span className="flex items-center text-[10px] text-muted-foreground px-2">
            Page {page} of {totalPages}
          </span>
          <Button size="xs" variant="outline" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
