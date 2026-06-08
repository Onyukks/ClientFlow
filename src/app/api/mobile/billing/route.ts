import { getApiSession } from "@/lib/api/auth";
import { notFound, ok, serverError, unauthorized } from "@/lib/api/http";
import { getBilling } from "@/lib/api/service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getApiSession(request);

  if (!session) {
    return unauthorized();
  }

  try {
    const billing = await getBilling(session.workspaceId);
    return billing ? ok(billing) : notFound("Workspace was not found.");
  } catch {
    return serverError();
  }
}
