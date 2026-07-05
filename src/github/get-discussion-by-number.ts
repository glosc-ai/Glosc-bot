import type { ProbotOctokit } from "probot";
import { GET_DISCUSSION_BY_NUMBER } from "../graphql.js";
import { HttpError } from "../http/http-error.js";
import type { DiscussionLookup, DiscussionLookupResponse } from "../types.js";

export async function getDiscussionByNumber(
  octokit: ProbotOctokit,
  owner: string,
  repo: string,
  number: number | null,
): Promise<DiscussionLookup | null> {
  if (number === null) {
    throw new HttpError(400, "discussionNumber is required when discussionId is not provided");
  }

  const data = await octokit.graphql<DiscussionLookupResponse>(
    GET_DISCUSSION_BY_NUMBER,
    {
      number,
      owner,
      repo,
    },
  );

  return data.repository?.discussion ?? null;
}
