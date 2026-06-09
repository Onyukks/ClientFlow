import { getApiSession } from "@/lib/api/auth";
import { badRequest, fromResult, readJson, serverError, unauthorized } from "@/lib/api/http";
import { createCheckoutSession } from "@/lib/api/service";

export const dynamic = "force-dynamic";

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
    return fromResult(await createCheckoutSession(session, String(body.plan ?? "")));
  } catch {
    return serverError();
  }
}
