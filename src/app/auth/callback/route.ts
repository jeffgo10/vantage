import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function loginRedirect(origin: string, params: Record<string, string>) {
  const search = new URLSearchParams(params);
  return NextResponse.redirect(`${origin}/login?${search.toString()}`);
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";
  const error = searchParams.get("error");
  const errorCode = searchParams.get("error_code");
  const errorDescription = searchParams.get("error_description");

  if (code) {
    const supabase = await createClient();
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (!exchangeError) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Expired / invalid email confirmation links (query form; hash is handled client-side).
  if (errorCode === "otp_expired" || error === "access_denied") {
    return loginRedirect(origin, {
      error: "confirm_expired",
      ...(errorDescription
        ? { detail: errorDescription.replace(/\+/g, " ") }
        : {}),
    });
  }

  return loginRedirect(origin, { error: "confirm_failed" });
}
