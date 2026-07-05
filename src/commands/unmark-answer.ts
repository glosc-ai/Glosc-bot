import { UNMARK_DISCUSSION_COMMENT_AS_ANSWER } from "../graphql.js";
import { parseNodeIdArg } from "./parse-node-id-arg.js";
import { replyToCommand } from "./reply-to-command.js";
import type { DiscussionCommentCreatedContext } from "../types.js";

export async function unmarkAnswer(
  context: DiscussionCommentCreatedContext,
  args: string,
  commandPrefix: string,
): Promise<void> {
  const commentId = parseNodeIdArg(args);

  if (!commentId) {
    await replyToCommand(
      context,
      `Usage: \`${commandPrefix} unmark-answer <discussion-comment-node-id>\``,
    );
    return;
  }

  await context.octokit.graphql(UNMARK_DISCUSSION_COMMENT_AS_ANSWER, {
    id: commentId,
  });
  await replyToCommand(context, `Removed the answer mark from \`${commentId}\`.`);
}
