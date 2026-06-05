const navItems = ["Dashboard", "Clients", "Deals", "Tasks", "Reports", "Billing"];

const metrics = [
  {
    label: "Pipeline value",
    value: "$128,400",
    change: "+12.8%",
    note: "vs last month",
    accent: "bg-emerald-500",
    tint: "bg-emerald-50 text-emerald-700",
  },
  {
    label: "Active clients",
    value: "42",
    change: "+6",
    note: "new this week",
    accent: "bg-blue-500",
    tint: "bg-blue-50 text-blue-700",
  },
  {
    label: "Open tasks",
    value: "18",
    change: "5",
    note: "due today",
    accent: "bg-amber-500",
    tint: "bg-amber-50 text-amber-700",
  },
  {
    label: "Close rate",
    value: "38%",
    change: "+4.2%",
    note: "rolling average",
    accent: "bg-rose-500",
    tint: "bg-rose-50 text-rose-700",
  },
];

const pipeline = [
  {
    company: "Northstar Labs",
    contact: "Amina Bello",
    stage: "Proposal",
    value: "$24,000",
    probability: "72%",
    color: "bg-blue-50 text-blue-700",
  },
  {
    company: "Clearline Finance",
    contact: "Daniel Hart",
    stage: "Discovery",
    value: "$18,500",
    probability: "48%",
    color: "bg-amber-50 text-amber-700",
  },
  {
    company: "Urban Nest",
    contact: "Fatima Okoro",
    stage: "Negotiation",
    value: "$31,200",
    probability: "81%",
    color: "bg-emerald-50 text-emerald-700",
  },
  {
    company: "Medix Cloud",
    contact: "James Carter",
    stage: "Qualified",
    value: "$14,800",
    probability: "55%",
    color: "bg-rose-50 text-rose-700",
  },
];

const tasks = [
  { title: "Send revised Northstar proposal", owner: "Onyeukwu", due: "Today", priority: "High" },
  { title: "Prepare Urban Nest onboarding plan", owner: "Sales", due: "Tomorrow", priority: "Medium" },
  { title: "Review subscription terms", owner: "Finance", due: "Friday", priority: "Low" },
];

const activity = [
  "Proposal sent to Northstar Labs",
  "Clearline Finance moved to Discovery",
  "Urban Nest follow-up scheduled",
];

