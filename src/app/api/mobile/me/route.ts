import { prisma } from "@/lib/prisma";
import { getApiSession } from "@/lib/api/auth";
import { notFound, ok, serverError, unauthorized } from "@/lib/api/http";
import type { MobileAuthResponse } from "@/types/mobile";

export const dynamic = "force-dynamic";

// Lets the app validate a stored token on launch and refresh user/workspace info.
export async function GET(request: Request) {
  const session = await getApiSession(request);

  if (!session) {
    return unauthorized();
  }

  try {
    const [user, workspace] = await Promise.all([
      prisma.user.findUnique({ where: { id: session.userId } }),
      prisma.workspace.findUnique({ where: { id: session.workspaceId } }),
    ]);

    if (!user || !workspace) {
      return notFound("Account was not found.");
    }

    const response: Omit<MobileAuthResponse, "token"> = {
      user: { id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl },
      workspace: { id: workspace.id, name: workspace.name, slug: workspace.slug },
    };

    return ok(response);
  } catch {
    return serverError();
  }
}
