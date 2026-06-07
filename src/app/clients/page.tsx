import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppShell } from "@/components/app-shell";
import { HeroStatGrid } from "@/components/hero-stat-grid";
import { getClientsData } from "@/lib/clients-data";
import { getDashboardData } from "@/lib/dashboard-data";

export default async function ClientsPage() {
  const session = await auth();

  if (!session?.user?.workspaceId) {
    redirect("/login");
  }

  const [dashboardData, clientsData] = await Promise.all([
    getDashboardData(session.user.workspaceId),
    getClientsData(session.user.workspaceId),
  ]);
  const primaryClient = clientsData.clients[0];
  const activeClients = clientsData.clients.filter((client) => client.status === "Active").length;
  const atRiskClients = clientsData.clients.filter((client) => client.status === "At Risk").length;
  const prospectClients = clientsData.clients.filter((client) => client.status === "Prospect").length;

  return (
    <AppShell
      activeItem="Clients"
      primaryActionLabel="Add client"
      summary={dashboardData.summary}
      title="Clients"
      userEmail={session.user.email ?? "demo@clientflow.app"}
      workspaceName={dashboardData.workspaceName}
    >
      <div className="w-full space-y-6 px-4 py-5 sm:px-6 lg:px-8 xl:px-10">
        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
          <article className="overflow-hidden rounded-lg border border-[#173729] bg-[#10231b] text-white shadow-sm">
            <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_310px]">
              <div className="min-w-0">
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#9fb5aa]">Account portfolio</p>
                <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
                  {clientsData.clients.length} client accounts under active coverage.
                </h2>
                <HeroStatGrid
                  stats={[
                    {
                      accentClassName: "border-emerald-400",
                      label: "Active",
                      value: activeClients,
                    },
                    {
                      accentClassName: "border-blue-400",
                      label: "Prospects",
                      value: prospectClients,
                    },
                    {
                      accentClassName: "border-rose-400",
                      label: "At risk",
                      value: atRiskClients,
                    },
                  ]}
                />
              </div>

              <div className="min-w-0 border-t border-white/10 pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#9fb5aa]">Priority account</p>
                <h3 className="mt-3 text-2xl font-black">{primaryClient?.name ?? "No clients yet"}</h3>
                <p className="mt-2 text-sm text-[#c8d8d0]">{primaryClient?.industry ?? "Start with your first account"}</p>
                <div className="mt-6 grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-white/10 p-3">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#9fb5aa]">Pipeline</p>
                    <p className="mt-2 text-2xl font-black">{primaryClient?.pipelineValue ?? "$0"}</p>
                  </div>
                  <div className="rounded-lg bg-white/10 p-3">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#9fb5aa]">Tasks</p>
                    <p className="mt-2 text-2xl font-black">{primaryClient?.openTasks ?? "0"}</p>
                  </div>
                </div>
              </div>
            </div>
          </article>

          <article className="rounded-lg border border-[#d9e2dc] bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-[#10231b]">Health mix</h2>
                <p className="mt-1 text-sm font-medium text-[#66756c]">Current account status</p>
              </div>
              <span className="rounded-lg bg-blue-50 px-3 py-1 text-sm font-black text-blue-700">
                {clientsData.clients.length} total
              </span>
            </div>

            <div className="mt-5 space-y-4">
              {[
                { label: "Active", value: activeClients, color: "bg-emerald-500" },
                { label: "Prospect", value: prospectClients, color: "bg-blue-500" },
                { label: "At Risk", value: atRiskClients, color: "bg-rose-500" },
              ].map((segment) => {
                const width = clientsData.clients.length
                  ? Math.max(8, Math.round((segment.value / clientsData.clients.length) * 100))
                  : 0;

                return (
                  <div key={segment.label}>
                    <div className="flex items-center justify-between gap-4 text-sm font-black text-[#10231b]">
                      <span>{segment.label}</span>
                      <span>{segment.value}</span>
                    </div>
                    <div className="mt-2 h-3 overflow-hidden rounded-lg bg-[#edf0ee]">
                      <div className={`h-full rounded-lg ${segment.color}`} style={{ width: `${width}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </article>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {clientsData.metrics.map((metric) => (
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

        <section className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_360px]">
          <article className="min-w-0 overflow-hidden rounded-lg border border-[#d9e2dc] bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-[#edf0ee] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <h2 className="text-xl font-black text-[#10231b]">Client accounts</h2>
                <p className="mt-1 text-sm font-medium text-[#66756c]">Primary contacts and revenue coverage</p>
              </div>
              <button className="w-full rounded-lg border border-[#d9e2dc] bg-white px-4 py-2.5 text-sm font-black text-[#10231b] hover:bg-[#f4f7fb] sm:w-auto">
                Export
              </button>
            </div>

            <div className="grid gap-3 p-4 md:hidden">
              {clientsData.clients.map((client) => (
                <Link
                  className="rounded-lg border border-[#edf0ee] bg-[#fbfcfa] p-4 transition hover:border-[#10231b] hover:bg-white"
                  href={`/clients/${client.id}`}
                  key={client.id}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-lg font-black text-[#10231b]">{client.name}</h3>
                      <p className="mt-1 truncate text-sm font-medium text-[#66756c]">{client.primaryContact}</p>
                    </div>
                    <span className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-black ${client.statusColor}`}>
                      {client.status}
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="font-bold text-[#66756c]">Value</p>
                      <p className="mt-1 font-black text-[#10231b]">{client.estimatedValue}</p>
                    </div>
                    <div>
                      <p className="font-bold text-[#66756c]">Pipeline</p>
                      <p className="mt-1 font-black text-[#10231b]">{client.pipelineValue}</p>
                    </div>
                    <div>
                      <p className="font-bold text-[#66756c]">Open deals</p>
                      <p className="mt-1 font-black text-[#10231b]">{client.openDeals}</p>
                    </div>
                    <div>
                      <p className="font-bold text-[#66756c]">Tasks</p>
                      <p className="mt-1 font-black text-[#10231b]">{client.openTasks}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[920px] border-collapse text-left text-sm">
                <thead className="bg-[#f6f8f5] text-[#66756c]">
                  <tr>
                    <th className="px-5 py-3 font-black">Company</th>
                    <th className="px-5 py-3 font-black">Contact</th>
                    <th className="px-5 py-3 font-black">Status</th>
                    <th className="px-5 py-3 font-black">Value</th>
                    <th className="px-5 py-3 font-black">Pipeline</th>
                    <th className="px-5 py-3 font-black">Open</th>
                    <th className="px-5 py-3 font-black">Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {clientsData.clients.map((client) => (
                    <tr className="border-t border-[#edf0ee]" key={client.id}>
                      <td className="px-5 py-4">
                        <Link className="font-black text-[#10231b] hover:underline" href={`/clients/${client.id}`}>
                          {client.name}
                        </Link>
                        <p className="mt-1 text-xs font-bold text-[#66756c]">{client.industry}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-bold text-[#10231b]">{client.primaryContact}</p>
                        <p className="mt-1 text-xs font-medium text-[#66756c]">{client.primaryContactEmail}</p>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`rounded-lg px-2.5 py-1 text-xs font-black ${client.statusColor}`}>
                          {client.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-black text-[#10231b]">{client.estimatedValue}</td>
                      <td className="px-5 py-4 font-black text-[#10231b]">{client.pipelineValue}</td>
                      <td className="px-5 py-4 font-medium text-[#66756c]">
                        {client.openDeals} deals / {client.openTasks} tasks
                      </td>
                      <td className="px-5 py-4 font-medium text-[#66756c]">{client.updatedAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>

          <article className="rounded-lg border border-[#d9e2dc] bg-white p-5 shadow-sm">
            <h2 className="text-xl font-black text-[#10231b]">Coverage queue</h2>
            <div className="mt-4 divide-y divide-[#edf0ee]">
              {clientsData.clients.slice(0, 4).map((client) => (
                <div className="py-4 first:pt-0 last:pb-0" key={client.id}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <Link className="truncate font-black text-[#10231b] hover:underline" href={`/clients/${client.id}`}>
                        {client.name}
                      </Link>
                      <p className="mt-1 truncate text-sm font-medium text-[#66756c]">{client.website}</p>
                    </div>
                    <span className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-black ${client.statusColor}`}>
                      {client.status}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-4 text-sm font-medium text-[#66756c]">
                    <span>{client.pipelineValue} pipeline</span>
                    <span>{client.openTasks} tasks</span>
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
