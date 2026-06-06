import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppShell } from "@/components/app-shell";
import { getDashboardData } from "@/lib/dashboard-data";
import { getTasksData } from "@/lib/tasks-data";

export default async function TasksPage() {
  const session = await auth();

  if (!session?.user?.workspaceId) {
    redirect("/login");
  }

  const [dashboardData, tasksData] = await Promise.all([
    getDashboardData(session.user.workspaceId),
    getTasksData(session.user.workspaceId),
  ]);
  const focusTask = tasksData.tasks[0];
  const totalPriority = tasksData.priorityGroups.reduce((total, group) => total + Number(group.count), 0);

  return (
    <AppShell
      activeItem="Tasks"
      summary={dashboardData.summary}
      title="Tasks"
      userEmail={session.user.email ?? "demo@clientflow.app"}
      workspaceName={dashboardData.workspaceName}
    >
      <div className="w-full space-y-6 px-4 py-5 sm:px-6 lg:px-8 xl:px-10">
        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
          <article className="overflow-hidden rounded-lg border border-[#173729] bg-[#10231b] text-white shadow-sm">
            <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_310px]">
              <div className="min-w-0">
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#9fb5aa]">Work queue</p>
                <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
                  {tasksData.tasks.length} follow-ups keeping revenue work on track.
                </h2>
                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                  {tasksData.metrics.slice(0, 3).map((metric) => (
                    <div className="border-l-2 border-amber-400 pl-4" key={metric.label}>
                      <p className="text-2xl font-black">{metric.value}</p>
                      <p className="text-sm text-[#c8d8d0]">{metric.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="min-w-0 border-t border-white/10 pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#9fb5aa]">Next action</p>
                <h3 className="mt-3 text-2xl font-black">{focusTask?.title ?? "No open tasks"}</h3>
                <p className="mt-2 text-sm text-[#c8d8d0]">{focusTask?.clientName ?? "Everything is clear"}</p>
                <div className="mt-6 grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-white/10 p-3">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#9fb5aa]">Due</p>
                    <p className="mt-2 text-2xl font-black">{focusTask?.dueLabel ?? "No date"}</p>
                  </div>
                  <div className="rounded-lg bg-white/10 p-3">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#9fb5aa]">Priority</p>
                    <p className="mt-2 text-2xl font-black">{focusTask?.priority ?? "Clear"}</p>
                  </div>
                </div>
              </div>
            </div>
          </article>

          <article className="rounded-lg border border-[#d9e2dc] bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-[#10231b]">Priority mix</h2>
                <p className="mt-1 text-sm font-medium text-[#66756c]">Open work by urgency</p>
              </div>
              <span className="rounded-lg bg-amber-50 px-3 py-1 text-sm font-black text-amber-700">
                {tasksData.tasks.length} total
              </span>
            </div>

            <div className="mt-5 space-y-4">
              {tasksData.priorityGroups.map((priority) => {
                const width = totalPriority ? Math.max(8, Math.round((Number(priority.count) / totalPriority) * 100)) : 0;

                return (
                  <div key={priority.label}>
                    <div className="flex items-center justify-between gap-4 text-sm font-black text-[#10231b]">
                      <span>{priority.label}</span>
                      <span>{priority.count}</span>
                    </div>
                    <div className="mt-2 h-3 overflow-hidden rounded-lg bg-[#edf0ee]">
                      <div className={`h-full rounded-lg ${priority.barColor}`} style={{ width: `${width}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </article>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {tasksData.metrics.map((metric) => (
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

        <section className="grid gap-4 xl:grid-cols-3">
          {tasksData.statusGroups.map((group) => (
            <article className={`rounded-lg border p-4 shadow-sm ${group.tone}`} key={group.label}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-black text-[#10231b]">{group.label}</h2>
                  <p className="mt-1 text-sm font-medium text-[#66756c]">{group.note}</p>
                </div>
                <span className="rounded-lg bg-white px-2.5 py-1 text-xs font-black text-[#536258]">
                  {group.count}
                </span>
              </div>

              <div className="mt-4 space-y-3">
                {group.tasks.length ? (
                  group.tasks.map((task) => (
                    <div className="rounded-lg border border-white bg-white p-4 shadow-sm" key={task.id}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-black text-[#10231b]">{task.title}</p>
                          <p className="mt-1 text-sm font-medium text-[#66756c]">{task.clientName}</p>
                        </div>
                        <span className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-black ${task.priorityColor}`}>
                          {task.priority}
                        </span>
                      </div>
                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <span className={`rounded-lg px-2.5 py-1 text-xs font-black ${task.dueStateColor}`}>
                          {task.dueState}
                        </span>
                        <span className="text-sm font-bold text-[#66756c]">{task.dueLabel}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-lg border border-dashed border-[#d9e2dc] bg-white/70 p-4 text-sm font-bold text-[#66756c]">
                    No tasks here yet.
                  </div>
                )}
              </div>
            </article>
          ))}
        </section>

        <section className="min-w-0 overflow-hidden rounded-lg border border-[#d9e2dc] bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-[#edf0ee] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h2 className="text-xl font-black text-[#10231b]">All tasks</h2>
              <p className="mt-1 text-sm font-medium text-[#66756c]">Follow-up owner, due date, and linked revenue</p>
            </div>
            <button className="w-full rounded-lg border border-[#d9e2dc] bg-white px-4 py-2.5 text-sm font-black text-[#10231b] hover:bg-[#f4f7fb] sm:w-auto">
              Export
            </button>
          </div>

          <div className="grid gap-3 p-4 md:hidden">
            {tasksData.tasks.map((task) => (
              <article className="rounded-lg border border-[#edf0ee] bg-[#fbfcfa] p-4" key={task.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-lg font-black text-[#10231b]">{task.title}</h3>
                    <p className="mt-1 text-sm font-medium text-[#66756c]">{task.description}</p>
                  </div>
                  <span className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-black ${task.statusColor}`}>
                    {task.status}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="font-bold text-[#66756c]">Owner</p>
                    <p className="mt-1 font-black text-[#10231b]">{task.owner}</p>
                  </div>
                  <div>
                    <p className="font-bold text-[#66756c]">Due</p>
                    <p className="mt-1 font-black text-[#10231b]">{task.dueLabel}</p>
                  </div>
                  <div>
                    <p className="font-bold text-[#66756c]">Client</p>
                    {task.clientId ? (
                      <Link className="mt-1 block font-black text-[#10231b] hover:underline" href={`/clients/${task.clientId}`}>
                        {task.clientName}
                      </Link>
                    ) : (
                      <p className="mt-1 font-black text-[#10231b]">{task.clientName}</p>
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-[#66756c]">Revenue</p>
                    <p className="mt-1 font-black text-[#10231b]">{task.dealValue}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[980px] border-collapse text-left text-sm">
              <thead className="bg-[#f6f8f5] text-[#66756c]">
                <tr>
                  <th className="px-5 py-3 font-black">Task</th>
                  <th className="px-5 py-3 font-black">Client</th>
                  <th className="px-5 py-3 font-black">Status</th>
                  <th className="px-5 py-3 font-black">Priority</th>
                  <th className="px-5 py-3 font-black">Owner</th>
                  <th className="px-5 py-3 font-black">Due</th>
                  <th className="px-5 py-3 font-black">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {tasksData.tasks.map((task) => (
                  <tr className="border-t border-[#edf0ee]" key={task.id}>
                    <td className="px-5 py-4">
                      <p className="font-black text-[#10231b]">{task.title}</p>
                      <p className="mt-1 text-xs font-bold text-[#66756c]">{task.dealTitle}</p>
                    </td>
                    <td className="px-5 py-4">
                      {task.clientId ? (
                        <Link className="font-bold text-[#10231b] hover:underline" href={`/clients/${task.clientId}`}>
                          {task.clientName}
                        </Link>
                      ) : (
                        <span className="font-bold text-[#10231b]">{task.clientName}</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`rounded-lg px-2.5 py-1 text-xs font-black ${task.statusColor}`}>
                        {task.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`rounded-lg px-2.5 py-1 text-xs font-black ${task.priorityColor}`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-medium text-[#66756c]">{task.owner}</td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-lg px-2.5 py-1 text-xs font-black ${task.dueStateColor}`}>
                          {task.dueState}
                        </span>
                        <span className="font-medium text-[#66756c]">{task.dueLabel}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-black text-[#10231b]">{task.dealValue}</td>
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
