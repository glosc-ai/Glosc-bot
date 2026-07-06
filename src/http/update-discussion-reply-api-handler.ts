import type { IncomingMessage, ServerResponse } from "node:http";
import type { Probot } from "probot";
import { DISCUSSION_REPLY_API_PATH_PATTERN } from "../constants.js";
import { getConfig } from "../config.js";
import { assertApiAuthorized } from "./assert-api-authorized.js";
import { HttpError } from "./http-error.js";
import { readJsonBody, sendJson } from "./json.js";
import { updateDiscussionReply } from "./update-discussion-reply.js";
import { normalizeUpdateReplyInput } from "./update-reply-input.js";
import type { UpdateReplyRequest } from "../types.js";

export function createUpdateDiscussionReplyApiHandler(app: Probot) {
  return async (req: IncomingMessage, res: ServerResponse) => {
    const url = new URL(req.url ?? "/", "http://localhost");
    const match = url.pathname.match(DISCUSSION_REPLY_API_PATH_PATTERN);

    if (!match) {
      return false;
    }

    if (req.method === "OPTIONS") {
      sendJson(res, 204, null);
      return true;
    }

    if (req.method !== "PATCH") {
      sendJson(res, 405, { error: "Method not allowed" });
      return true;
    }

    try {
      const config = getConfig();
      assertApiAuthorized(req, config);

      const body = await readJsonBody<UpdateReplyRequest>(req);
      const result = await updateDiscussionReply(
        app,
        normalizeUpdateReplyInput(
          body,
          match.groups?.commentId
            ? decodeURIComponent(match.groups.commentId)
            : null,
        ),
      );

      sendJson(res, 200, result);
    } catch (error) {
      if (error instanceof HttpError) {
        sendJson(res, error.status, { error: error.message });
        return true;
      }

      app.log.error({ error }, "Failed to update discussion reply");
      sendJson(res, 500, { error: "Internal server error" });
    }

    return true;
  };
}
