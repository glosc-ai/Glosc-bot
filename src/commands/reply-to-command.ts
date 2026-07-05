import { addDiscussionComment } from "../github/add-discussion-comment.js";
import type { DiscussionCommentCreatedContext } from "../types.js";

export async function replyToCommand(
  context: DiscussionCommentCreatedContext,
  body: string,
): Promise<void> {
  await addDiscussionComment(
    context.octokit,
    context.payload.discussion.node_id,
    body,
    context.payload.comment.node_id,
  );
}
