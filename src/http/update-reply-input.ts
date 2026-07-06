import { HttpError } from "./http-error.js";
import type { UpdateReplyInput, UpdateReplyRequest } from "../types.js";

export function normalizeUpdateReplyInput(
  request: UpdateReplyRequest,
  pathCommentId: string | null,
): UpdateReplyInput {
  return {
    body: requireString(request.body, "body"),
    commentId:
      pathCommentId || requireString(request.commentId, "commentId"),
    installationId: optionalNumber(request.installationId, "installationId"),
    owner: requireString(request.owner, "owner"),
    repo: requireString(request.repo, "repo"),
  };
}

function requireString(value: unknown, field: string): string {
  const normalized = optionalString(value, field);

  if (!normalized) {
    throw new HttpError(400, `${field} is required`);
  }

  return normalized;
}

function optionalString(value: unknown, field: string): string | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  if (typeof value !== "string") {
    throw new HttpError(400, `${field} must be a string`);
  }

  const normalized = value.trim();

  return normalized.length > 0 ? normalized : null;
}

function optionalNumber(value: unknown, field: string): number | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const number =
    typeof value === "number" ? value : Number.parseInt(String(value), 10);

  if (!Number.isInteger(number) || number <= 0) {
    throw new HttpError(400, `${field} must be a positive integer`);
  }

  return number;
}
