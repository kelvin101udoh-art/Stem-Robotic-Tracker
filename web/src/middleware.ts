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

  // Prepare a response we can attach cookie changes to
  let res = NextResponse.next();

  // Create Supabase SSR client (reads session from cookies)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
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
    }
  );

  const { data } = await supabase.auth.getUser();
  const email = data?.user?.email ?? null;

  // ✅ Not logged in → send to login
  if (!email) {
    const url = req.nextUrl.clone();
    url.pathname = "/login"; // change if your login route differs
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // ✅ Logged in but NOT developer → pretend it doesn't exist (best)
  if (!isDevEmail(email)) {
    // Option 1: show 404
    return NextResponse.rewrite(new URL("/404", req.url));

    // Option 2 (alternative): redirect to admin home
    // const url = req.nextUrl.clone();
    // url.pathname = "/app/admin";
    // return NextResponse.redirect(url);
  }

  // ✅ Developer allowed
  return res;
}

export const config = {
  matcher: ["/app/dev/:path*"],
};
