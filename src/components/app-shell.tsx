"use client";

import { LogOut, Menu, X } from "lucide-react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { useState, type ReactNode } from "react";
import { AddClientDialog } from "@/components/add-client-dialog";
import type { DashboardSummary } from "@/types/dashboard";

type NavItem = {
  href?: string;
  label: AppShellNavItem;
};

export type AppShellNavItem = "Dashboard" | "Clients" | "Deals" | "Tasks" | "Reports" | "Billing";

type AppShellProps = {
  activeItem: AppShellNavItem;
  children: ReactNode;
  eyebrow?: string;
  primaryActionLabel?: string;
  summary: Pick<DashboardSummary, "dueToday" | "weightedPipelineValue">;
  title: string;
  userEmail: string;
  workspaceName: string;
};

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Clients", href: "/clients" },
  { label: "Deals", href: "/deals" },
  { label: "Tasks", href: "/tasks" },
  { label: "Reports", href: "/reports" },
  { label: "Billing", href: "/billing" },
];

function SidebarContent({
  activeItem,
  onNavigate,
  summary,
  workspaceName,
}: {
  activeItem: AppShellNavItem;
  onNavigate?: () => void;
  summary: Pick<DashboardSummary, "dueToday" | "weightedPipelineValue">;
  workspaceName: string;
}) {
  return (
    <div className="flex min-h-full flex-col">
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
        {navItems.map((item) => {
          const isActive = item.label === activeItem;
          const content = (
            <>
              <span>{item.label}</span>
              {item.label === "Tasks" ? (
                <span className="rounded-lg bg-amber-400 px-2 py-0.5 text-xs font-black text-[#10231b]">
                  {summary.dueToday}
                </span>
              ) : null}
            </>
          );
          const className = `flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-semibold ${
            isActive
              ? "bg-white text-[#10231b] shadow-sm"
              : item.href
                ? "text-[#c8d8d0] hover:bg-[#1a3328] hover:text-white"
                : "cursor-default text-[#7e9489]"
          }`;

          if (!item.href) {
            return (
              <button aria-disabled="true" className={className} key={item.label} type="button">
                {content}
              </button>
            );
          }

          return (
            <Link className={className} href={item.href} key={item.label} onClick={onNavigate}>
              {content}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-white/10 pt-5">
        <p className="text-sm font-semibold text-[#9fb5aa]">{workspaceName}</p>
        <p className="mt-2 text-2xl font-black">{summary.weightedPipelineValue}</p>
        <p className="mt-1 text-sm text-[#c8d8d0]">Weighted pipeline tracked across active accounts.</p>
      </div>
    </div>
  );
}

export function AppShell({
  activeItem,
  children,
  eyebrow = "Workspace",
  primaryActionLabel,
  summary,
  title,
  userEmail,
  workspaceName,
}: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-[#f4f7fb] text-[#111827]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[280px] overflow-y-auto border-r border-[#1e352b] bg-[#10231b] px-5 py-6 text-white lg:block">
        <SidebarContent activeItem={activeItem} summary={summary} workspaceName={workspaceName} />
      </aside>

      {sidebarOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Close sidebar"
            className="absolute inset-0 bg-[#07130e]/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
            type="button"
          />
          <aside className="absolute inset-y-0 left-0 w-[min(330px,calc(100vw-28px))] overflow-y-auto bg-[#10231b] px-5 py-5 text-white shadow-2xl">
            <div className="mb-8 flex justify-end">
              <button
                aria-label="Close sidebar"
                className="grid h-10 w-10 place-items-center rounded-lg bg-white/10 text-white hover:bg-white/15"
                onClick={() => setSidebarOpen(false)}
                type="button"
              >
                <X aria-hidden="true" size={20} strokeWidth={2.4} />
              </button>
            </div>
            <SidebarContent
              activeItem={activeItem}
              onNavigate={() => setSidebarOpen(false)}
              summary={summary}
              workspaceName={workspaceName}
            />
          </aside>
        </div>
      ) : null}

      <section className="min-w-0 lg:pl-[280px]">
        <header className="sticky top-0 z-20 border-b border-[#d9e2dc] bg-white/95 px-4 py-4 backdrop-blur sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <button
                aria-label="Open sidebar"
                className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-[#d9e2dc] bg-white text-[#10231b] shadow-sm hover:bg-[#f4f7fb] lg:hidden"
                onClick={() => setSidebarOpen(true)}
                type="button"
              >
                <Menu aria-hidden="true" size={21} strokeWidth={2.4} />
              </button>
              <div className="min-w-0">
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#66756c]">{eyebrow}</p>
                <h1 className="mt-1 truncate text-3xl font-black tracking-tight text-[#10231b] sm:text-4xl">
                  {title}
                </h1>
              </div>
            </div>

            <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto] xl:w-auto">
              <div className="min-w-0 rounded-lg border border-[#d9e2dc] bg-[#f8faf7] px-4 py-3 text-sm font-semibold text-[#536258] shadow-sm">
                <span className="block truncate">{userEmail}</span>
              </div>
              {primaryActionLabel ? (
                <AddClientDialog label={primaryActionLabel} />
              ) : null}
              <button
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#d9e2dc] bg-white px-5 py-3 text-sm font-black text-[#10231b] shadow-sm hover:bg-[#f4f7fb]"
                onClick={() => signOut({ callbackUrl: "/login" })}
                type="button"
              >
                <LogOut aria-hidden="true" size={17} strokeWidth={2.6} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </header>

        {children}
      </section>
    </main>
  );
}
