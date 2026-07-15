import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

/**
 * Get the current authenticated user from the session.
 * Returns null if not authenticated.
 */
export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

/**
 * Require authentication. Returns the user or throws a 401 response.
 * Use in API route handlers.
 */
export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }
  return user;
}

/**
 * Require admin role. Returns the user or throws a 403 response.
 * Use in admin API route handlers.
 */
export async function requireAdmin() {
  const user = await requireAuth();
  if (user.role !== "ADMIN") {
    throw NextResponse.json(
      { error: "Admin access required" },
      { status: 403 }
    );
  }
  return user;
}

/**
 * Wrapper for API route handlers that catches thrown NextResponse errors
 * from requireAuth/requireAdmin.
 */
export function withAuth<T>(
  handler: (user: { id: string; name?: string | null; email?: string | null; image?: string | null; role: string }) => Promise<T>
) {
  return async () => {
    try {
      const user = await requireAuth();
      return await handler(user);
    } catch (response) {
      if (response instanceof NextResponse) return response;
      throw response;
    }
  };
}

export function withAdmin<T>(
  handler: (user: { id: string; name?: string | null; email?: string | null; image?: string | null; role: string }) => Promise<T>
) {
  return async () => {
    try {
      const user = await requireAdmin();
      return await handler(user);
    } catch (response) {
      if (response instanceof NextResponse) return response;
      throw response;
    }
  };
}
