import { DEFAULT_LIST_LIMIT, MAX_LIST_LIMIT } from "../constants.js";

export function parseLimit(args: string): number {
  const limit = Number.parseInt(args, 10);

  if (Number.isNaN(limit)) {
    return DEFAULT_LIST_LIMIT;
  }

  return Math.max(1, Math.min(MAX_LIST_LIMIT, limit));
}
