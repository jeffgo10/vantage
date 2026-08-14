export function AuthMessage({
  message,
  tone = "danger",
}: {
  message?: string;
  tone?: "danger" | "success";
}) {
  if (!message) return null;

  const styles =
    tone === "success"
      ? "border-accent/30 bg-accent/10 text-foreground"
      : "border-danger-border bg-danger-muted text-danger";

  return (
    <p role="status" className={`mt-4 rounded-md border px-3 py-2 text-sm ${styles}`}>
      {message}
    </p>
  );
}
