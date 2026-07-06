import type { ProbotOctokit } from "probot";
import { UPDATE_DISCUSSION_COMMENT } from "../graphql.js";
import type {
  DiscussionComment,
  UpdateDiscussionCommentResponse,
} from "../types.js";

export async function updateDiscussionComment(
  octokit: ProbotOctokit,
  commentId: string,
  body: string,
): Promise<DiscussionComment> {
  const data = await octokit.graphql<UpdateDiscussionCommentResponse>(
    UPDATE_DISCUSSION_COMMENT,
    {
      body,
      commentId,
    },
  );
  const comment = data.updateDiscussionComment?.comment;

  if (!comment) {
    throw new Error("GitHub did not return the updated discussion comment");
  }

  return comment;
}
