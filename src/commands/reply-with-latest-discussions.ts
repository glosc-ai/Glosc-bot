import { formatDiscussionList } from "../formatters/discussion-list.js";
import { LIST_DISCUSSIONS } from "../graphql.js";
import { replyToCommand } from "./reply-to-command.js";
import type {
  DiscussionCommentCreatedContext,
  DiscussionListResponse,
} from "../types.js";

export async function replyWithLatestDiscussions(
  context: DiscussionCommentCreatedContext,
  limit: number,
): Promise<void> {
  const repo = context.repo();
  const data = await context.octokit.graphql<DiscussionListResponse>(
    LIST_DISCUSSIONS,
    {
      limit,
      owner: repo.owner,
      repo: repo.repo,
    },
  );

  await replyToCommand(context, formatDiscussionList(data.repository?.discussions.nodes));
}
