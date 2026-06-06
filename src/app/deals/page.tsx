import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppShell } from "@/components/app-shell";
import { getDashboardData } from "@/lib/dashboard-data";
import { getDealsData } from "@/lib/deals-data";

export default async function DealsPage() {
  const session = await auth();

  if (!session?.user?.workspaceId) {
    redirect("/login");
  }

  const [dashboardData, dealsData] = await Promise.all([
    getDashboardData(session.user.workspaceId),
    getDealsData(session.user.workspaceId),
  ]);
  const topDeal = dealsData.deals[0];

  return (
    <AppShell
      activeItem="Deals"
      primaryActionLabel="Add client"
      summary={dashboardData.summary}
      title="Deals"
      userEmail={session.user.email ?? "demo@clientflow.app"}
      workspaceName={dashboardData.workspaceName}
    >
      <div className="w-full space-y-6 px-4 py-5 sm:px-6 lg:px-8 xl:px-10">
        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
          <article className="overflow-hidden rounded-lg border border-[#173729] bg-[#10231b] text-white shadow-sm">
            <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_310px]">
              <div className="min-w-0">
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#9fb5aa]">Revenue pipeline</p>
                <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
                  {dealsData.deals.length} opportunities tracked across active accounts.
                </h2>
                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                  {dealsData.metrics.slice(0, 3).map((metric) => (
                    <div className="border-l-2 border-emerald-400 pl-4" key={metric.label}>
                      <p className="text-2xl font-black">{metric.value}</p>
                      <p className="text-sm text-[#c8d8d0]">{metric.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="min-w-0 border-t border-white/10 pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#9fb5aa]">Next close</p>
                <h3 className="mt-3 text-2xl font-black">{topDeal?.title ?? "No deals yet"}</h3>
                <p className="mt-2 text-sm text-[#c8d8d0]">{topDeal?.clientName ?? "Create an opportunity"}</p>
                <div className="mt-6 grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-white/10 p-3">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#9fb5aa]">Value</p>
                    <p className="mt-2 text-2xl font-black">{topDeal?.value ?? "$0"}</p>
                  </div>
                  <div className="rounded-lg bg-white/10 p-3">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#9fb5aa]">Close</p>
                    <p className="mt-2 text-2xl font-black">{topDeal?.closeDate ?? "No date"}</p>
                  </div>
                </div>
              </div>
            </div>
          </article>

          <article className="rounded-lg border border-[#d9e2dc] bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-[#10231b]">Stage mix</h2>
                <p className="mt-1 text-sm font-medium text-[#66756c]">Open opportunities by stage</p>
              </div>
              <span className="rounded-lg bg-blue-50 px-3 py-1 text-sm font-black text-blue-700">
                {dealsData.deals.length} total
              </span>
            </div>

            <div className="mt-5 space-y-4">
              {dealsData.stageGroups.map((stage) => (
                <div key={stage.label}>
                  <div className="flex items-center justify-between gap-4 text-sm font-black text-[#10231b]">
                    <span>{stage.label}</span>
                    <span>{stage.totalValue}</span>
                  </div>
                  <div className="mt-2 h-3 overflow-hidden rounded-lg bg-[#edf0ee]">
                    <div
                      className="h-full rounded-lg bg-emerald-500"
                      style={{
                        width: `${Math.min(100, Math.max(8, Number(stage.count) * 25))}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {dealsData.metrics.map((metric) => (
            <article
              className="rounded-lg border border-[#d9e2dc] bg-white p-5 shadow-sm shadow-slate-200/60"
              key={metric.label}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-[#66756c]">{metric.label}</p>
                  <p className="mt-3 text-3xl font-black tracking-tight text-[#10231b]">{metric.value}</p>
                </div>
                <span className={`mt-1 h-3 w-3 shrink-0 rounded-full ${metric.accent}`} />
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-2">
                <span className={`rounded-lg px-2.5 py-1 text-xs font-black ${metric.tint}`}>{metric.change}</span>
                <span className="text-sm font-medium text-[#66756c]">{metric.note}</span>
              </div>
            </article>
          ))}
        </section>

        <section className="grid gap-4 xl:grid-cols-4">
          {dealsData.stageGroups.map((stage) => (
            <article className="rounded-lg border border-[#d9e2dc] bg-white p-4 shadow-sm" key={stage.label}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-black text-[#10231b]">{stage.label}</h2>
                  <p className="mt-1 text-sm font-medium text-[#66756c]">{stage.totalValue}</p>
                </div>
                <span className="rounded-lg bg-[#f4f7fb] px-2.5 py-1 text-xs font-black text-[#536258]">
                  {stage.count}
                </span>
              </div>

              <div className="mt-4 space-y-3">
                {stage.deals.map((deal) => (
                  <Link
                    className="block rounded-lg border border-[#edf0ee] bg-[#fbfcfa] p-4 transition hover:border-[#10231b] hover:bg-white"
                    href={`/clients/${deal.clientId}`}
                    key={deal.id}
                  >
                    <p className="font-black text-[#10231b]">{deal.clientName}</p>
                    <p className="mt-1 text-sm font-medium text-[#66756c]">{deal.title}</p>
                    <div className="mt-4 flex items-center justify-between gap-3 text-sm">
                      <span className="font-black text-[#10231b]">{deal.value}</span>
                      <span className={`rounded-lg px-2.5 py-1 text-xs font-black ${deal.stageColor}`}>
                        {deal.probability}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </article>
          ))}
        </section>

        <section className="min-w-0 overflow-hidden rounded-lg border border-[#d9e2dc] bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-[#edf0ee] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h2 className="text-xl font-black text-[#10231b]">All deals</h2>
              <p className="mt-1 text-sm font-medium text-[#66756c]">Forecast, owner contact, and close timing</p>
            </div>
            <button className="w-full rounded-lg border border-[#d9e2dc] bg-white px-4 py-2.5 text-sm font-black text-[#10231b] hover:bg-[#f4f7fb] sm:w-auto">
              Export
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[940px] border-collapse text-left text-sm">
              <thead className="bg-[#f6f8f5] text-[#66756c]">
                <tr>
                  <th className="px-5 py-3 font-black">Deal</th>
                  <th className="px-5 py-3 font-black">Client</th>
                  <th className="px-5 py-3 font-black">Stage</th>
                  <th className="px-5 py-3 font-black">Probability</th>
                  <th className="px-5 py-3 font-black">Weighted</th>
                  <th className="px-5 py-3 font-black">Close</th>
                  <th className="px-5 py-3 font-black">Value</th>
                </tr>
              </thead>
              <tbody>
                {dealsData.deals.map((deal) => (
                  <tr className="border-t border-[#edf0ee]" key={deal.id}>
                    <td className="px-5 py-4">
                      <p className="font-black text-[#10231b]">{deal.title}</p>
                      <p className="mt-1 text-xs font-bold text-[#66756c]">{deal.contact}</p>
                    </td>
                    <td className="px-5 py-4">
                      <Link className="font-bold text-[#10231b] hover:underline" href={`/clients/${deal.clientId}`}>
                        {deal.clientName}
                      </Link>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`rounded-lg px-2.5 py-1 text-xs font-black ${deal.stageColor}`}>
                        {deal.stage}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-black text-[#10231b]">{deal.probability}</td>
                    <td className="px-5 py-4 font-black text-[#10231b]">{deal.weightedValue}</td>
                    <td className="px-5 py-4 font-medium text-[#66756c]">{deal.closeDate}</td>
                    <td className="px-5 py-4 font-black text-[#10231b]">{deal.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
