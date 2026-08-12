/**
 * Stripe billing stubs — Phase 3 will replace these with real Checkout / Customer Portal.
 * Env vars are documented in `.env.example`; do not call these from product UI yet.
 */

export class StripeNotConfiguredError extends Error {
  constructor(message = "Stripe billing is not configured yet (Phase 3).") {
    super(message);
    this.name = "StripeNotConfiguredError";
  }
}

function requireStripeSecret(): string {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new StripeNotConfiguredError();
  }
  return key;
}

/** Placeholder — Phase 3 will create a Stripe Customer linked to `profiles.id`. */
export async function createCustomer(input: {
  email: string;
  name?: string;
  profileId: string;
}): Promise<{ customerId: string }> {
  void input;
  requireStripeSecret();
  throw new StripeNotConfiguredError("createCustomer is not implemented until Phase 3.");
}

/** Placeholder — Phase 3 Checkout Session for Pro / Team upgrades. */
export async function createCheckoutSession(input: {
  customerId: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<{ url: string }> {
  void input;
  requireStripeSecret();
  throw new StripeNotConfiguredError("createCheckoutSession is not implemented until Phase 3.");
}

/** Placeholder — Phase 3 Customer Portal for plan changes / cancellation. */
export async function createBillingPortalSession(input: {
  customerId: string;
  returnUrl: string;
}): Promise<{ url: string }> {
  void input;
  requireStripeSecret();
  throw new StripeNotConfiguredError(
    "createBillingPortalSession is not implemented until Phase 3.",
  );
}
