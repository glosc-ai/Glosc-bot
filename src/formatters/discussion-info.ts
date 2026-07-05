import { cleanText, truncate } from "../utils/text.js";
import type { DiscussionCommentNode, DiscussionInfo } from "../types.js";

export function formatDiscussionInfo(
  discussion: DiscussionInfo | null | undefined,
): string {
  if (!discussion) {
    return "I could not find this discussion.";
  }

  const recentComments = (discussion.comments.nodes ?? [])
    .filter((comment): comment is DiscussionCommentNode => comment !== null)
    .map((comment) => {
      const author = comment.author?.login ?? "unknown";
      const answerBadge = comment.isAnswer ? " answer" : "";
      const excerpt = truncate(cleanText(comment.bodyText), 120);

      return `- ${author}${answerBadge}: ${excerpt}\n  ${comment.url}\n  node: \`${comment.id}\``;
    });
  const answer = discussion.answer
    ? `${discussion.answer.author?.login ?? "unknown"} - ${discussion.answer.url}`
    : "not chosen";

  return [
    `Discussion #${discussion.number}: ${discussion.title}`,
    discussion.url,
    "",
    `Author: ${discussion.author?.login ?? "unknown"}`,
    `Category: ${discussion.category.name} (${discussion.category.isAnswerable ? "answerable" : "not answerable"})`,
    `Answered: ${discussion.isAnswered ? "yes" : "no"}`,
    `Answer: ${answer}`,
    `Comments: ${discussion.comments.totalCount}`,
    `Upvotes: ${discussion.upvoteCount}`,
    "",
    "Recent comments:",
    recentComments.length ? recentComments.join("\n") : "No comments yet.",
  ].join("\n");
}
