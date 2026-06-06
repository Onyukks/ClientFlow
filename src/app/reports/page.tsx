import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppShell } from "@/components/app-shell";
import { getDashboardData } from "@/lib/dashboard-data";
import { getReportsData } from "@/lib/reports-data";

export default async function ReportsPage() {
  const session = await auth();

  if (!session?.user?.workspaceId) {
    redirect("/login");
  }

  const [dashboardData, reportsData] = await Promise.all([
    getDashboardData(session.user.workspaceId),
    getReportsData(session.user.workspaceId),
  ]);

  return (
    <AppShell
      activeItem="Reports"
      summary={dashboardData.summary}
      title="Reports"
      userEmail={session.user.email ?? "demo@clientflow.app"}
      workspaceName={dashboardData.workspaceName}
    >
      <div className="w-full space-y-6 px-4 py-5 sm:px-6 lg:px-8 xl:px-10">
        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(340px,0.75fr)]">
          <article className="overflow-hidden rounded-lg border border-[#173729] bg-[#10231b] text-white shadow-sm">
            <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div className="min-w-0">
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#9fb5aa]">Performance reports</p>
                <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">{reportsData.headline}</h2>
                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                  {reportsData.metrics.slice(0, 3).map((metric) => (
                    <div className="border-l-2 border-blue-400 pl-4" key={metric.label}>
                      <p className="text-2xl font-black">{metric.value}</p>
                      <p className="text-sm text-[#c8d8d0]">{metric.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="min-w-0 border-t border-white/10 pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#9fb5aa]">Quick actions</p>
                <div className="mt-4 grid gap-3">
                  <Link
                    className="rounded-lg bg-white px-4 py-3 text-sm font-black text-[#10231b] hover:bg-[#eef4f0]"
                    href="/deals"
                  >
                    Review pipeline
                  </Link>
                  <Link
                    className="rounded-lg bg-white/10 px-4 py-3 text-sm font-black text-white hover:bg-white/15"
                    href="/clients"
                  >
                    Check client health
                  </Link>
                  <Link
                    className="rounded-lg bg-white/10 px-4 py-3 text-sm font-black text-white hover:bg-white/15"
                    href="/tasks"
                  >
                    Open work queue
                  </Link>
                </div>
              </div>
            </div>
          </article>

          <article className="rounded-lg border border-[#d9e2dc] bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-[#10231b]">Forecast curve</h2>
                <p className="mt-1 text-sm font-medium text-[#66756c]">Weighted revenue by stage</p>
              </div>
              <span className="rounded-lg bg-blue-50 px-3 py-1 text-sm font-black text-blue-700">
                Weighted
              </span>
            </div>

            <div className="mt-6 grid h-56 grid-cols-4 items-end gap-3 border-b border-[#d9e2dc] pb-3">
              {reportsData.forecastBars.map((bar) => (
                <div className="flex h-full min-w-0 flex-col justify-end" key={bar.label}>
                  <div className="mb-2 text-center text-xs font-black text-[#10231b]">{bar.weightedValue}</div>
                  <div
                    className={`min-h-8 rounded-t-lg ${bar.barColor}`}
                    style={{
                      height: `${bar.height}%`,
                    }}
                  />
                </div>
              ))}
            </div>

            <div className="mt-3 grid grid-cols-4 gap-3">
              {reportsData.forecastBars.map((bar) => (
                <div className="min-w-0 text-center" key={bar.label}>
                  <p className="truncate text-xs font-black text-[#10231b]">{bar.label}</p>
                  <p className="mt-1 text-xs font-medium text-[#66756c]">{bar.value}</p>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {reportsData.metrics.map((metric) => (
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

        <section className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_420px]">
          <article className="min-w-0 overflow-hidden rounded-lg border border-[#d9e2dc] bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-[#edf0ee] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <h2 className="text-xl font-black text-[#10231b]">Revenue by stage</h2>
                <p className="mt-1 text-sm font-medium text-[#66756c]">Open value, weighted forecast, and confidence</p>
              </div>
              <Link
                className="inline-flex w-full justify-center rounded-lg border border-[#d9e2dc] bg-white px-4 py-2.5 text-sm font-black text-[#10231b] hover:bg-[#f4f7fb] sm:w-auto"
                href="/deals"
              >
                View deals
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] border-collapse text-left text-sm">
                <thead className="bg-[#f6f8f5] text-[#66756c]">
                  <tr>
                    <th className="px-5 py-3 font-black">Stage</th>
                    <th className="px-5 py-3 font-black">Share</th>
                    <th className="px-5 py-3 font-black">Deals</th>
                    <th className="px-5 py-3 font-black">Value</th>
                    <th className="px-5 py-3 font-black">Weighted</th>
                    <th className="px-5 py-3 font-black">Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {reportsData.stageRows.map((stage) => (
                    <tr className="border-t border-[#edf0ee]" key={stage.label}>
                      <td className="px-5 py-4 font-black text-[#10231b]">{stage.label}</td>
                      <td className="px-5 py-4">
                        <div className="h-3 min-w-[8rem] overflow-hidden rounded-lg bg-[#edf0ee]">
                          <div className={`h-full rounded-lg ${stage.barColor}`} style={{ width: `${stage.share}%` }} />
                        </div>
                      </td>
                      <td className="px-5 py-4 font-black text-[#10231b]">{stage.count}</td>
                      <td className="px-5 py-4 font-black text-[#10231b]">{stage.totalValue}</td>
                      <td className="px-5 py-4 font-black text-[#10231b]">{stage.weightedValue}</td>
                      <td className="px-5 py-4 font-medium text-[#66756c]">{stage.averageProbability}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>

          <div className="grid gap-6 sm:grid-cols-2 2xl:grid-cols-1">
            <article className="rounded-lg border border-[#d9e2dc] bg-white p-5 shadow-sm">
              <h2 className="text-xl font-black text-[#10231b]">Client health</h2>
              <p className="mt-1 text-sm font-medium text-[#66756c]">Portfolio status distribution</p>

              <div className="mt-5 space-y-4">
                {reportsData.healthSegments.map((segment) => (
                  <div key={segment.label}>
                    <div className="flex items-center justify-between gap-4 text-sm font-black text-[#10231b]">
                      <span>{segment.label}</span>
                      <span>{segment.count}</span>
                    </div>
                    <div className="mt-2 h-3 overflow-hidden rounded-lg bg-[#edf0ee]">
                      <div className={`h-full rounded-lg ${segment.color}`} style={{ width: `${segment.value}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-lg border border-[#d9e2dc] bg-white p-5 shadow-sm">
              <h2 className="text-xl font-black text-[#10231b]">Task throughput</h2>
              <p className="mt-1 text-sm font-medium text-[#66756c]">Work status distribution</p>

              <div className="mt-5 space-y-4">
                {reportsData.taskSegments.map((segment) => (
                  <div key={segment.label}>
                    <div className="flex items-center justify-between gap-4 text-sm font-black text-[#10231b]">
                      <span>{segment.label}</span>
                      <span>{segment.count}</span>
                    </div>
                    <div className="mt-2 h-3 overflow-hidden rounded-lg bg-[#edf0ee]">
                      <div className={`h-full rounded-lg ${segment.color}`} style={{ width: `${segment.percent}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </section>

        <section className="rounded-lg border border-[#d9e2dc] bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-xl font-black text-[#10231b]">Activity signals</h2>
              <p className="mt-1 text-sm font-medium text-[#66756c]">Recent customer movement behind the numbers</p>
            </div>
            <Link
              className="inline-flex w-full justify-center rounded-lg border border-[#d9e2dc] bg-white px-4 py-2.5 text-sm font-black text-[#10231b] hover:bg-[#f4f7fb] sm:w-auto"
              href="/dashboard"
            >
              Dashboard
            </Link>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {reportsData.activity.map((item) => (
              <article className="rounded-lg border border-[#edf0ee] bg-[#fbfcfa] p-4" key={item.id}>
                <span className="rounded-lg bg-[#10231b] px-2.5 py-1 text-xs font-black text-white">{item.type}</span>
                <p className="mt-4 font-black text-[#10231b]">{item.message}</p>
                <p className="mt-3 text-sm font-medium text-[#66756c]">{item.meta}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
