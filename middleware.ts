import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const isAuthPath = req.nextUrl.pathname.startsWith("/auth");
  const sessionCookie = req.cookies.get("tudu3_session");

  if (!isAuthPath && !sessionCookie) {
    const url = req.nextUrl.clone();
    url.pathname = "/auth";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next|static|favicon.ico).*)"],
};


