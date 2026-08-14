export function AuthError({ message }: { message?: string }) {
  if (!message) return null;

  return (
    <p
      role="alert"
      className="mt-4 rounded-md border border-danger-border bg-danger-muted px-3 py-2 text-sm text-danger"
    >
      {message}
    </p>
  );
}
