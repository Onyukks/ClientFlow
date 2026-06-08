import { getApiSession } from "@/lib/api/auth";
import { notFound, ok, serverError, unauthorized } from "@/lib/api/http";
import { getDashboard } from "@/lib/api/service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getApiSession(request);

  if (!session) {
    return unauthorized();
  }

  try {
    const dashboard = await getDashboard(session.workspaceId);
    return dashboard ? ok(dashboard) : notFound("Workspace was not found.");
  } catch {
    return serverError();
  }
}
