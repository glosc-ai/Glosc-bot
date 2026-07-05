import { HttpError } from "./http-error.js";
import type { CreateReplyInput, CreateReplyRequest } from "../types.js";

export function normalizeCreateReplyInput(
  request: CreateReplyRequest,
): CreateReplyInput {
  const owner = requireString(request.owner, "owner");
  const repo = requireString(request.repo, "repo");
  const body = requireString(request.body, "body");
  const discussionId = optionalString(request.discussionId, "discussionId");
  const discussionNumber = optionalNumber(
    request.discussionNumber,
    "discussionNumber",
  );

  if (!discussionId && discussionNumber === null) {
    throw new HttpError(400, "discussionId or discussionNumber is required");
  }

  return {
    body,
    discussionId,
    discussionNumber,
    installationId: optionalNumber(request.installationId, "installationId"),
    owner,
    replyToId: optionalString(request.replyToId, "replyToId"),
    repo,
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

  const number = typeof value === "number" ? value : Number.parseInt(String(value), 10);

  if (!Number.isInteger(number) || number <= 0) {
    throw new HttpError(400, `${field} must be a positive integer`);
  }

  return number;
}
