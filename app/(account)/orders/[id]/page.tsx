"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Star, HelpCircle } from "lucide-react";
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

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  // Review Dialog State
  const [activeReviewProductId, setActiveReviewProductId] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    fetch(`/api/orders/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          toast.error("Order not found");
          router.push("/orders");
          return;
        }
        setOrder(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id, router]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeReviewProductId) return;
    setSubmittingReview(true);

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: activeReviewProductId,
          rating,
          title: reviewTitle || undefined,
          comment: reviewComment || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Review submitted! Thank you.");
        setActiveReviewProductId(null);
        setReviewTitle("");
        setReviewComment("");
      } else {
        toast.error(data.error || "Failed to submit review");
      }
    } catch {
      toast.error("Failed to submit review");
    } finally {
      setSubmittingReview(false);
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
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/orders">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold">Order Details</h1>
          <p className="text-xs text-muted-foreground">Order Number: {order.orderNumber}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Order Details Left Side (Items and details) */}
        <div className="md:col-span-2 space-y-6">
          {/* Status Tracker */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-semibold text-muted-foreground">Status</span>
              <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${getStatusColor(order.status)}`}>
                {order.status}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center text-xs mt-6">
              <div className="space-y-2">
                <div className={`h-2 rounded-full ${order.status !== "PENDING" && order.status !== "CANCELLED" ? "bg-primary" : "bg-muted"}`} />
                <p className="font-semibold text-muted-foreground">Placed</p>
              </div>
              <div className="space-y-2">
                <div className={`h-2 rounded-full ${["CONFIRMED", "SHIPPED", "DELIVERED"].includes(order.status) ? "bg-primary" : "bg-muted"}`} />
                <p className="font-semibold text-muted-foreground">Confirmed</p>
              </div>
              <div className="space-y-2">
                <div className={`h-2 rounded-full ${["SHIPPED", "DELIVERED"].includes(order.status) ? "bg-primary" : "bg-muted"}`} />
                <p className="font-semibold text-muted-foreground">Shipped</p>
              </div>
              <div className="space-y-2">
                <div className={`h-2 rounded-full ${order.status === "DELIVERED" ? "bg-primary" : "bg-muted"}`} />
                <p className="font-semibold text-muted-foreground">Delivered</p>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
            <h2 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Items</h2>
            <div className="divide-y divide-border">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between items-center py-4">
                  <div className="flex items-center gap-3">
                    <img src={item.product.image} alt={item.product.name} className="h-12 w-12 rounded object-cover bg-muted" />
                    <div>
                      <p className="font-medium text-sm line-clamp-1">{item.product.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {item.variant ? `${item.variant.value} | ` : ""}Qty: {item.quantity}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-semibold text-sm">
                      {formatPrice(item.price * item.quantity)}
                    </span>

                    {/* Write Review Button (only if order is Delivered) */}
                    {order.status === "DELIVERED" && (
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => setActiveReviewProductId(item.product.id)}
                      >
                        Write Review
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Order Details Right Side (Address and totals) */}
        <div className="space-y-6">
          {/* Shipping Address */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h2 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-3">Shipping Address</h2>
            {order.address ? (
              <div className="text-sm space-y-1">
                <p className="font-bold">{order.address.fullName}</p>
                <p className="text-muted-foreground">{order.address.line1}</p>
                {order.address.line2 && <p className="text-muted-foreground">{order.address.line2}</p>}
                <p className="text-muted-foreground">
                  {order.address.city}, {order.address.state} - {order.address.postalCode}
                </p>
                <p className="text-muted-foreground font-medium pt-2">📞 {order.address.phone}</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No address information available.</p>
            )}
          </div>

          {/* Payment info */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h2 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-3">Payment Info</h2>
            <div className="text-sm space-y-2">
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
              <div className="flex justify-between text-muted-foreground">
                <span className="text-muted-foreground">Shipping</span>
                <span>{order.shipping === 0 ? "FREE" : formatPrice(order.shipping)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>GST (18%)</span>
                <span>{formatPrice(order.tax)}</span>
              </div>
              <hr className="border-border my-2" />
              <div className="flex justify-between font-bold text-base">
                <span>Grand Total</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Review Dialog overlay */}
      {activeReviewProductId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md space-y-4 shadow-xl">
            <h2 className="font-bold text-lg">Leave a Review</h2>
            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Rating</label>
                <div className="flex gap-2 mt-1">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setRating(num)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star className={`h-6 w-6 ${num <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Title (Optional)</label>
                <Input placeholder="Sum up your experience" value={reviewTitle} onChange={(e) => setReviewTitle(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Review Details</label>
                <textarea
                  placeholder="Tell us what you liked or disliked..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className="w-full mt-1 rounded-md border border-input bg-background p-3 text-sm"
                  rows={4}
                />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <Button variant="ghost" type="button" onClick={() => setActiveReviewProductId(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submittingReview}>
                  {submittingReview ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Submit Review
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
