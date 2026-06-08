import { getApiSession } from "@/lib/api/auth";
import { badRequest, fromResult, readJson, serverError, unauthorized } from "@/lib/api/http";
import { deleteDeal, updateDeal } from "@/lib/api/service";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ dealId: string }> };

export async function DELETE(request: Request, { params }: Context) {
  const session = await getApiSession(request);

  if (!session) {
    return unauthorized();
  }

  const { dealId } = await params;

  try {
    return fromResult(await deleteDeal(session, dealId));
  } catch {
    return serverError();
  }
}

export async function PATCH(request: Request, { params }: Context) {
  const session = await getApiSession(request);

  if (!session) {
    return unauthorized();
  }

  const { dealId } = await params;
  const body = await readJson(request);

  if (!body) {
    return badRequest("Invalid request body.");
  }

  try {
    return fromResult(await updateDeal(session, dealId, body));
  } catch {
    return serverError();
  }
}
