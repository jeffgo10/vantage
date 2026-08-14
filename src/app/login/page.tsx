import Link from "next/link";
import { AuthError } from "@/components/auth/auth-error";
import { AuthMessage } from "@/components/auth/auth-message";
import { ResendConfirmationForm } from "@/components/auth/resend-confirmation-form";
import { BrandLogo } from "@/components/layout/brand-logo";
import { signIn } from "@/lib/auth/actions";
import {
  CHECK_EMAIL,
  needsConfirmationHelp,
  resolveLoginErrorMessage,
  resolveLoginSuccessMessage,
} from "@/lib/auth/login-messages";

export const metadata = {
  title: "Log in",
};

type PageProps = {
  searchParams: Promise<{
    error?: string;
    detail?: string;
    message?: string;
    email?: string;
    next?: string;
  }>;
};

export default async function LoginPage({ searchParams }: PageProps) {
  const { error, detail, message, email, next } = await searchParams;
  const confirmationHelp = needsConfirmationHelp(error) || message === CHECK_EMAIL;
  const errorMessage = confirmationHelp ? undefined : resolveLoginErrorMessage(error, detail);
  const successMessage = resolveLoginSuccessMessage(message);

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-16">
      <div className="page-rise w-full max-w-sm">
        <BrandLogo priority />
        <h1 className="mt-8 text-2xl font-semibold tracking-tight text-foreground">Welcome back</h1>
        <p className="mt-2 text-sm text-muted">Log in with your email and password.</p>

        <AuthMessage message={successMessage} tone="success" />
        <AuthError message={errorMessage} />
        <ResendConfirmationForm
          error={error}
          detail={detail}
          email={email}
          forceShow={message === CHECK_EMAIL}
        />

        <form className="mt-8 space-y-4" action={signIn}>
          {next ? <input type="hidden" name="next" value={next} /> : null}
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-foreground">Email</span>
            <input
              type="email"
              name="email"
              required
              defaultValue={email}
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
              autoComplete="current-password"
              className="w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-accent"
            />
          </label>
          <button
            type="submit"
            className="w-full rounded-md bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground hover:bg-accent-hover"
          >
            Continue
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          No account?{" "}
          <Link href="/signup" className="font-medium text-accent hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
