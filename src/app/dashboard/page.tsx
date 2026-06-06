import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { DashboardShell } from "@/components/dashboard-shell";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <DashboardShell
      userEmail={session.user.email ?? "demo@clientflow.app"}
      userName={session.user.name ?? "Demo User"}
      workspaceSlug={session.user.workspaceSlug}
    />
  );
}
