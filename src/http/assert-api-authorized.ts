import type { IncomingMessage } from "node:http";
import { HttpError } from "./http-error.js";
import type { BotConfig } from "../types.js";

export function assertApiAuthorized(
  req: IncomingMessage,
  config: BotConfig,
): void {
  if (!config.apiToken) {
    return;
  }

  const authorization = Array.isArray(req.headers.authorization)
    ? req.headers.authorization[0]
    : req.headers.authorization;
  const headerToken = Array.isArray(req.headers["x-glosc-token"])
    ? req.headers["x-glosc-token"][0]
    : req.headers["x-glosc-token"];
  const bearerToken = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length).trim()
    : null;

  if (bearerToken !== config.apiToken && headerToken !== config.apiToken) {
    throw new HttpError(401, "Unauthorized");
  }
}
