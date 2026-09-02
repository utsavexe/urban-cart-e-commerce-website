"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, ArrowLeft, ShieldAlert, Truck, Mail } from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  product: {
    id: string;
    name: string;
    image: string;
  };
  variant: {
    value: string;
  } | null;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  createdAt: string;
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  user: {
    name: string;
    email: string;
    phone: string | null;
  };
  address: {
    fullName: string;
    phone: string;
    line1: string;
    line2: string | null;
    city: string;
    state: string;
    postalCode: string;
  } | null;
  items: OrderItem[];
}

export default function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    fetch(`/api/admin/orders/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
          return;
        }
        setOrder(data);
        setStatus(data.status);
      })
      .catch(() => setError("Failed to load order"))
      .finally(() => setLoading(false));
  }, [id, router]);

  const handleStatusChange = async (newStatus: string) => {
    if (!order) return;
    if (!confirm(`Change order status to "${newStatus}"?`)) {
      setStatus(order.status);
      return;
    }
    setUpdating(true);

    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus(newStatus);
        setOrder((prev) => prev ? { ...prev, status: newStatus } : null);
        toast.success(`Order status updated to "${newStatus}" and email notification sent.`);
      } else {
        toast.error(data.error || "Failed to update status");
      }
    } catch {
      toast.error("Failed to update status");
    } finally {
      setUpdating(false);
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

  if (loading) {
    return (
      <div className="flex justify-center items-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/admin/orders">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h2 className="text-xl font-bold">Order Details</h2>
        </div>
        <p className="text-center text-destructive py-16">{error}</p>
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/orders">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h2 className="text-xl font-bold">Order Details</h2>
          <p className="text-xs text-muted-foreground">Order Ref: {order.orderNumber}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Detail Left (Items and controls) */}
        <div className="md:col-span-2 space-y-6">
          {/* Status update controller */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm flex flex-wrap justify-between items-center gap-4">
            <div>
              <p className="text-xs text-muted-foreground font-semibold">Current Status</p>
              <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold mt-1 ${getStatusColor(order.status)}`}>
                {order.status}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <label className="text-xs font-semibold text-muted-foreground">Change Status</label>
              <select
                value={status}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={updating}
                className="rounded-md border border-input bg-background px-3 py-2 text-xs"
              >
                <option value="PENDING">Pending</option>
                <option value="PLACED">Placed</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="SHIPPED">Shipped</option>
                <option value="DELIVERED">Delivered</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
              {updating && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            </div>
          </div>

          {/* Ordered items */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Package Contents</h3>
            <div className="divide-y divide-border">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between items-center py-3">
                  <div className="flex items-center gap-3">
                    <img src={item.product.image} className="h-10 w-10 object-cover rounded bg-muted" alt={item.product.name} />
                    <div>
                      <p className="font-medium text-xs line-clamp-1">{item.product.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {item.variant ? `${item.variant.value} | ` : ""}Qty: {item.quantity}
                      </p>
                    </div>
                  </div>
                  <span className="font-semibold text-xs">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Detail Right (Customer, Delivery and financial details) */}
        <div className="space-y-6">
          {/* Customer Profile card */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-3 text-xs">
            <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Customer Profile</h3>
            <p><span className="text-muted-foreground">Name:</span> <strong className="text-foreground">{order.user.name}</strong></p>
            <p className="flex items-center gap-1"><Mail className="h-3 w-3 text-muted-foreground" /> {order.user.email}</p>
            {order.user.phone && <p>📞 {order.user.phone}</p>}
          </div>

          {/* Delivery destination details */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-3">Delivery Destination</h3>
            {order.address ? (
              <div className="text-xs space-y-1 leading-relaxed">
                <p className="font-bold">{order.address.fullName}</p>
                <p className="text-muted-foreground">{order.address.line1}</p>
                {order.address.line2 && <p className="text-muted-foreground">{order.address.line2}</p>}
                <p className="text-muted-foreground">
                  {order.address.city}, {order.address.state} - {order.address.postalCode}
                </p>
                <p className="text-muted-foreground font-medium pt-2">📞 {order.address.phone}</p>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No address info available.</p>
            )}
          </div>

          {/* Payment summary details */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-3">Financial Summary</h3>
            <div className="text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment Status</span>
                <span className={`font-semibold capitalize ${order.paymentStatus === "PAID" ? "text-green-600" : "text-yellow-600"}`}>
                  {order.paymentStatus.toLowerCase()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-accent">
                  <span>Discount</span>
                  <span>-{formatPrice(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span>{order.shipping === 0 ? "FREE" : formatPrice(order.shipping)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">GST (18%)</span>
                <span>{formatPrice(order.tax)}</span>
              </div>
              <hr className="border-border my-2" />
              <div className="flex justify-between font-bold text-sm">
                <span>Grand Total</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
