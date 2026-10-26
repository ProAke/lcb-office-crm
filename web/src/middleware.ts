import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/constants";

/**
 * เทียบเท่า .htaccess / if(!isset($_SESSION['user_id'])) header('Location: ...')
 * ที่เคยวางไว้บนสุดของทุกไฟล์ PHP
 */
export function middleware(request: NextRequest) {
  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE)?.value);

  if (!hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/line-rich-menu/:path*", "/plan/:path*"],
};
