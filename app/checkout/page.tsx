"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { HeaderClient } from "@/components/header-client";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { formatPrice } from "@/lib/utils";
import { Loader2, CreditCard, Plus, Check } from "lucide-react";

interface Address {
  id: string;
  label: string | null;
  fullName: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

interface CartItem {
  id: string;
  quantity: number;
  product: {
    name: string;
    price: number;
    image: string;
  };
  variant: {
    value: string;
    priceAdd: number;
  } | null;
}

interface Cart {
  items: CartItem[];
}

export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState<Cart | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [couponCode, setCouponCode] = useState("");

  // Address Form State
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [label, setLabel] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [savingAddress, setSavingAddress] = useState(false);

  useEffect(() => {
    // Load Razorpay Script
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);

    // Fetch Cart & Addresses
    Promise.all([
      fetch("/api/cart").then((res) => res.json()),
      fetch("/api/addresses").then((res) => res.json()),
    ])
      .then(([cartData, addressData]) => {
        if (!cartData.items || cartData.items.length === 0) {
          toast.error("Your cart is empty");
          router.push("/cart");
          return;
        }
        setCart(cartData);
        setAddresses(addressData || []);

        const defaultAddr = addressData?.find((addr: Address) => addr.isDefault);
        if (defaultAddr) {
          setSelectedAddressId(defaultAddr.id);
        } else if (addressData?.length > 0) {
          setSelectedAddressId(addressData[0].id);
        }
      })
      .catch(() => toast.error("Failed to load checkout details"))
      .finally(() => setLoading(false));

    return () => {
      document.body.removeChild(script);
    };
  }, [router]);

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAddress(true);

    try {
      const res = await fetch("/api/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label,
          fullName,
          phone,
          line1,
          line2: line2 || null,
          city,
          state,
          postalCode,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setAddresses((prev) => [...prev, data]);
        setSelectedAddressId(data.id);
        setShowAddressForm(false);
        toast.success("Address added successfully!");

        // Reset form
        setLabel("");
        setFullName("");
        setPhone("");
        setLine1("");
        setLine2("");
        setCity("");
        setState("");
        setPostalCode("");
      } else {
        toast.error(data.error || "Failed to save address");
      }
    } catch {
      toast.error("Failed to save address");
    } finally {
      setSavingAddress(false);
    }
  };

  const handleCheckout = async () => {
    if (!selectedAddressId) {
      toast.error("Please select a delivery address");
      return;
    }
    setPlacingOrder(true);

    try {
      // 1. Create order on backend (returns Razorpay order details)
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          addressId: selectedAddressId,
          couponCode: couponCode || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Checkout failed");
        setPlacingOrder(false);
        return;
      }

      // 2. Open Razorpay Checkout modal
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || data.key,
        amount: data.amount,
        currency: data.currency,
        name: "UrbanCart",
        description: `Order ${data.orderNumber}`,
        order_id: data.razorpayOrderId,
        handler: async function (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) {
          setPlacingOrder(true);
          toast.loading("Verifying payment...");

          // 3. Verify payment on backend
          try {
            const verifyRes = await fetch("/api/checkout/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            toast.dismiss();
            const verifyData = await verifyRes.json();

            if (verifyRes.ok) {
              toast.success("Payment successful! Order placed.");
              router.push(`/orders/${verifyData.orderNumber}`);
            } else {
              toast.error(verifyData.error || "Payment verification failed");
              router.push("/orders");
            }
          } catch {
            toast.dismiss();
            toast.error("Network error during payment verification");
            router.push("/orders");
          } finally {
            setPlacingOrder(false);
          }
        },
        prefill: {
          name: addresses.find((a) => a.id === selectedAddressId)?.fullName || "",
          contact: addresses.find((a) => a.id === selectedAddressId)?.phone || "",
        },
        theme: {
          color: "#1a1a1a",
        },
        modal: {
          ondismiss: function () {
            toast.info("Payment cancelled. Order remains pending.");
            router.push("/orders");
          },
        },
      };

      const rzp1 = new (window as any).Razorpay(options);
      rzp1.open();
    } catch {
      toast.error("Checkout initialization failed");
    } finally {
      setPlacingOrder(false);
    }
  };

  // Calculations
  const subtotal = cart?.items.reduce((sum, item) => {
    const itemPrice = item.product.price + (item.variant?.priceAdd ?? 0);
    return sum + itemPrice * item.quantity;
  }, 0) ?? 0;

  const shipping = subtotal >= 50000 ? 0 : 4900;
  const tax = Math.floor(subtotal * 0.18);
  const total = subtotal + shipping + tax;

  if (loading) {
    return (
      <div className="min-h-screen">
        <HeaderClient />
        <div className="flex justify-center py-32">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <HeaderClient />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Checkout</h1>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left panel: Address Selection & Summary */}
          <div className="lg:col-span-2 space-y-6">
            {/* Delivery Address selection */}
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-lg">Select Delivery Address</h2>
                {!showAddressForm && (
                  <Button variant="outline" size="sm" onClick={() => setShowAddressForm(true)}>
                    <Plus className="h-4 w-4 mr-1" /> Add New
                  </Button>
                )}
              </div>

              {showAddressForm ? (
                <form onSubmit={handleAddAddress} className="space-y-4 border-t border-border pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground">Address Label (Home, Office)</label>
                      <Input placeholder="Home" value={label} onChange={(e) => setLabel(e.target.value)} required />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground">Full Name</label>
                      <Input placeholder="John Doe" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground">Phone Number</label>
                      <Input placeholder="9876543210" value={phone} onChange={(e) => setPhone(e.target.value)} required />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground">Postal Code (PIN)</label>
                      <Input placeholder="560001" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} required />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground">Address Line 1</label>
                    <Input placeholder="House No, Street, Area" value={line1} onChange={(e) => setLine1(e.target.value)} required />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground">Address Line 2 (Optional)</label>
                    <Input placeholder="Landmark, Suite" value={line2} onChange={(e) => setLine2(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground">City</label>
                      <Input placeholder="Bangalore" value={city} onChange={(e) => setCity(e.target.value)} required />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground">State</label>
                      <Input placeholder="Karnataka" value={state} onChange={(e) => setState(e.target.value)} required />
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end pt-2">
                    <Button variant="ghost" type="button" onClick={() => setShowAddressForm(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={savingAddress}>
                      {savingAddress ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Save Address
                    </Button>
                  </div>
                </form>
              ) : addresses.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  No saved addresses found. Please add a new delivery address above.
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {addresses.map((addr) => (
                    <div
                      key={addr.id}
                      onClick={() => setSelectedAddressId(addr.id)}
                      className={`relative rounded-xl border p-4 cursor-pointer transition-all hover:border-accent ${
                        selectedAddressId === addr.id
                          ? "border-primary bg-primary/5"
                          : "border-border bg-card"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="inline-block rounded bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                          {addr.label || "Address"}
                        </span>
                        {selectedAddressId === addr.id && (
                          <div className="rounded-full bg-primary p-0.5 text-primary-foreground">
                            <Check className="h-3 w-3" />
                          </div>
                        )}
                      </div>
                      <p className="font-bold text-sm">{addr.fullName}</p>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        {addr.line1}, {addr.line2 ? `${addr.line2}, ` : ""}{addr.city}, {addr.state} - {addr.postalCode}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2 font-medium">📞 {addr.phone}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cart Items Summary */}
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <h2 className="font-bold text-lg mb-4">Review Items</h2>
              <div className="divide-y divide-border">
                {cart?.items.map((item) => (
                  <div key={item.id} className="flex justify-between items-center py-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="h-12 w-12 rounded object-cover bg-muted"
                      />
                      <div>
                        <p className="font-medium text-sm line-clamp-1">{item.product.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {item.variant ? `${item.variant.value} | ` : ""}Qty: {item.quantity}
                        </p>
                      </div>
                    </div>
                    <span className="font-semibold text-sm">
                      {formatPrice((item.product.price + (item.variant?.priceAdd ?? 0)) * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right panel: Checkout total and Pay Button */}
          <div>
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm sticky top-24">
              <h2 className="font-bold text-lg mb-4">Payment Summary</h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? "FREE" : formatPrice(shipping)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>GST (18%)</span>
                  <span>{formatPrice(tax)}</span>
                </div>
                <hr className="border-border my-2" />
                <div className="flex justify-between font-bold text-base">
                  <span>Grand Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>

              {/* Optional Coupon Apply Note */}
              <div className="mt-4">
                <label className="text-xs font-semibold text-muted-foreground">Promo Code / Coupon</label>
                <Input
                  placeholder="WELCOME10"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="mt-1 uppercase text-sm"
                />
              </div>

              <Button
                className="w-full mt-6 gap-2"
                onClick={handleCheckout}
                disabled={placingOrder || !selectedAddressId}
              >
                {placingOrder ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CreditCard className="h-4 w-4" />
                )}
                Pay Now
              </Button>

              <p className="text-[10px] text-center text-muted-foreground mt-4 leading-relaxed">
                By clicking &quot;Pay Now&quot;, you authorize Razorpay to process this transaction. Stock is reserved only on successful order confirmation.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
