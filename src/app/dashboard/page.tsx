import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { DashboardShell } from "@/components/dashboard-shell";
import { getDashboardData } from "@/lib/dashboard-data";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.workspaceId) {
    redirect("/login");
  }

  const data = await getDashboardData(session.user.workspaceId);

  return (
    <DashboardShell
      data={data}
      userEmail={session.user.email ?? "demo@clientflow.app"}
      userName={session.user.name ?? "Demo User"}
      workspaceSlug={session.user.workspaceSlug}
    />
  );
}
