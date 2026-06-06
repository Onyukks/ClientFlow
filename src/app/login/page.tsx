import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { loginAction } from "./actions";

type LoginPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await auth();

  if (session?.user) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const hasError = Boolean(params?.error);
  const demoEmail = process.env.DEMO_USER_EMAIL || "demo@clientflow.app";
  const demoPassword = process.env.DEMO_USER_PASSWORD || "ChangeMe123!";

  return (
    <main className="grid min-h-screen bg-[#f4f7fb] text-[#10231b] lg:grid-cols-[minmax(0,0.95fr)_minmax(420px,0.65fr)]">
      <section className="hidden min-h-screen bg-[#10231b] px-10 py-10 text-white lg:flex lg:flex-col">
        <Link className="flex items-center gap-3" href="/">
          <span className="grid h-11 w-11 place-items-center rounded-lg bg-white text-sm font-black text-[#10231b]">
            CF
          </span>
          <span>
            <span className="block text-xl font-black">ClientFlow</span>
            <span className="text-sm font-medium text-[#9fb5aa]">SaaS CRM</span>
          </span>
        </Link>

        <div className="mt-auto max-w-2xl">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#9fb5aa]">Demo access</p>
          <h1 className="mt-4 text-5xl font-black tracking-tight">Log into a seeded CRM workspace.</h1>
          <p className="mt-5 text-lg leading-8 text-[#c8d8d0]">
            The account opens with sample clients, deals, tasks, activity, and subscription data already loaded from
            Neon Postgres.
          </p>
          <div className="mt-8 grid max-w-xl gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-[#9fb5aa]">Database</p>
              <p className="mt-2 text-2xl font-black">PostgreSQL</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-[#9fb5aa]">Auth</p>
              <p className="mt-2 text-2xl font-black">Credentials</p>
            </div>
          </div>
        </div>
      </section>

      <section className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-6">
        <div className="w-full max-w-md">
          <Link className="mb-8 flex items-center gap-3 lg:hidden" href="/">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-[#10231b] text-sm font-black text-white">
              CF
            </span>
            <span>
              <span className="block text-lg font-black">ClientFlow</span>
              <span className="text-sm font-medium text-[#66756c]">SaaS CRM</span>
            </span>
          </Link>

          <div className="rounded-lg border border-[#d9e2dc] bg-white p-5 shadow-sm sm:p-6">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#66756c]">Welcome back</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight">Sign in</h2>
              <p className="mt-2 text-sm font-medium text-[#66756c]">Use the demo account to view the CRM dashboard.</p>
            </div>

            <div className="mt-5 rounded-lg border border-emerald-100 bg-emerald-50 p-4 text-sm">
              <p className="font-black text-emerald-800">Demo credentials</p>
              <p className="mt-2 font-medium text-emerald-700">{demoEmail}</p>
              <p className="font-medium text-emerald-700">{demoPassword}</p>
            </div>

            {hasError ? (
              <p className="mt-4 rounded-lg border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
                The email or password is incorrect.
              </p>
            ) : null}

            <form action={loginAction} className="mt-6 space-y-4">
              <div>
                <label className="text-sm font-black text-[#10231b]" htmlFor="email">
                  Email
                </label>
                <input
                  className="mt-2 h-12 w-full rounded-lg border border-[#d9e2dc] bg-[#f8faf7] px-4 text-sm font-semibold outline-none ring-0 transition focus:border-[#10231b]"
                  defaultValue={demoEmail}
                  id="email"
                  name="email"
                  required
                  type="email"
                />
              </div>

              <div>
                <label className="text-sm font-black text-[#10231b]" htmlFor="password">
                  Password
                </label>
                <input
                  className="mt-2 h-12 w-full rounded-lg border border-[#d9e2dc] bg-[#f8faf7] px-4 text-sm font-semibold outline-none ring-0 transition focus:border-[#10231b]"
                  defaultValue={demoPassword}
                  id="password"
                  name="password"
                  required
                  type="password"
                />
              </div>

              <button className="h-12 w-full rounded-lg bg-[#10231b] px-5 text-sm font-black text-white shadow-sm hover:bg-[#1f3a2f]">
                Sign in to dashboard
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
