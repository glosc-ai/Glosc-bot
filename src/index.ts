import type { ApplicationFunctionOptions, Probot } from "probot";
import { getDiscussionCreatedReplyBody } from "./auto-replies/discussion-created-reply.js";
import { handleCommand } from "./commands/handle-command.js";
import { parseCommand } from "./commands/parse-command.js";
import { replyToCommand } from "./commands/reply-to-command.js";
import { getConfig } from "./config.js";
import { addDiscussionComment } from "./github/add-discussion-comment.js";
import { createDiscussionReplyApiHandler } from "./http/create-discussion-reply-api-handler.js";

export default (app: Probot, options: ApplicationFunctionOptions) => {
    options.addHandler(createDiscussionReplyApiHandler(app));

    app.on("discussion.created", async (context) => {
        const config = getConfig();
        const replyBody = getDiscussionCreatedReplyBody(
            context.payload.discussion.title,
            config,
        );

        if (!replyBody) {
            return;
        }

        await addDiscussionComment(
            context.octokit,
            context.payload.discussion.node_id,
            replyBody,
        );
    });

    app.on("discussion_comment.created", async (context) => {
        if (context.isBot) {
            return;
        }

        const config = getConfig();
        const command = parseCommand(
            context.payload.comment.body,
            config.commandPrefix,
        );

        if (!command) {
            return;
        }

        try {
            await handleCommand(context, command, config);
        } catch (error) {
            context.log.error({ error }, "Failed to handle discussion command");
            await replyToCommand(
                context,
                "I could not complete that discussion command. Check the bot logs for details.",
            );
        }
    });
};
