import type { Probot } from "probot";
import { addDiscussionComment } from "../github/add-discussion-comment.js";
import { getDiscussionByNumber } from "../github/get-discussion-by-number.js";
import { getInstallationOctokit } from "../github/get-installation-octokit.js";
import { HttpError } from "./http-error.js";
import type {
  CreateReplyInput,
  CreateReplyResult,
  DiscussionLookup,
} from "../types.js";

export async function createDiscussionReply(
  app: Probot,
  input: CreateReplyInput,
): Promise<CreateReplyResult> {
  const octokit = await getInstallationOctokit(
    app,
    input.owner,
    input.repo,
    input.installationId,
  );
  const discussion = input.discussionId
    ? buildKnownDiscussion(input.discussionId, input.discussionNumber)
    : await getDiscussionByNumber(
        octokit,
        input.owner,
        input.repo,
        input.discussionNumber,
      );

  if (!discussion) {
    throw new HttpError(404, "Discussion not found");
  }

  const comment = await addDiscussionComment(
    octokit,
    discussion.id,
    input.body,
    input.replyToId,
  );

  return {
    comment,
    discussion,
  };
}

function buildKnownDiscussion(
  discussionId: string,
  discussionNumber: number | null,
): DiscussionLookup {
  return {
    id: discussionId,
    number: discussionNumber,
    title: null,
    url: null,
  };
}
