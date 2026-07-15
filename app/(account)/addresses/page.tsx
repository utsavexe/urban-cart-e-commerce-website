"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Plus, MapPin, Check, Trash2 } from "lucide-react";

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

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddressForm, setShowAddressForm] = useState(false);

  // Form State
  const [label, setLabel] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [savingAddress, setSavingAddress] = useState(false);

  const fetchAddresses = () => {
    fetch("/api/addresses")
      .then((res) => res.json())
      .then((data) => setAddresses(data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

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
        setShowAddressForm(false);
        toast.success("Address added successfully!");

        // Reset Form
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

  const handleSetDefault = async (id: string) => {
    try {
      const res = await fetch(`/api/addresses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDefault: true }),
      });

      if (res.ok) {
        toast.success("Default address updated");
        fetchAddresses();
      } else {
        toast.error("Failed to update default address");
      }
    } catch {
      toast.error("Failed to update default address");
    }
  };

  const handleDeleteAddress = async (id: string) => {
    try {
      const res = await fetch(`/api/addresses/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Address deleted successfully!");
        fetchAddresses();
      } else {
        toast.error("Failed to delete address");
      }
    } catch {
      toast.error("Failed to delete address");
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Manage Addresses</h1>
          <p className="text-sm text-muted-foreground mt-1">Add, edit, or delete shipping addresses for checkout</p>
        </div>
        {!showAddressForm && (
          <Button onClick={() => setShowAddressForm(true)} size="sm">
            <Plus className="h-4 w-4 mr-1" /> Add Address
          </Button>
        )}
      </div>

      {showAddressForm ? (
        <div className="border border-border rounded-xl p-6 bg-card space-y-4">
          <h2 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Add New Address</h2>
          <form onSubmit={handleAddAddress} className="space-y-4">
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
        </div>
      ) : addresses.length === 0 ? (
        <div className="text-center py-16 bg-muted/10 rounded-xl border border-dashed p-8">
          <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-lg font-bold">No saved addresses</h2>
          <p className="text-muted-foreground text-sm mt-1 max-w-xs mx-auto">
            You don&apos;t have any saved shipping addresses yet. Add one to speed up checkout!
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={`relative rounded-xl border p-4 shadow-sm bg-card hover:shadow-md transition-all flex flex-col justify-between ${
                addr.isDefault ? "border-primary bg-primary/5" : "border-border"
              }`}
            >
              <div>
                <div className="flex justify-between items-start mb-2">
                  <span className="inline-block rounded bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                    {addr.label || "Address"}
                  </span>
                  {addr.isDefault ? (
                    <span className="text-[10px] text-green-700 font-bold bg-green-100 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded flex items-center gap-1">
                      <Check className="h-3 w-3" /> Default
                    </span>
                  ) : null}
                </div>
                <p className="font-bold text-sm">{addr.fullName}</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {addr.line1}, {addr.line2 ? `${addr.line2}, ` : ""}{addr.city}, {addr.state} - {addr.postalCode}
                </p>
                <p className="text-xs text-muted-foreground mt-2 font-medium">📞 {addr.phone}</p>
              </div>

              <div className="flex justify-end gap-2 border-t border-border mt-4 pt-3">
                {!addr.isDefault && (
                  <Button variant="ghost" size="xs" className="text-xs font-semibold" onClick={() => handleSetDefault(addr.id)}>
                    Set Default
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:bg-destructive/10 h-7 w-7"
                  onClick={() => handleDeleteAddress(addr.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
