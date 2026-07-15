"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Search, Package, MapPin, Truck, Check } from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  product: {
    name: string;
    image: string;
  };
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  createdAt: string;
  total: number;
  address: {
    fullName: string;
    line1: string;
    city: string;
    state: string;
    postalCode: string;
  } | null;
  items: OrderItem[];
}

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber.trim()) return;
    setLoading(true);
    setOrder(null);

    try {
      const res = await fetch(`/api/orders/${orderNumber.trim()}`);
      const data = await res.json();

      if (res.ok) {
        setOrder(data);
      } else {
        toast.error(data.error || "Order not found");
      }
    } catch {
      toast.error("Failed to track order");
    } finally {
      setLoading(false);
    }
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
        <h1 className="text-2xl font-bold">Track Your Order</h1>
        <p className="text-sm text-muted-foreground mt-1">Enter your order number to track shipment progress</p>
      </div>

      <form onSubmit={handleTrack} className="flex gap-2 max-w-md">
        <Input
          placeholder="e.g. UC-20260715-ABCD"
          value={orderNumber}
          onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
          className="uppercase"
        />
        <Button type="submit" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4 mr-1" />}
          Track
        </Button>
      </form>

      {order && (
        <div className="border border-border rounded-xl p-6 bg-card space-y-6 shadow-sm mt-8">
          <div className="flex flex-wrap justify-between items-center gap-2 border-b border-border pb-4">
            <div>
              <p className="text-xs text-muted-foreground font-semibold">Order Number</p>
              <p className="text-base font-bold">{order.orderNumber}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-semibold">Order Date</p>
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

          {/* Tracker bar */}
          <div className="grid grid-cols-4 gap-2 text-center text-xs mt-4">
            <div className="space-y-2">
              <div className={`h-2 rounded-full ${order.status !== "PENDING" && order.status !== "CANCELLED" ? "bg-primary" : "bg-muted"}`} />
              <p className="font-semibold text-muted-foreground">Order Placed</p>
            </div>
            <div className="space-y-2">
              <div className={`h-2 rounded-full ${["CONFIRMED", "SHIPPED", "DELIVERED"].includes(order.status) ? "bg-primary" : "bg-muted"}`} />
              <p className="font-semibold text-muted-foreground">Confirmed</p>
            </div>
            <div className="space-y-2">
              <div className={`h-2 rounded-full ${["SHIPPED", "DELIVERED"].includes(order.status) ? "bg-primary" : "bg-muted"}`} />
              <p className="font-semibold text-muted-foreground">On the Way</p>
            </div>
            <div className="space-y-2">
              <div className={`h-2 rounded-full ${order.status === "DELIVERED" ? "bg-primary" : "bg-muted"}`} />
              <p className="font-semibold text-muted-foreground">Delivered</p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 mt-6 pt-4 border-t border-border">
            {/* Delivery address details */}
            <div className="space-y-2 text-sm">
              <h3 className="font-bold flex items-center gap-1"><MapPin className="h-4 w-4 text-muted-foreground" /> Shipping To</h3>
              {order.address ? (
                <div className="text-xs text-muted-foreground space-y-0.5 leading-relaxed">
                  <p className="font-bold text-foreground">{order.address.fullName}</p>
                  <p>{order.address.line1}</p>
                  <p>{order.address.city}, {order.address.state} - {order.address.postalCode}</p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Address not available.</p>
              )}
            </div>

            {/* Shipment contents */}
            <div className="space-y-2 text-sm">
              <h3 className="font-bold flex items-center gap-1"><Package className="h-4 w-4 text-muted-foreground" /> Package Contents</h3>
              <div className="space-y-2">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-xs text-muted-foreground">
                    <span>{item.product.name} (x{item.quantity})</span>
                    <span>{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
