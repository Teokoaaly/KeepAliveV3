import { updateSession } from "@/lib/supabase/middleware";
import { type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - api (API routes handle auth inside each endpoint)
     * - favicon.ico (favicon file)
     * - api/keepalive/cron (cron endpoint, authenticated via secret header)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
