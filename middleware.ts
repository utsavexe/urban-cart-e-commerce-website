import { auth } from "@/lib/auth-edge";
import { NextResponse } from "next/server";

// Routes that require authentication
const protectedRoutes = [
  "/account",
  "/orders",
  "/wishlist",
  "/checkout",
  "/addresses",
];

// Routes that require admin role
const adminRoutes = ["/admin"];

// Routes that should redirect authenticated users (e.g. login page)
const authRoutes = ["/login", "/register", "/forgot-password", "/reset-password"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  // Check if the current path matches any admin route
  const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route));
  if (isAdminRoute) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    if (req.auth?.user?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  }

  // Check if the current path matches any protected route
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );
  if (isProtectedRoute && !isLoggedIn) {
    const callbackUrl = encodeURIComponent(pathname);
    return NextResponse.redirect(
      new URL(`/login?callbackUrl=${callbackUrl}`, req.url)
    );
  }

  // Redirect authenticated users away from auth pages
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));
  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Match all routes except static files and API routes
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
