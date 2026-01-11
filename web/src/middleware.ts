// web/src/middleware.ts
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (!pathname.startsWith("/app/dev")) return NextResponse.next();

  let res = NextResponse.next();

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

  // ✅ Must be logged in
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id;

  if (!userId) {
    const url = req.nextUrl.clone();
    url.pathname = "/dev-login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // ✅ Must be dev in DB
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("is_dev")
    .eq("id", userId)
    .single();

  if (error || !profile?.is_dev) {
    return NextResponse.rewrite(new URL("/404", req.url));
  }

  return res;
}

export const config = {
  matcher: ["/app/dev/:path*"],
};
