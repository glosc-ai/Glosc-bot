import type { Probot } from "probot";
import { updateDiscussionComment } from "../github/update-discussion-comment.js";
import { getInstallationOctokit } from "../github/get-installation-octokit.js";
import type { UpdateReplyInput, UpdateReplyResult } from "../types.js";

export async function updateDiscussionReply(
  app: Probot,
  input: UpdateReplyInput,
): Promise<UpdateReplyResult> {
  const octokit = await getInstallationOctokit(
    app,
    input.owner,
    input.repo,
    input.installationId,
  );
  const comment = await updateDiscussionComment(
    octokit,
    input.commentId,
    input.body,
  );

  return { comment };
}
