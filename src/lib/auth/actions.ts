"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function emailRedirectTo() {
  return `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`;
}

export async function signUp(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!name || !email || !password) {
    redirect(`/signup?error=${encodeURIComponent("Name, email, and password are required.")}`);
  }

  if (password.length < 8) {
    redirect(`/signup?error=${encodeURIComponent("Password must be at least 8 characters.")}`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name },
      emailRedirectTo: emailRedirectTo(),
    },
  });

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }

  // Hosted Supabase requires email confirmation — no session until the link is clicked.
  if (!data.session) {
    const params = new URLSearchParams({
      message: "check_email",
      email,
    });
    redirect(`/login?${params.toString()}`);
  }

  redirect("/dashboard");
}

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const nextRaw = String(formData.get("next") ?? "").trim();
  const next = nextRaw.startsWith("/") && !nextRaw.startsWith("//") ? nextRaw : "/dashboard";

  if (!email || !password) {
    redirect(`/login?error=${encodeURIComponent("Email and password are required.")}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    const unconfirmed =
      error.message.toLowerCase().includes("email not confirmed") ||
      error.code === "email_not_confirmed";
    if (unconfirmed) {
      const params = new URLSearchParams({
        error: "email_not_confirmed",
        email,
      });
      redirect(`/login?${params.toString()}`);
    }
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  redirect(next);
}

export async function resendSignupConfirmation(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();

  if (!email) {
    redirect(`/login?error=${encodeURIComponent("Enter your email to resend confirmation.")}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: {
      emailRedirectTo: emailRedirectTo(),
    },
  });

  // Same response whether or not the user exists — avoid account enumeration.
  if (error && !error.message.toLowerCase().includes("rate limit")) {
    redirect(`/login?error=${encodeURIComponent(error.message)}&email=${encodeURIComponent(email)}`);
  }

  if (error) {
    redirect(
      `/login?error=${encodeURIComponent("Please wait a moment before requesting another email.")}&email=${encodeURIComponent(email)}`,
    );
  }

  const params = new URLSearchParams({
    message: "confirmation_resent",
    email,
  });
  redirect(`/login?${params.toString()}`);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
