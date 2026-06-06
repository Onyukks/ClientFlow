import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppShell } from "@/components/app-shell";
import { getBillingData } from "@/lib/billing-data";
import { getDashboardData } from "@/lib/dashboard-data";

export default async function BillingPage() {
  const session = await auth();

  if (!session?.user?.workspaceId) {
    redirect("/login");
  }

  const [dashboardData, billingData] = await Promise.all([
    getDashboardData(session.user.workspaceId),
    getBillingData(session.user.workspaceId),
  ]);

  return (
    <AppShell
      activeItem="Billing"
      summary={dashboardData.summary}
      title="Billing"
      userEmail={session.user.email ?? "demo@clientflow.app"}
      workspaceName={dashboardData.workspaceName}
    >
      <div className="w-full space-y-6 px-4 py-5 sm:px-6 lg:px-8 xl:px-10">
        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(340px,0.75fr)]">
          <article className="overflow-hidden rounded-lg border border-[#173729] bg-[#10231b] text-white shadow-sm">
            <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div className="min-w-0">
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#9fb5aa]">Subscription</p>
                <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">{billingData.summary}</h2>
                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                  <div className="border-l-2 border-emerald-400 pl-4">
                    <p className="text-2xl font-black">{billingData.currentPlan}</p>
                    <p className="text-sm text-[#c8d8d0]">Current plan</p>
                  </div>
                  <div className="border-l-2 border-blue-400 pl-4">
                    <p className="text-2xl font-black">{billingData.currentPrice}</p>
                    <p className="text-sm text-[#c8d8d0]">Monthly price</p>
                  </div>
                  <div className="border-l-2 border-amber-400 pl-4">
                    <p className="text-2xl font-black">{billingData.renewalDate}</p>
                    <p className="text-sm text-[#c8d8d0]">Renewal date</p>
                  </div>
                </div>
              </div>

              <div className="min-w-0 border-t border-white/10 pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#9fb5aa]">Payment mode</p>
                <div className="mt-4 rounded-lg bg-white/10 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-black">{billingData.paymentMode}</p>
                    <span className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-black ${billingData.statusColor}`}>
                      {billingData.status}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-[#c8d8d0]">No live payment is collected for this portfolio workspace.</p>
                </div>
                <Link
                  className="mt-4 inline-flex w-full justify-center rounded-lg bg-white px-4 py-3 text-sm font-black text-[#10231b] hover:bg-[#eef4f0]"
                  href="/reports"
                >
                  View revenue report
                </Link>
              </div>
            </div>
          </article>

          <article className="rounded-lg border border-[#d9e2dc] bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-[#10231b]">Plan usage</h2>
                <p className="mt-1 text-sm font-medium text-[#66756c]">Workspace limits and current usage</p>
              </div>
              <span className={`rounded-lg px-3 py-1 text-sm font-black ${billingData.statusColor}`}>
                {billingData.status}
              </span>
            </div>

            <div className="mt-5 space-y-4">
              {billingData.usage.map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between gap-4 text-sm font-black text-[#10231b]">
                    <span>{item.label}</span>
                    <span>
                      {item.value} / {item.limit}
                    </span>
                  </div>
                  <div className="mt-2 h-3 overflow-hidden rounded-lg bg-[#edf0ee]">
                    <div className={`h-full rounded-lg ${item.color}`} style={{ width: `${item.percent}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {billingData.metrics.map((metric) => (
            <article
              className="rounded-lg border border-[#d9e2dc] bg-white p-5 shadow-sm shadow-slate-200/60"
              key={metric.label}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-[#66756c]">{metric.label}</p>
                  <p className="mt-3 truncate text-3xl font-black tracking-tight text-[#10231b]">{metric.value}</p>
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

        <section className="grid gap-4 xl:grid-cols-3">
          {billingData.planCards.map((plan) => (
            <article
              className={`rounded-lg border p-5 shadow-sm ${
                plan.highlighted ? "border-[#10231b] bg-[#10231b] text-white" : "border-[#d9e2dc] bg-white text-[#10231b]"
              }`}
              key={plan.name}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black">{plan.name}</h2>
                  <p className={`mt-1 text-sm font-medium ${plan.highlighted ? "text-[#c8d8d0]" : "text-[#66756c]"}`}>
                    {plan.description}
                  </p>
                </div>
                {plan.highlighted ? (
                  <span className="rounded-lg bg-white px-2.5 py-1 text-xs font-black text-[#10231b]">Active</span>
                ) : null}
              </div>

              <p className="mt-6 text-4xl font-black tracking-tight">{plan.price}</p>
              <div className={`mt-5 space-y-3 text-sm font-bold ${plan.highlighted ? "text-[#dce8e1]" : "text-[#536258]"}`}>
                {plan.features.map((feature) => (
                  <p className="rounded-lg border border-current/10 px-3 py-2" key={feature}>
                    {feature}
                  </p>
                ))}
              </div>
              <button
                className={`mt-6 w-full rounded-lg px-4 py-3 text-sm font-black ${
                  plan.highlighted
                    ? "bg-white text-[#10231b] hover:bg-[#eef4f0]"
                    : "border border-[#d9e2dc] bg-white text-[#10231b] hover:bg-[#f4f7fb]"
                }`}
                type="button"
              >
                {plan.cta}
              </button>
            </article>
          ))}
        </section>

        <section className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_420px]">
          <article className="min-w-0 overflow-hidden rounded-lg border border-[#d9e2dc] bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-[#edf0ee] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <h2 className="text-xl font-black text-[#10231b]">Billing history</h2>
                <p className="mt-1 text-sm font-medium text-[#66756c]">Invoices and test-mode credits</p>
              </div>
              <button className="w-full rounded-lg border border-[#d9e2dc] bg-white px-4 py-2.5 text-sm font-black text-[#10231b] hover:bg-[#f4f7fb] sm:w-auto">
                Download
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                <thead className="bg-[#f6f8f5] text-[#66756c]">
                  <tr>
                    <th className="px-5 py-3 font-black">Invoice</th>
                    <th className="px-5 py-3 font-black">Date</th>
                    <th className="px-5 py-3 font-black">Status</th>
                    <th className="px-5 py-3 font-black">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {billingData.history.map((item) => (
                    <tr className="border-t border-[#edf0ee]" key={item.id}>
                      <td className="px-5 py-4">
                        <p className="font-black text-[#10231b]">{item.id}</p>
                        <p className="mt-1 text-xs font-bold text-[#66756c]">{item.label}</p>
                      </td>
                      <td className="px-5 py-4 font-medium text-[#66756c]">{item.date}</td>
                      <td className="px-5 py-4">
                        <span className={`rounded-lg px-2.5 py-1 text-xs font-black ${item.statusColor}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-black text-[#10231b]">{item.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>

          <article className="rounded-lg border border-[#d9e2dc] bg-white p-5 shadow-sm">
            <h2 className="text-xl font-black text-[#10231b]">Billing access</h2>
            <p className="mt-1 text-sm font-medium text-[#66756c]">Workspace members with subscription visibility</p>

            <div className="mt-5 divide-y divide-[#edf0ee]">
              {billingData.members.map((member) => (
                <div className="py-4 first:pt-0 last:pb-0" key={member.email}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate font-black text-[#10231b]">{member.name}</p>
                      <p className="mt-1 truncate text-sm font-medium text-[#66756c]">{member.email}</p>
                    </div>
                    <span className="shrink-0 rounded-lg bg-[#f4f7fb] px-2.5 py-1 text-xs font-black text-[#536258]">
                      {member.role}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </article>
        </section>
      </div>
    </AppShell>
  );
}
