"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowRight, ShoppingBag } from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface Order {
  id: string;
  orderNumber: string;
  total: number;
  status: string;
  createdAt: string;
  items: {
    id: string;
    quantity: number;
    price: number;
    product: {
      name: string;
      image: string;
    };
  }[];
}

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/orders")
      .then((res) => res.json())
      .then((data) => setOrders(data.orders || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

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

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Order History</h1>
        <p className="text-sm text-muted-foreground mt-1">Check the status of your orders, manage returns, and download receipts</p>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-16 bg-muted/10 rounded-xl border border-dashed p-8">
          <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-lg font-bold">No orders found</h2>
          <p className="text-muted-foreground text-sm mt-1 max-w-xs mx-auto">
            You haven&apos;t placed any orders yet. Start exploring our store to find your first favorite!
          </p>
          <Link href="/products" className="mt-4 inline-block">
            <Button size="sm">Shop Now</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="border border-border rounded-xl p-4 space-y-4 shadow-sm bg-card hover:shadow-md transition-shadow">
              <div className="flex flex-wrap justify-between items-center gap-2 border-b border-border pb-3">
                <div>
                  <p className="text-xs text-muted-foreground font-semibold">Order Number</p>
                  <p className="text-sm font-bold">{order.orderNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-semibold">Placed On</p>
                  <p className="text-sm font-medium">{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-semibold">Total Amount</p>
                  <p className="text-sm font-bold">{formatPrice(order.total)}</p>
                </div>
                <div>
                  <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>
              </div>

              {/* Order Items Mini Summary */}
              <div className="flex flex-wrap gap-4 items-center justify-between">
                <div className="flex flex-wrap gap-2">
                  {order.items.slice(0, 3).map((item) => (
                    <div key={item.id} className="h-12 w-12 rounded-lg overflow-hidden bg-muted border border-border flex-shrink-0" title={item.product.name}>
                      <img src={item.product.image} alt={item.product.name} className="h-full w-full object-cover" />
                    </div>
                  ))}
                  {order.items.length > 3 && (
                    <div className="h-12 w-12 rounded-lg bg-muted border border-border flex items-center justify-center text-xs font-bold text-muted-foreground">
                      +{order.items.length - 3}
                    </div>
                  )}
                </div>

                <Link href={`/orders/${order.orderNumber}`}>
                  <Button variant="ghost" size="sm" className="gap-1.5">
                    View Details <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
