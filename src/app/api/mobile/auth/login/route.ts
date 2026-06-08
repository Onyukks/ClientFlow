import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signMobileToken } from "@/lib/api/auth";
import { badRequest, error, ok, readJson, serverError } from "@/lib/api/http";
import type { MobileAuthResponse } from "@/types/mobile";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await readJson(request);

  if (!body) {
    return badRequest("Invalid request body.");
  }

  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");

  if (!email || !password) {
    return badRequest("Email and password are required.");
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        memberships: { include: { workspace: true }, orderBy: { createdAt: "asc" }, take: 1 },
      },
    });

    // Same generic message whether the email or password is wrong.
    if (!user || !(await compare(password, user.passwordHash))) {
      return error(401, "Invalid email or password.");
    }

    const workspace = user.memberships[0]?.workspace;

    if (!workspace) {
      return error(403, "This account has no workspace yet.");
    }

    const token = await signMobileToken({
      userId: user.id,
      workspaceId: workspace.id,
      workspaceSlug: workspace.slug,
    });

    const response: MobileAuthResponse = {
      token,
      user: { id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl },
      workspace: { id: workspace.id, name: workspace.name, slug: workspace.slug },
    };

    return ok(response);
  } catch {
    return serverError();
  }
}
