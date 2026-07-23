import Link from "next/link";

export const metadata = {
  title: "Log in",
};

export default function LoginPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <Link href="/" className="text-xl font-semibold tracking-tight">
          RoamVantage
        </Link>
        <h1 className="mt-8 text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Supabase Auth (email + Google) wires up next. Placeholder form for now.
        </p>

        <form className="mt-8 space-y-4" action="/dashboard">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Email</span>
            <input
              type="email"
              name="email"
              required
              className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm outline-none focus:border-accent"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Password</span>
            <input
              type="password"
              name="password"
              required
              className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm outline-none focus:border-accent"
            />
          </label>
          <button
            type="submit"
            className="w-full rounded-md bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-[#185a3e]"
          >
            Continue
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-500">
          No account?{" "}
          <Link href="/signup" className="font-medium text-accent hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
