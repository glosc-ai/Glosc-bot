import { MAX_LIST_LIMIT } from "../constants.js";

export function formatHelp(prefix: string): string {
  return [
    "Glosc discussion bot commands:",
    "",
    `- \`${prefix} help\` - show this message.`,
    `- \`${prefix} info\` - fetch metadata and recent comments for this discussion.`,
    `- \`${prefix} latest [n]\` - list the latest repository discussions (1-${MAX_LIST_LIMIT}).`,
    `- \`${prefix} mark-answer <commentNodeId>\` - mark a discussion comment as the answer.`,
    `- \`${prefix} unmark-answer <commentNodeId>\` - remove the answer mark from a comment.`,
  ].join("\n");
}
