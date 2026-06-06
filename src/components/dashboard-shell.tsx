import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import type { DashboardData } from "@/types/dashboard";

type DashboardShellProps = {
  data: DashboardData;
  userEmail: string;
  userName: string;
  workspaceSlug: string;
};

export function DashboardShell({ data, userEmail, userName, workspaceSlug }: DashboardShellProps) {
  return (
    <AppShell
      activeItem="Dashboard"
      primaryActionLabel="Add client"
      summary={data.summary}
      title="Dashboard"
      userEmail={userEmail}
      workspaceName={data.workspaceName}
    >
      <div className="w-full space-y-6 px-4 py-5 sm:px-6 lg:px-8 xl:px-10">
        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.75fr)]">
          <article className="overflow-hidden rounded-lg border border-[#173729] bg-[#10231b] text-white shadow-sm">
            <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_290px]">
              <div className="min-w-0">
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#9fb5aa]">Revenue forecast</p>
                <h2 className="mt-3 max-w-3xl text-3xl font-black tracking-tight sm:text-4xl">
                  {data.summary.revenueHeadline}
                </h2>
                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                  <div className="border-l-2 border-emerald-400 pl-4">
                    <p className="text-2xl font-black">{data.summary.expectedCloseValue}</p>
                    <p className="text-sm text-[#c8d8d0]">Expected close</p>
                  </div>
                  <div className="border-l-2 border-blue-400 pl-4">
                    <p className="text-2xl font-black">{data.summary.hotAccounts}</p>
                    <p className="text-sm text-[#c8d8d0]">Hot accounts</p>
                  </div>
                  <div className="border-l-2 border-amber-400 pl-4">
                    <p className="text-2xl font-black">{data.summary.dueToday}</p>
                    <p className="text-sm text-[#c8d8d0]">Due today</p>
                  </div>
                </div>
              </div>

              <div className="min-w-0 border-t border-white/10 pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-sm text-[#c8d8d0]">Target progress</p>
                    <p className="mt-1 text-3xl font-black">{data.summary.targetProgressLabel}</p>
                  </div>
                  <p className="rounded-lg bg-emerald-400 px-3 py-1 text-sm font-black text-[#10231b]">
                    On track
                  </p>
                </div>
                <div className="mt-6 h-3 overflow-hidden rounded-lg bg-white/10">
                  <div
                    className="h-full rounded-lg bg-emerald-400"
                    style={{ width: `${data.summary.targetProgress}%` }}
                  />
                </div>
                <div className="mt-6 grid grid-cols-7 items-end gap-2">
                  {data.summary.chartBars.map((height, index) => (
                    <div key={height + index} className="flex h-28 items-end rounded-lg bg-white/5 px-1.5">
                      <div
                        className={`w-full rounded-md ${
                          index % 3 === 0 ? "bg-blue-400" : index % 3 === 1 ? "bg-emerald-400" : "bg-amber-400"
                        }`}
                        style={{ height: `${height}%` }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </article>

          <article className="rounded-lg border border-[#d9e2dc] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-black text-[#10231b]">Today&apos;s focus</h2>
                <p className="text-sm font-medium text-[#66756c]">
                  {userName} - {workspaceSlug}
                </p>
              </div>
              <span className="rounded-lg bg-rose-50 px-3 py-1 text-sm font-black text-rose-700">
                {data.summary.alertCount} alerts
              </span>
            </div>

            <div className="mt-5 space-y-4">
              {data.activity.map((item, index) => (
                <div key={item.message} className="flex gap-3">
                  <span className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[#edf7f1] text-xs font-black text-emerald-700">
                    {index + 1}
                  </span>
                  <div className="min-w-0 border-b border-[#edf0ee] pb-4 last:border-b-0 last:pb-0">
                    <p className="font-bold text-[#10231b]">{item.message}</p>
                    <p className="mt-1 text-sm text-[#66756c]">{item.meta}</p>
                  </div>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {data.metrics.map((metric) => (
            <article
              key={metric.label}
              className="rounded-lg border border-[#d9e2dc] bg-white p-5 shadow-sm shadow-slate-200/60"
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
                <h2 className="text-xl font-black text-[#10231b]">Deal pipeline</h2>
                <p className="mt-1 text-sm font-medium text-[#66756c]">Qualified opportunities by stage</p>
              </div>
              <Link
                className="inline-flex w-full justify-center rounded-lg border border-[#d9e2dc] bg-white px-4 py-2.5 text-sm font-black text-[#10231b] hover:bg-[#f4f7fb] sm:w-auto"
                href="/deals"
              >
                View all
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                <thead className="bg-[#f6f8f5] text-[#66756c]">
                  <tr>
                    <th className="px-5 py-3 font-black">Company</th>
                    <th className="px-5 py-3 font-black">Contact</th>
                    <th className="px-5 py-3 font-black">Stage</th>
                    <th className="px-5 py-3 font-black">Probability</th>
                    <th className="px-5 py-3 font-black">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {data.pipeline.map((deal) => (
                    <tr key={deal.company} className="border-t border-[#edf0ee]">
                      <td className="px-5 py-4 font-black text-[#10231b]">{deal.company}</td>
                      <td className="px-5 py-4 font-medium text-[#536258]">{deal.contact}</td>
                      <td className="px-5 py-4">
                        <span className={`rounded-lg px-2.5 py-1 text-xs font-black ${deal.color}`}>
                          {deal.stage}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-black text-[#10231b]">{deal.probability}</td>
                      <td className="px-5 py-4 font-black text-[#10231b]">{deal.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>

          <div className="grid gap-6 sm:grid-cols-2 2xl:grid-cols-1">
            <article className="rounded-lg border border-[#d9e2dc] bg-white p-5 shadow-sm">
              <h2 className="text-xl font-black text-[#10231b]">Tasks</h2>
              <div className="mt-4 divide-y divide-[#edf0ee]">
                {data.tasks.map((task) => (
                  <div key={task.title} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex items-start justify-between gap-4">
                      <p className="min-w-0 font-black text-[#10231b]">{task.title}</p>
                      <span className="shrink-0 rounded-lg bg-[#f4f7fb] px-2.5 py-1 text-xs font-black text-[#536258]">
                        {task.priority}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-4 text-sm font-medium text-[#66756c]">
                      <span>{task.owner}</span>
                      <span>{task.due}</span>
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-lg border border-[#d9e2dc] bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-[#10231b]">Subscription</h2>
                  <p className="mt-1 text-sm font-medium text-[#66756c]">{data.subscription.plan} plan</p>
                </div>
                <span className="rounded-lg bg-emerald-50 px-3 py-1 text-sm font-black text-emerald-700">
                  {data.subscription.status}
                </span>
              </div>
              <div className="mt-6 flex items-end justify-between gap-4">
                <div>
                  <p className="text-4xl font-black tracking-tight text-[#10231b]">{data.subscription.price}</p>
                  <p className="mt-1 text-sm font-medium text-[#66756c]">{data.subscription.note}</p>
                </div>
                <button className="rounded-lg bg-[#10231b] px-4 py-2.5 text-sm font-black text-white hover:bg-[#1f3a2f]">
                  Manage
                </button>
              </div>
            </article>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
