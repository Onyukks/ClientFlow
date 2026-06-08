import { SignJWT, jwtVerify } from "jose";

// Mobile clients can't use the cookie-based Auth.js session, so they get a
// bearer JWT signed with the same AUTH_SECRET. 30-day expiry to match a
// "stay signed in" mobile experience.

export type MobileSession = {
  userId: string;
  workspaceId: string;
  workspaceSlug: string;
};

const TOKEN_TTL = "30d";

const getSecret = () => {
  const value = process.env.AUTH_SECRET;

  if (!value) {
    throw new Error("AUTH_SECRET must be set.");
  }

  return new TextEncoder().encode(value);
};

export async function signMobileToken(session: MobileSession): Promise<string> {
  return new SignJWT({
    workspaceId: session.workspaceId,
    workspaceSlug: session.workspaceSlug,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(session.userId)
    .setIssuedAt()
    .setExpirationTime(TOKEN_TTL)
    .sign(getSecret());
}

export async function verifyMobileToken(token: string): Promise<MobileSession | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());

    if (typeof payload.sub !== "string" || typeof payload.workspaceId !== "string") {
      return null;
    }

    return {
      userId: payload.sub,
      workspaceId: payload.workspaceId,
      workspaceSlug: typeof payload.workspaceSlug === "string" ? payload.workspaceSlug : "",
    };
  } catch {
    return null;
  }
}

// Reads the Authorization: Bearer <token> header and resolves the session.
// Returns null on any missing/invalid token so callers can answer 401.
export async function getApiSession(request: Request): Promise<MobileSession | null> {
  const header = request.headers.get("authorization");

  if (!header?.toLowerCase().startsWith("bearer ")) {
    return null;
  }

  const token = header.slice(7).trim();

  if (!token) {
    return null;
  }

  return verifyMobileToken(token);
}
