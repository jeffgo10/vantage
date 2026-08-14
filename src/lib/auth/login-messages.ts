/** Stable query `error` / `message` codes from auth actions + callback. */
export const CONFIRM_EXPIRED = "confirm_expired";
export const CONFIRM_FAILED = "confirm_failed";
export const EMAIL_NOT_CONFIRMED = "email_not_confirmed";
export const CHECK_EMAIL = "check_email";
export const CONFIRMATION_RESENT = "confirmation_resent";

const LEGACY_CONFIRM_FAILED = "Could not confirm email.";

export function needsConfirmationHelp(error?: string | null): boolean {
  if (!error) return false;
  return (
    error === CONFIRM_EXPIRED ||
    error === CONFIRM_FAILED ||
    error === EMAIL_NOT_CONFIRMED ||
    error === LEGACY_CONFIRM_FAILED ||
    error.toLowerCase().includes("email not confirmed") ||
    error.toLowerCase().includes("confirm email")
  );
}

export function resolveLoginErrorMessage(
  error?: string | null,
  detail?: string | null,
): string | undefined {
  if (!error) return undefined;

  switch (error) {
    case CONFIRM_EXPIRED:
      return (
        detail?.trim() ||
        "That confirmation link is invalid or has expired. Request a new email below."
      );
    case CONFIRM_FAILED:
      return "We couldn't confirm your email. Request a new confirmation email below.";
    case EMAIL_NOT_CONFIRMED:
      return "Confirm your email before logging in. Request a new confirmation email below.";
    case LEGACY_CONFIRM_FAILED:
      return "That confirmation link is invalid or has expired. Request a new email below.";
    default:
      return error;
  }
}

export function resolveLoginSuccessMessage(message?: string | null): string | undefined {
  if (!message) return undefined;

  switch (message) {
    case CHECK_EMAIL:
      return "Check your email for a confirmation link, then come back to log in.";
    case CONFIRMATION_RESENT:
      return "If an account exists for that email, we sent a new confirmation link.";
    default:
      return message;
  }
}
