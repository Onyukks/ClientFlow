import { NextResponse } from "next/server";
import type { ServiceResult } from "@/lib/api/service";
import type { MobileApiError } from "@/types/mobile";

// Small, consistent JSON helpers so every mobile route returns the same shape.

export const ok = <T>(data: T): NextResponse => NextResponse.json(data);

export const created = <T>(data: T): NextResponse => NextResponse.json(data, { status: 201 });

export const error = (status: number, message: string, fields?: Record<string, string>): NextResponse => {
  const body: MobileApiError = { error: { message, ...(fields ? { fields } : {}) } };
  return NextResponse.json(body, { status });
};

export const badRequest = (message: string, fields?: Record<string, string>) => error(400, message, fields);
export const unauthorized = () => error(401, "Sign in to continue.");
export const notFound = (message = "Not found.") => error(404, message);
export const serverError = (message = "Something went wrong. Try again.") => error(500, message);

// Maps a service-layer result to an HTTP response with a consistent shape.
export function fromResult<T>(result: ServiceResult<T>, successStatus = 200): NextResponse {
  if (result.ok) {
    return NextResponse.json(result.data, { status: successStatus });
  }

  return error(result.status, result.message, result.fields);
}

// Parses a JSON request body, returning null on malformed input.
export async function readJson(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const body = await request.json();
    return body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  } catch {
    return null;
  }
}
