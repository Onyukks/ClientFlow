import { getApiSession } from "@/lib/api/auth";
import { badRequest, fromResult, notFound, ok, readJson, serverError, unauthorized } from "@/lib/api/http";
import { deleteClient, getClientDetail, updateClient } from "@/lib/api/service";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ clientId: string }> };

export async function GET(request: Request, { params }: Context) {
  const session = await getApiSession(request);

  if (!session) {
    return unauthorized();
  }

  const { clientId } = await params;

  try {
    const client = await getClientDetail(session.workspaceId, clientId);
    return client ? ok(client) : notFound("Client was not found.");
  } catch {
    return serverError();
  }
}

export async function PATCH(request: Request, { params }: Context) {
  const session = await getApiSession(request);

  if (!session) {
    return unauthorized();
  }

  const { clientId } = await params;
  const body = await readJson(request);

  if (!body) {
    return badRequest("Invalid request body.");
  }

  try {
    return fromResult(await updateClient(session, clientId, body));
  } catch {
    return serverError();
  }
}

export async function DELETE(request: Request, { params }: Context) {
  const session = await getApiSession(request);

  if (!session) {
    return unauthorized();
  }

  const { clientId } = await params;

  try {
    return fromResult(await deleteClient(session, clientId));
  } catch {
    return serverError();
  }
}
