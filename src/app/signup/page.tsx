import Link from "next/link";
import { AuthError } from "@/components/auth/auth-error";
import { BrandLogo } from "@/components/layout/brand-logo";
import { signUp } from "@/lib/auth/actions";

export const metadata = {
  title: "Sign up",
};

type PageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function SignupPage({ searchParams }: PageProps) {
  const { error } = await searchParams;

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-16">
      <div className="page-rise w-full max-w-sm">
        <BrandLogo priority />
        <h1 className="mt-8 text-2xl font-semibold tracking-tight text-foreground">
          Create your account
        </h1>
        <p className="mt-2 text-sm text-muted">Start on the free tier — 2 active tours.</p>

        <AuthError message={error} />

        <form className="mt-8 space-y-4" action={signUp}>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-foreground">Name</span>
            <input
              name="name"
              required
              autoComplete="name"
              className="w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-accent"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-foreground">Email</span>
            <input
              type="email"
              name="email"
              required
              autoComplete="email"
              className="w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-accent"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-foreground">Password</span>
            <input
              type="password"
              name="password"
              required
              minLength={8}
              autoComplete="new-password"
              className="w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-accent"
            />
          </label>
          <button
            type="submit"
            className="w-full rounded-md bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground hover:bg-accent-hover"
          >
            Create account
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-accent hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
