const metrics = [
  { label: "Pipeline value", value: "$128,400", change: "+12.8%", accent: "bg-emerald-500" },
  { label: "Active clients", value: "42", change: "+6 this week", accent: "bg-blue-500" },
  { label: "Open tasks", value: "18", change: "5 due today", accent: "bg-amber-500" },
  { label: "Close rate", value: "38%", change: "+4.2%", accent: "bg-rose-500" },
];

const pipeline = [
  { company: "Northstar Labs", contact: "Amina Bello", stage: "Proposal", value: "$24,000" },
  { company: "Clearline Finance", contact: "Daniel Hart", stage: "Discovery", value: "$18,500" },
  { company: "Urban Nest", contact: "Fatima Okoro", stage: "Negotiation", value: "$31,200" },
  { company: "Medix Cloud", contact: "James Carter", stage: "Qualified", value: "$14,800" },
];

const tasks = [
  { title: "Send revised proposal", owner: "Onyeukwu", status: "Today" },
  { title: "Prepare onboarding plan", owner: "Sales", status: "Tomorrow" },
  { title: "Review subscription terms", owner: "Finance", status: "Friday" },
];

const navItems = ["Dashboard", "Clients", "Deals", "Tasks", "Billing"];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f7f8f2] text-[#172018]">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl">
        <aside className="hidden w-64 shrink-0 border-r border-[#d9ded2] bg-[#fcfdf8] px-5 py-6 md:block">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-[#172018] text-sm font-semibold text-white">
              CF
            </div>
            <div>
              <p className="text-lg font-semibold">ClientFlow</p>
              <p className="text-sm text-[#697361]">SaaS CRM</p>
            </div>
          </div>

          <nav className="mt-10 space-y-1">
            {navItems.map((item) => (
              <a
                key={item}
                className={`block rounded-lg px-3 py-2 text-sm font-medium ${
                  item === "Dashboard"
                    ? "bg-[#e5f0db] text-[#172018]"
                    : "text-[#5f6958] hover:bg-[#f0f2ea] hover:text-[#172018]"
                }`}
                href="#"
              >
                {item}
              </a>
            ))}
          </nav>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col">
          <header className="flex flex-col gap-4 border-b border-[#d9ded2] bg-[#fcfdf8] px-5 py-5 sm:flex-row sm:items-center sm:justify-between lg:px-8">
            <div>
              <p className="text-sm font-medium text-[#697361]">Workspace</p>
              <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">Dashboard</h1>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-lg border border-[#d9ded2] bg-white px-3 py-2 text-sm text-[#5f6958]">
                demo@clientflow.app
              </span>
              <button className="rounded-lg bg-[#172018] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2f3a2b]">
                + Add client
              </button>
            </div>
          </header>

          <div className="flex-1 space-y-6 px-5 py-6 lg:px-8">
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {metrics.map((metric) => (
                <article key={metric.label} className="rounded-lg border border-[#d9ded2] bg-white p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-[#697361]">{metric.label}</p>
                    <span className={`h-2.5 w-2.5 rounded-full ${metric.accent}`} />
                  </div>
                  <p className="mt-4 text-3xl font-semibold">{metric.value}</p>
                  <p className="mt-2 text-sm text-[#5f6958]">{metric.change}</p>
                </article>
              ))}
            </section>

            <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
              <article className="rounded-lg border border-[#d9ded2] bg-white">
                <div className="flex items-center justify-between border-b border-[#e6e9df] px-4 py-4">
                  <div>
                    <h2 className="text-lg font-semibold">Deal pipeline</h2>
                    <p className="text-sm text-[#697361]">Qualified opportunities by stage</p>
                  </div>
                  <button className="rounded-lg border border-[#d9ded2] px-3 py-2 text-sm font-semibold hover:bg-[#f4f6ef]">
                    View all
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                    <thead className="bg-[#f7f8f2] text-[#697361]">
                      <tr>
                        <th className="px-4 py-3 font-medium">Company</th>
                        <th className="px-4 py-3 font-medium">Contact</th>
                        <th className="px-4 py-3 font-medium">Stage</th>
                        <th className="px-4 py-3 font-medium">Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pipeline.map((deal) => (
                        <tr key={deal.company} className="border-t border-[#e6e9df]">
                          <td className="px-4 py-4 font-medium">{deal.company}</td>
                          <td className="px-4 py-4 text-[#5f6958]">{deal.contact}</td>
                          <td className="px-4 py-4">
                            <span className="rounded-lg bg-[#eaf2ff] px-2.5 py-1 text-xs font-semibold text-[#1e4f9a]">
                              {deal.stage}
                            </span>
                          </td>
                          <td className="px-4 py-4 font-semibold">{deal.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </article>

              <aside className="space-y-6">
                <article className="rounded-lg border border-[#d9ded2] bg-white p-4">
                  <h2 className="text-lg font-semibold">Tasks</h2>
                  <div className="mt-4 divide-y divide-[#e6e9df]">
                    {tasks.map((task) => (
                      <div key={task.title} className="py-3 first:pt-0 last:pb-0">
                        <p className="font-medium">{task.title}</p>
                        <div className="mt-3 flex items-center justify-between text-sm text-[#697361]">
                          <span>{task.owner}</span>
                          <span>{task.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </article>

                <article className="rounded-lg border border-[#d9ded2] bg-[#172018] p-4 text-white">
                  <h2 className="text-lg font-semibold">Subscription</h2>
                  <p className="mt-2 text-sm text-[#c8d4c1]">Growth plan</p>
                  <div className="mt-5 flex items-end justify-between">
                    <p className="text-3xl font-semibold">$29</p>
                    <button className="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-[#172018] hover:bg-[#edf0e8]">
                      Manage
                    </button>
                  </div>
                </article>
              </aside>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
