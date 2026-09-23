import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth/config";

/**
 * Première barrière : /admin et /management exigent une session valide.
 * Les permissions fines (RBAC) sont revérifiées dans chaque page et action ;
 * le rôle interne, lui, est relu en base par la mise en page de /management.
 */
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = Boolean(req.auth?.user);

  if ((pathname.startsWith("/admin") || pathname.startsWith("/management")) && !isLoggedIn) {
    const url = new URL("/connexion", req.nextUrl.origin);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  if (pathname === "/connexion" && isLoggedIn) {
    return NextResponse.redirect(new URL("/admin", req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/management/:path*", "/connexion"],
};
