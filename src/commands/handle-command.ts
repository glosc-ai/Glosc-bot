import { formatHelp } from "../formatters/help.js";
import { markAnswer } from "./mark-answer.js";
import { parseLimit } from "./parse-limit.js";
import { replyToCommand } from "./reply-to-command.js";
import { replyWithDiscussionInfo } from "./reply-with-discussion-info.js";
import { replyWithLatestDiscussions } from "./reply-with-latest-discussions.js";
import { unmarkAnswer } from "./unmark-answer.js";
import type {
  BotConfig,
  Command,
  DiscussionCommentCreatedContext,
} from "../types.js";

export async function handleCommand(
  context: DiscussionCommentCreatedContext,
  command: Command,
  config: BotConfig,
): Promise<void> {
  switch (command.name) {
    case "help":
      await replyToCommand(context, formatHelp(config.commandPrefix));
      return;
    case "info":
      await replyWithDiscussionInfo(context);
      return;
    case "latest":
    case "list":
      await replyWithLatestDiscussions(context, parseLimit(command.args));
      return;
    case "mark-answer":
      await markAnswer(context, command.args, config.commandPrefix);
      return;
    case "unmark-answer":
      await unmarkAnswer(context, command.args, config.commandPrefix);
      return;
    default:
      await replyToCommand(
        context,
        `Unknown command \`${command.name}\`. Try \`${config.commandPrefix} help\`.`,
      );
      return;
  }
}
