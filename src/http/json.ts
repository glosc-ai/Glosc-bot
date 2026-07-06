import type { IncomingMessage, ServerResponse } from "node:http";
import { HttpError } from "./http-error.js";

export async function readJsonBody<T>(req: IncomingMessage): Promise<T> {
  const chunks: Buffer[] = [];

  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const raw = Buffer.concat(chunks).toString("utf8");

  if (!raw.trim()) {
    return {} as T;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new HttpError(400, "Request body must be valid JSON");
  }
}

export function sendJson(
  res: ServerResponse,
  status: number,
  body: unknown,
): void {
  res.writeHead(status, {
    "access-control-allow-headers": "authorization, content-type, x-glosc-token",
    "access-control-allow-methods": "POST, PATCH, OPTIONS",
    "access-control-allow-origin": "*",
    "content-type": "application/json; charset=utf-8",
  });
  res.end(body === null ? "" : JSON.stringify(body));
}
