import { getApiSession } from "@/lib/api/auth";
import { badRequest, fromResult, readJson, serverError, unauthorized } from "@/lib/api/http";
import { updateTask } from "@/lib/api/service";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ taskId: string }> };

export async function PATCH(request: Request, { params }: Context) {
  const session = await getApiSession(request);

  if (!session) {
    return unauthorized();
  }

  const { taskId } = await params;
  const body = await readJson(request);

  if (!body) {
    return badRequest("Invalid request body.");
  }

  try {
    return fromResult(await updateTask(session, taskId, body));
  } catch {
    return serverError();
  }
}
