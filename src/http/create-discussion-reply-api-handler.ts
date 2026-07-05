import type { IncomingMessage, ServerResponse } from "node:http";
import type { Probot } from "probot";
import { DISCUSSION_REPLY_API_PATH } from "../constants.js";
import { getConfig } from "../config.js";
import { assertApiAuthorized } from "./assert-api-authorized.js";
import { createDiscussionReply } from "./create-discussion-reply.js";
import { normalizeCreateReplyInput } from "./create-reply-input.js";
import { HttpError } from "./http-error.js";
import { readJsonBody, sendJson } from "./json.js";
import type { CreateReplyRequest } from "../types.js";

export function createDiscussionReplyApiHandler(app: Probot) {
  return async (req: IncomingMessage, res: ServerResponse) => {
    const url = new URL(req.url ?? "/", "http://localhost");

    if (url.pathname !== DISCUSSION_REPLY_API_PATH) {
      return false;
    }

    if (req.method === "OPTIONS") {
      sendJson(res, 204, null);
      return true;
    }

    if (req.method !== "POST") {
      sendJson(res, 405, { error: "Method not allowed" });
      return true;
    }

    try {
      const config = getConfig();
      assertApiAuthorized(req, config);

      const body = await readJsonBody<CreateReplyRequest>(req);
      const result = await createDiscussionReply(
        app,
        normalizeCreateReplyInput(body),
      );

      sendJson(res, 201, result);
    } catch (error) {
      if (error instanceof HttpError) {
        sendJson(res, error.status, { error: error.message });
        return true;
      }

      app.log.error({ error }, "Failed to create discussion reply");
      sendJson(res, 500, { error: "Internal server error" });
    }

    return true;
  };
}
