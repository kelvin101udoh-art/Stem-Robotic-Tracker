// web/src/middleware.ts
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

function isDevEmail(email?: string | null) {
  if (!email) return false;

  const allowlist = (process.env.DEV_EMAILS || "")
    .split(",")
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean);

  if (allowlist.length && allowlist.includes(email.toLowerCase())) return true;

  const domain = (process.env.DEV_EMAIL_DOMAIN || "").trim().toLowerCase();
  if (domain && email.toLowerCase().endsWith("@" + domain)) return true;

  return false;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ✅ Only protect /app/dev/*
  if (!pathname.startsWith("/app/dev")) {
    return NextResponse.next();
  }

  let res = NextResponse.next();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const supabase = createServerClient(url, anon, {
    cookies: {
      get(name: string) {
        return req.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: any) {
        res.cookies.set({ name, value, ...options });
      },
      remove(name: string, options: any) {
        res.cookies.set({ name, value: "", ...options });
      },
    },
  });

  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;

  // ✅ Not logged in → redirect to /dev-login
  if (!user) {
    const u = req.nextUrl.clone();
    u.pathname = "/dev-login";
    u.searchParams.set("next", pathname);
    return NextResponse.redirect(u);
  }

  // ✅ Strong check: profiles.is_dev must be true
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("is_dev")
    .eq("id", user.id)
    .single();

  const isDevFlag = !error && profile?.is_dev === true;

  // ✅ Fallback check: email allowlist
  const isDev = isDevFlag || isDevEmail(user.email);

  if (!isDev) {
    return NextResponse.rewrite(new URL("/404", req.url));
  }

  return res;
}

export const config = {
  matcher: ["/app/dev/:path*"],
};
