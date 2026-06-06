import Link from "next/link";
import { auth } from "@/auth";

const features = [
  "Workspace CRM",
  "Deal pipeline",
  "Task tracking",
  "Seeded demo data",
];

export default async function Home() {
  const session = await auth();
  const primaryHref = session?.user ? "/dashboard" : "/login";
  const primaryText = session?.user ? "Open dashboard" : "View demo";

  return (
    <main className="min-h-screen bg-[#f4f7fb] text-[#10231b]">
      <section className="grid min-h-screen lg:grid-cols-[minmax(0,0.95fr)_minmax(440px,0.75fr)]">
        <div className="flex flex-col px-4 py-6 sm:px-6 lg:px-10">
          <nav className="flex items-center justify-between gap-4">
            <Link className="flex items-center gap-3" href="/">
              <span className="grid h-11 w-11 place-items-center rounded-lg bg-[#10231b] text-sm font-black text-white">
                CF
              </span>
              <span>
                <span className="block text-xl font-black tracking-tight">ClientFlow</span>
                <span className="text-sm font-semibold text-[#66756c]">SaaS CRM</span>
              </span>
            </Link>
            <Link
              className="rounded-lg border border-[#d9e2dc] bg-white px-4 py-2.5 text-sm font-black text-[#10231b] shadow-sm hover:bg-[#f8faf7]"
              href={primaryHref}
            >
              {primaryText}
            </Link>
          </nav>

          <div className="flex flex-1 items-center py-12">
            <div className="max-w-4xl">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#66756c]">Portfolio SaaS project</p>
              <h1 className="mt-5 max-w-3xl text-5xl font-black tracking-tight sm:text-6xl lg:text-7xl">
                A real CRM dashboard built on a production-style stack.
              </h1>
              <p className="mt-6 max-w-2xl text-lg font-medium leading-8 text-[#536258]">
                ClientFlow shows full-stack SaaS architecture with Next.js, TypeScript, Prisma, Neon Postgres,
                Auth.js, seeded demo data, and a billing-ready workspace model.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  className="rounded-lg bg-[#10231b] px-5 py-3 text-center text-sm font-black text-white shadow-sm hover:bg-[#1f3a2f]"
                  href={primaryHref}
                >
                  {primaryText}
                </Link>
                <a
                  className="rounded-lg border border-[#d9e2dc] bg-white px-5 py-3 text-center text-sm font-black text-[#10231b] shadow-sm hover:bg-[#f8faf7]"
                  href="https://github.com/Onyukks/ClientFlow"
                  rel="noreferrer"
                  target="_blank"
                >
                  Source code
                </a>
              </div>

              <div className="mt-10 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {features.map((feature) => (
                  <div key={feature} className="rounded-lg border border-[#d9e2dc] bg-white p-4 shadow-sm">
                    <p className="text-sm font-black text-[#10231b]">{feature}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <aside className="bg-[#10231b] p-4 text-white sm:p-6 lg:min-h-screen lg:p-8">
          <div className="flex h-full flex-col justify-center">
            <div className="rounded-lg border border-white/10 bg-white/5 p-4 shadow-2xl sm:p-5">
              <div className="rounded-lg bg-white p-5 text-[#10231b]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-[#66756c]">Pipeline value</p>
                    <p className="mt-2 text-4xl font-black">$128,400</p>
                  </div>
                  <span className="rounded-lg bg-emerald-50 px-3 py-1 text-sm font-black text-emerald-700">
                    +12.8%
                  </span>
                </div>
                <div className="mt-6 grid grid-cols-7 items-end gap-2">
                  {[48, 62, 40, 76, 58, 88, 70].map((height, index) => (
                    <div key={height + index} className="flex h-28 items-end rounded-lg bg-[#f4f7fb] px-1.5">
                      <div
                        className={`w-full rounded-md ${
                          index % 3 === 0 ? "bg-blue-500" : index % 3 === 1 ? "bg-emerald-500" : "bg-amber-400"
                        }`}
                        style={{ height: `${height}%` }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-white/10 bg-[#173729] p-4">
                  <p className="text-sm font-semibold text-[#9fb5aa]">Active clients</p>
                  <p className="mt-2 text-3xl font-black">42</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-[#173729] p-4">
                  <p className="text-sm font-semibold text-[#9fb5aa]">Open tasks</p>
                  <p className="mt-2 text-3xl font-black">18</p>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}
