import type { ProbotOctokit } from "probot";
import { ADD_DISCUSSION_COMMENT } from "../graphql.js";
import type {
  AddDiscussionCommentResponse,
  DiscussionComment,
} from "../types.js";

export async function addDiscussionComment(
  octokit: ProbotOctokit,
  discussionId: string,
  body: string,
  replyToId: string | null = null,
): Promise<DiscussionComment> {
  const data = await octokit.graphql<AddDiscussionCommentResponse>(
    ADD_DISCUSSION_COMMENT,
    {
      body,
      discussionId,
      replyToId,
    },
  );
  const comment = data.addDiscussionComment?.comment;

  if (!comment) {
    throw new Error("GitHub did not return the created discussion comment");
  }

  return comment;
}
