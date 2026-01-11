// web/src/middleware.ts
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

async function getSupabaseProfile(req: NextRequest, res: NextResponse) {
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

  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id;

  if (!userId) return { userId: null as string | null, profile: null as any };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_dev, is_active")
    .eq("id", userId)
    .single();

  return { userId, profile };
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only handle routes we care about
  const isDevRoute = pathname.startsWith("/app/dev");
  const isAdminRoute = pathname.startsWith("/app/admin");

  if (!isDevRoute && !isAdminRoute) return NextResponse.next();

  let res = NextResponse.next();
  const { userId, profile } = await getSupabaseProfile(req, res);

  // Not logged in
  if (!userId) {
    const url = req.nextUrl.clone();
    url.pathname = isDevRoute ? "/dev-login" : "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Inactive user
  if (!profile || profile.is_active === false) {
    return NextResponse.rewrite(new URL("/404", req.url));
  }

  // DEV routes: only is_dev
  if (isDevRoute) {
    if (!profile.is_dev) return NextResponse.rewrite(new URL("/404", req.url));
    return res;
  }

  // ADMIN routes: only club_admin AND not is_dev
  if (isAdminRoute) {
    if (profile.is_dev) return NextResponse.rewrite(new URL("/404", req.url));
    if (profile.role !== "club_admin") return NextResponse.rewrite(new URL("/404", req.url));
    return res;
  }

  return res;
}

export const config = {
  matcher: ["/app/dev/:path*", "/app/admin/:path*"],
};
