import { ArrowLeft, ExternalLink } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppShell } from "@/components/app-shell";
import { EditClientDialog } from "@/components/edit-client-dialog";
import { getClientDetailsData } from "@/lib/clients-data";
import { getDashboardData } from "@/lib/dashboard-data";

type ClientDetailPageProps = {
  params: Promise<{
    clientId: string;
  }>;
};

export default async function ClientDetailPage({ params }: ClientDetailPageProps) {
  const session = await auth();

  if (!session?.user?.workspaceId) {
    redirect("/login");
  }

  const { clientId } = await params;
  const [dashboardData, client] = await Promise.all([
    getDashboardData(session.user.workspaceId),
    getClientDetailsData(session.user.workspaceId, clientId),
  ]);

  if (!client) {
    notFound();
  }

  return (
    <AppShell
      activeItem="Clients"
      primaryActionLabel="Add client"
      summary={dashboardData.summary}
      title={client.name}
      userEmail={session.user.email ?? "demo@clientflow.app"}
      workspaceName={dashboardData.workspaceName}
    >
      <div className="w-full space-y-6 px-4 py-5 sm:px-6 lg:px-8 xl:px-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            className="inline-flex items-center gap-2 rounded-lg border border-[#d9e2dc] bg-white px-4 py-2.5 text-sm font-black text-[#10231b] shadow-sm hover:bg-[#f4f7fb]"
            href="/clients"
          >
            <ArrowLeft aria-hidden="true" size={17} strokeWidth={2.6} />
            <span>Clients</span>
          </Link>
          <EditClientDialog initialValues={client.editValues} />
        </div>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
          <article className="overflow-hidden rounded-lg border border-[#173729] bg-[#10231b] text-white shadow-sm">
            <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_330px]">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <span className={`rounded-lg px-3 py-1 text-sm font-black ${client.statusColor}`}>
                    {client.status}
                  </span>
                  <span className="text-sm font-bold uppercase tracking-[0.18em] text-[#9fb5aa]">
                    {client.industry}
                  </span>
                </div>
                <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
                  {client.name} account coverage.
                </h2>
                <p className="mt-4 max-w-2xl text-base leading-7 text-[#c8d8d0]">
                  {client.contacts[0]?.name ?? "No primary contact"} is tracked with {client.deals.length} deals and{" "}
                  {client.tasks.length} tasks in the current workspace.
                </p>
              </div>

              <div className="min-w-0 border-t border-white/10 pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#9fb5aa]">Account value</p>
                <p className="mt-3 text-4xl font-black tracking-tight">{client.estimatedValue}</p>
                <div className="mt-6 grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-white/10 p-3">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#9fb5aa]">Website</p>
                    <p className="mt-2 truncate text-sm font-black">{client.website}</p>
                  </div>
                  <div className="rounded-lg bg-white/10 p-3">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#9fb5aa]">Updated</p>
                    <p className="mt-2 truncate text-sm font-black">{client.updatedAt}</p>
                  </div>
                </div>
              </div>
            </div>
          </article>

          <article className="rounded-lg border border-[#d9e2dc] bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-[#10231b]">Primary contact</h2>
                <p className="mt-1 text-sm font-medium text-[#66756c]">{client.contacts[0]?.title ?? "No title"}</p>
              </div>
              <span className="rounded-lg bg-blue-50 px-3 py-1 text-sm font-black text-blue-700">
                {client.contacts.length}
              </span>
            </div>

            <div className="mt-5 divide-y divide-[#edf0ee]">
              {client.contacts.map((contact) => (
                <div className="py-4 first:pt-0 last:pb-0" key={contact.id}>
                  <p className="font-black text-[#10231b]">{contact.name}</p>
                  <p className="mt-1 text-sm font-medium text-[#66756c]">{contact.email}</p>
                  <p className="mt-1 text-sm font-medium text-[#66756c]">{contact.phone}</p>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {client.metrics.map((metric) => (
            <article
              className="rounded-lg border border-[#d9e2dc] bg-white p-5 shadow-sm shadow-slate-200/60"
              key={metric.label}
            >
              <p className="truncate text-sm font-bold text-[#66756c]">{metric.label}</p>
              <p className="mt-3 text-3xl font-black tracking-tight text-[#10231b]">{metric.value}</p>
              <p className="mt-3 text-sm font-medium text-[#66756c]">{metric.note}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_390px]">
          <article className="min-w-0 overflow-hidden rounded-lg border border-[#d9e2dc] bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-[#edf0ee] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <h2 className="text-xl font-black text-[#10231b]">Deals</h2>
                <p className="mt-1 text-sm font-medium text-[#66756c]">Opportunity value and probability</p>
              </div>
              {client.website === "Not added" ? (
                <span className="inline-flex w-full items-center justify-center rounded-lg border border-[#d9e2dc] bg-[#f8faf7] px-4 py-2.5 text-sm font-black text-[#66756c] sm:w-auto">
                  No website
                </span>
              ) : (
                <a
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[#d9e2dc] bg-white px-4 py-2.5 text-sm font-black text-[#10231b] hover:bg-[#f4f7fb] sm:w-auto"
                  href={`https://${client.website}`}
                  rel="noreferrer"
                  target="_blank"
                >
                  <ExternalLink aria-hidden="true" size={16} strokeWidth={2.6} />
                  <span>Website</span>
                </a>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                <thead className="bg-[#f6f8f5] text-[#66756c]">
                  <tr>
                    <th className="px-5 py-3 font-black">Deal</th>
                    <th className="px-5 py-3 font-black">Stage</th>
                    <th className="px-5 py-3 font-black">Probability</th>
                    <th className="px-5 py-3 font-black">Close</th>
                    <th className="px-5 py-3 font-black">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {client.deals.map((deal) => (
                    <tr className="border-t border-[#edf0ee]" key={deal.id}>
                      <td className="px-5 py-4 font-black text-[#10231b]">{deal.title}</td>
                      <td className="px-5 py-4">
                        <span className={`rounded-lg px-2.5 py-1 text-xs font-black ${deal.stageColor}`}>
                          {deal.stage}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-black text-[#10231b]">{deal.probability}</td>
                      <td className="px-5 py-4 font-medium text-[#66756c]">{deal.expectedCloseDate}</td>
                      <td className="px-5 py-4 font-black text-[#10231b]">{deal.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>

          <article className="rounded-lg border border-[#d9e2dc] bg-white p-5 shadow-sm">
            <h2 className="text-xl font-black text-[#10231b]">Tasks</h2>
            <div className="mt-4 divide-y divide-[#edf0ee]">
              {client.tasks.map((task) => (
                <div className="py-4 first:pt-0 last:pb-0" key={task.id}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-black text-[#10231b]">{task.title}</p>
                      <p className="mt-1 text-sm font-medium text-[#66756c]">{task.description}</p>
                    </div>
                    <span className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-black ${task.priorityColor}`}>
                      {task.priority}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-4 text-sm font-medium text-[#66756c]">
                    <span>{task.status}</span>
                    <span>{task.due}</span>
                  </div>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="rounded-lg border border-[#d9e2dc] bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-black text-[#10231b]">Activity</h2>
              <p className="mt-1 text-sm font-medium text-[#66756c]">Recent account timeline</p>
            </div>
            <span className="text-sm font-black text-[#66756c]">{client.activities.length} updates</span>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {client.activities.map((activity) => (
              <article className="rounded-lg border border-[#edf0ee] bg-[#fbfcfa] p-4" key={activity.id}>
                <div className="flex items-start justify-between gap-4">
                  <p className="font-black text-[#10231b]">{activity.type}</p>
                  <span className="shrink-0 text-xs font-bold text-[#66756c]">{activity.date}</span>
                </div>
                <p className="mt-3 text-sm font-bold text-[#10231b]">{activity.message}</p>
                <p className="mt-2 text-sm font-medium text-[#66756c]">{activity.actor}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
