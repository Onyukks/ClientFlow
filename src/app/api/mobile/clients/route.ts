import { getApiSession } from "@/lib/api/auth";
import { badRequest, fromResult, ok, readJson, serverError, unauthorized } from "@/lib/api/http";
import { createClient, listClients } from "@/lib/api/service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getApiSession(request);

  if (!session) {
    return unauthorized();
  }

  try {
    return ok({ clients: await listClients(session.workspaceId) });
  } catch {
    return serverError();
  }
}

export async function POST(request: Request) {
  const session = await getApiSession(request);

  if (!session) {
    return unauthorized();
  }

  const body = await readJson(request);

  if (!body) {
    return badRequest("Invalid request body.");
  }

  try {
    return fromResult(await createClient(session, body), 201);
  } catch {
    return serverError();
  }
}
