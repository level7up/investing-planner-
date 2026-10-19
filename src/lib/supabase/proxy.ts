import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv } from "./env";

const AUTH_PAGES = ["/login", "/register"];
const PUBLIC_PREFIX = "/auth/";

function redirectKeepingCookies(request: NextRequest, source: NextResponse, pathname: string): NextResponse {
  const redirect = NextResponse.redirect(new URL(pathname, request.url));
  source.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  return redirect;
}

export async function updateSession(request: NextRequest): Promise<NextResponse> {
  const { url, key } = getSupabaseEnv();
  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet, headers) => {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers).forEach(([header, value]) => response.headers.set(header, value));
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const isSignedIn = Boolean(data?.claims?.sub);
  const { pathname } = request.nextUrl;
  const isAuthPage = AUTH_PAGES.includes(pathname);
  const isPublic = isAuthPage || pathname.startsWith(PUBLIC_PREFIX);

  if (!isSignedIn && !isPublic) return redirectKeepingCookies(request, response, "/login");
  if (isSignedIn && isAuthPage) return redirectKeepingCookies(request, response, "/");
  return response;
}
