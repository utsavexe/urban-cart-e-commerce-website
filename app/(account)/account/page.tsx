"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, ShieldCheck, Mail, Calendar, Phone } from "lucide-react";

export default function AccountProfilePage() {
  const { data: session, update } = useSession();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [updating, setUpdating] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user) {
      setName(session.user.name || "");
      // Fetch phone and other details from db
      fetch("/api/addresses") // quick api check
        .then(() => {
          // just mock load phone for visual wiring or keep blank
          setPhone("");
        })
        .finally(() => setLoading(false));
    }
  }, [session]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);

    try {
      // In a real application, you'd call a profile update endpoint.
      // We will mock-save and update the Auth.js session token.
      await update({ name });
      toast.success("Profile updated successfully!");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setUpdating(false);
    }
  };

  if (loading || !session?.user) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Profile</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your account information and preferences</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Full Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              required
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground">Phone Number</label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="9876543210"
              className="mt-1"
            />
          </div>

          <Button type="submit" disabled={updating}>
            {updating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Save Changes
          </Button>
        </form>

        {/* Security / Metadata Panel */}
        <div className="rounded-xl bg-muted/40 p-6 space-y-4 border border-border">
          <h2 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Account Info</h2>

          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-[10px] text-muted-foreground font-semibold">Email Address</p>
                <p className="font-medium">{session.user.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-[10px] text-muted-foreground font-semibold">Account Role</p>
                <p className="font-medium capitalize">{session.user.role || "User"}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-[10px] text-muted-foreground font-semibold">Security</p>
                <p className="font-medium text-xs text-accent">Two-factor authentication is disabled</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
