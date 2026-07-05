import type { DiscussionListItem } from "../types.js";

export function formatDiscussionList(
  discussions: (DiscussionListItem | null)[] | null | undefined,
): string {
  const items = (discussions ?? []).filter(
    (discussion): discussion is DiscussionListItem => discussion !== null,
  );

  if (items.length === 0) {
    return "No discussions found for this repository.";
  }

  return [
    "Latest discussions:",
    "",
    ...items.map((discussion) => {
      const status = discussion.isAnswered ? "answered" : "open";
      const author = discussion.author?.login ?? "unknown";

      return [
        `- #${discussion.number} ${discussion.title}`,
        `  ${discussion.url}`,
        `  ${discussion.category.name}; ${status}; ${discussion.comments.totalCount} comments; by ${author}`,
      ].join("\n");
    }),
  ].join("\n");
}
