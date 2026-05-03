import { jwtVerify } from "jose";
import { NextResponse, type NextRequest } from "next/server";

const COOKIE_NAME = "brand-archetypes-admin";
const ALG = "HS256";

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow the login page and login API through
  if (pathname === "/admin/login" || pathname === "/api/admin/login") {
    return NextResponse.next();
  }

  const token = req.cookies.get(COOKIE_NAME)?.value;
  const secret = process.env.SESSION_SECRET;

  if (!token || !secret) {
    return reject(req);
  }

  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secret),
      { algorithms: [ALG] },
    );
    if (payload.role !== "admin") return reject(req);
    return NextResponse.next();
  } catch {
    return reject(req);
  }
}

function reject(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const loginUrl = new URL("/admin/login", req.url);
  if (req.nextUrl.pathname !== "/admin") {
    loginUrl.searchParams.set("from", req.nextUrl.pathname);
  }
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