export default function Home() {
  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-[#f4f7fb] text-[#111827]">
      <div className="grid min-h-screen w-full lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="hidden h-screen flex-col border-r border-[#1e352b] bg-[#10231b] px-5 py-6 text-white lg:sticky lg:top-0 lg:flex">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-lg bg-white text-sm font-black text-[#10231b] shadow-sm">
              CF
            </div>
            <div className="min-w-0">
              <p className="truncate text-xl font-black tracking-tight">ClientFlow</p>
              <p className="text-sm font-medium text-[#9fb5aa]">SaaS CRM</p>
            </div>
          </div>

          <nav className="mt-10 space-y-1.5">
            {navItems.map((item) => (
              <a
                key={item}
                className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-semibold ${
                  item === "Dashboard"
                    ? "bg-white text-[#10231b] shadow-sm"
                    : "text-[#c8d8d0] hover:bg-[#1a3328] hover:text-white"
                }`}
                href="#"
              >
                <span>{item}</span>
                {item === "Tasks" ? (
                  <span className="rounded-lg bg-amber-400 px-2 py-0.5 text-xs font-black text-[#10231b]">
                    5
                  </span>
                ) : null}
              </a>
            ))}
          </nav>

          <div className="mt-auto border-t border-white/10 pt-5">
            <p className="text-sm font-semibold text-[#9fb5aa]">Demo workspace</p>
            <p className="mt-2 text-2xl font-black">$128.4k</p>
            <p className="mt-1 text-sm text-[#c8d8d0]">Weighted pipeline tracked across active accounts.</p>
          </div>
        </aside>

        <section className="min-w-0">
          <header className="border-b border-[#d9e2dc] bg-white/95 px-4 py-4 backdrop-blur sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#10231b] text-sm font-black text-white lg:hidden">
                  CF
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#66756c]">Workspace</p>
                  <h1 className="mt-1 truncate text-3xl font-black tracking-tight text-[#10231b] sm:text-4xl">
                    Dashboard
                  </h1>
                </div>
              </div>

              <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_auto] xl:w-auto">
                <div className="min-w-0 rounded-lg border border-[#d9e2dc] bg-[#f8faf7] px-4 py-3 text-sm font-semibold text-[#536258] shadow-sm">
                  <span className="block truncate">demo@clientflow.app</span>
                </div>
                <button className="rounded-lg bg-[#10231b] px-5 py-3 text-sm font-black text-white shadow-sm hover:bg-[#1f3a2f]">
                  Add client
                </button>
              </div>
            </div>
          </header>

          <nav className="flex gap-2 overflow-x-auto border-b border-[#d9e2dc] bg-white px-4 py-3 sm:px-6 lg:hidden">
            {navItems.map((item) => (
              <a
                key={item}
                href="#"
                className={`shrink-0 rounded-lg px-3 py-2 text-sm font-bold ${
                  item === "Dashboard"
                    ? "bg-[#10231b] text-white"
                    : "border border-[#d9e2dc] bg-white text-[#536258]"
                }`}
              >
                {item}
              </a>
            ))}
          </nav>

          <div className="w-full space-y-6 px-4 py-5 sm:px-6 lg:px-8 xl:px-10">
            <section className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.75fr)]">
              <article className="overflow-hidden rounded-lg border border-[#173729] bg-[#10231b] text-white shadow-sm">
                <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_290px]">
                  <div className="min-w-0">
                    <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#9fb5aa]">Revenue forecast</p>
                    <h2 className="mt-3 max-w-3xl text-3xl font-black tracking-tight sm:text-4xl">
                      Your sales pipeline is up 12.8% this month.
                    </h2>
                    <div className="mt-6 grid gap-4 sm:grid-cols-3">
                      <div className="border-l-2 border-emerald-400 pl-4">
                        <p className="text-2xl font-black">$44.2k</p>
                        <p className="text-sm text-[#c8d8d0]">Expected close</p>
                      </div>
                      <div className="border-l-2 border-blue-400 pl-4">
                        <p className="text-2xl font-black">14</p>
                        <p className="text-sm text-[#c8d8d0]">Hot accounts</p>
                      </div>
                      <div className="border-l-2 border-amber-400 pl-4">
                        <p className="text-2xl font-black">5</p>
                        <p className="text-sm text-[#c8d8d0]">Due today</p>
                      </div>
                    </div>
                  </div>

                  <div className="min-w-0 border-t border-white/10 pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
                    <div className="flex items-end justify-between gap-3">
                      <div>
                        <p className="text-sm text-[#c8d8d0]">Target progress</p>
                        <p className="mt-1 text-3xl font-black">68%</p>
                      </div>
                      <p className="rounded-lg bg-emerald-400 px-3 py-1 text-sm font-black text-[#10231b]">On track</p>
                    </div>
                    <div className="mt-6 h-3 overflow-hidden rounded-lg bg-white/10">
                      <div className="h-full w-[68%] rounded-lg bg-emerald-400" />
                    </div>
                    <div className="mt-6 grid grid-cols-7 items-end gap-2">
                      {[35, 62, 48, 72, 54, 88, 76].map((height, index) => (
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
                    <p className="text-sm font-medium text-[#66756c]">Priority movement</p>
                  </div>
                  <span className="rounded-lg bg-rose-50 px-3 py-1 text-sm font-black text-rose-700">3 alerts</span>
                </div>

                <div className="mt-5 space-y-4">
                  {activity.map((item, index) => (
                    <div key={item} className="flex gap-3">
                      <span className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[#edf7f1] text-xs font-black text-emerald-700">
                        {index + 1}
                      </span>
                      <div className="min-w-0 border-b border-[#edf0ee] pb-4 last:border-b-0 last:pb-0">
                        <p className="font-bold text-[#10231b]">{item}</p>
                        <p className="mt-1 text-sm text-[#66756c]">Updated in the demo workspace</p>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            </section>

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {metrics.map((metric) => (
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
                  <button className="w-full rounded-lg border border-[#d9e2dc] bg-white px-4 py-2.5 text-sm font-black text-[#10231b] hover:bg-[#f4f7fb] sm:w-auto">
                    View all
                  </button>
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
                      {pipeline.map((deal) => (
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
                    {tasks.map((task) => (
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
                      <p className="mt-1 text-sm font-medium text-[#66756c]">Growth plan</p>
                    </div>
                    <span className="rounded-lg bg-emerald-50 px-3 py-1 text-sm font-black text-emerald-700">
                      Active
                    </span>
                  </div>
                  <div className="mt-6 flex items-end justify-between gap-4">
                    <div>
                      <p className="text-4xl font-black tracking-tight text-[#10231b]">$29</p>
                      <p className="mt-1 text-sm font-medium text-[#66756c]">test billing mode</p>
                    </div>
                    <button className="rounded-lg bg-[#10231b] px-4 py-2.5 text-sm font-black text-white hover:bg-[#1f3a2f]">
                      Manage
                    </button>
                  </div>
                </article>
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
