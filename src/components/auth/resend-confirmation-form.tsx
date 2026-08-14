"use client";

import { useEffect, useState } from "react";
import { resendSignupConfirmation } from "@/lib/auth/actions";
import {
  CONFIRM_EXPIRED,
  needsConfirmationHelp,
  resolveLoginErrorMessage,
} from "@/lib/auth/login-messages";

type Props = {
  /** From `?error=` — may be a code or a raw Supabase message. */
  error?: string;
  /** Optional human detail from callback (`?detail=`). */
  detail?: string;
  /** Prefill when known from signup / failed login. */
  email?: string;
  /** When true, always show the resend form (e.g. after signup). */
  forceShow?: boolean;
};

function parseHashAuthError(): { error?: string; detail?: string } {
  if (typeof window === "undefined") return {};
  const hash = window.location.hash.replace(/^#/, "");
  if (!hash) return {};

  const params = new URLSearchParams(hash);
  const errorCode = params.get("error_code");
  const error = params.get("error");
  const description = params.get("error_description")?.replace(/\+/g, " ");

  if (errorCode === "otp_expired" || error === "access_denied") {
    return {
      error: CONFIRM_EXPIRED,
      detail: description ?? undefined,
    };
  }

  return {};
}

function clearAuthHash() {
  if (!window.location.hash) return;
  const url = new URL(window.location.href);
  url.hash = "";
  window.history.replaceState(null, "", `${url.pathname}${url.search}`);
}

export function ResendConfirmationForm({
  error,
  detail,
  email: initialEmail = "",
  forceShow = false,
}: Props) {
  const [hashError, setHashError] = useState<string | undefined>();
  const [hashDetail, setHashDetail] = useState<string | undefined>();

  useEffect(() => {
    const fromHash = parseHashAuthError();
    if (fromHash.error) {
      setHashError(fromHash.error);
      setHashDetail(fromHash.detail);
      clearAuthHash();
    }
  }, []);

  const effectiveError = hashError ?? error;
  const effectiveDetail = hashDetail ?? detail;
  const show = forceShow || needsConfirmationHelp(effectiveError);

  if (!show) return null;

  const alertMessage = resolveLoginErrorMessage(effectiveError, effectiveDetail);

  return (
    <div className="mt-4 space-y-3">
      {alertMessage ? (
        <p
          role="alert"
          className="rounded-md border border-danger-border bg-danger-muted px-3 py-2 text-sm text-danger"
        >
          {alertMessage}
        </p>
      ) : null}

      <form action={resendSignupConfirmation} className="rounded-md border border-border p-3">
        <p className="text-sm font-medium text-foreground">Resend confirmation email</p>
        <p className="mt-1 text-xs text-muted">
          Enter the email you signed up with. Links expire after a short time.
        </p>
        <label className="mt-3 block">
          <span className="sr-only">Email</span>
          <input
            type="email"
            name="email"
            required
            defaultValue={initialEmail}
            autoComplete="email"
            placeholder="you@example.com"
            className="w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </label>
        <button
          type="submit"
          className="mt-3 w-full rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-elevated"
        >
          Send new link
        </button>
      </form>
    </div>
  );
}
