import { DEFAULT_COMMENTS_LIMIT } from "../constants.js";
import { formatDiscussionInfo } from "../formatters/discussion-info.js";
import { GET_DISCUSSION_INFO } from "../graphql.js";
import { replyToCommand } from "./reply-to-command.js";
import type {
  DiscussionCommentCreatedContext,
  DiscussionInfoResponse,
} from "../types.js";

export async function replyWithDiscussionInfo(
  context: DiscussionCommentCreatedContext,
): Promise<void> {
  const repo = context.repo();
  const data = await context.octokit.graphql<DiscussionInfoResponse>(
    GET_DISCUSSION_INFO,
    {
      commentsLast: DEFAULT_COMMENTS_LIMIT,
      number: context.payload.discussion.number,
      owner: repo.owner,
      repo: repo.repo,
    },
  );

  await replyToCommand(context, formatDiscussionInfo(data.repository?.discussion));
}
