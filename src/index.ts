import type { ApplicationFunctionOptions, Probot } from "probot";
import { getDiscussionCreatedReplyBody } from "./auto-replies/discussion-created-reply.js";
import { handleCommand } from "./commands/handle-command.js";
import { parseCommand } from "./commands/parse-command.js";
import { replyToCommand } from "./commands/reply-to-command.js";
import { getConfig } from "./config.js";
import { addDiscussionComment } from "./github/add-discussion-comment.js";
import { createDiscussionReplyApiHandler } from "./http/create-discussion-reply-api-handler.js";
import type {
    DiscussionCommentCreatedContext,
    DiscussionCreatedContext,
} from "./types.js";

export default (app: Probot, options: ApplicationFunctionOptions) => {
    options.addHandler(createDiscussionReplyApiHandler(app));

    app.on("discussion.created", async (context) => {
        await handleDiscussionCreated(context);
    });

    app.on("discussion_comment.created", async (context) => {
        await handleDiscussionCommentCreated(context);
    });
};

async function handleDiscussionCreated(
    context: DiscussionCreatedContext,
): Promise<void> {
    try {
        const config = getConfig();
        const replyBody = await getDiscussionCreatedReplyBody(
            context.payload.discussion.title,
            config,
            context.payload.discussion.body ?? "",
        );

        if (!replyBody) {
            return;
        }

        await addDiscussionComment(
            context.octokit,
            context.payload.discussion.node_id,
            replyBody,
        );
    } catch (error) {
        context.log.error(
            { err: error },
            "Failed to handle discussion.created webhook",
        );
    }
}

async function handleDiscussionCommentCreated(
    context: DiscussionCommentCreatedContext,
): Promise<void> {
    try {
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
            context.log.error(
                { err: error },
                "Failed to handle discussion command",
            );
            try {
                await replyToCommand(
                    context,
                    "I could not complete that discussion command. Check the bot logs for details.",
                );
            } catch (replyError) {
                context.log.error(
                    { err: replyError },
                    "Failed to send discussion command failure reply",
                );
            }
        }
    } catch (error) {
        context.log.error(
            { err: error },
            "Failed to handle discussion_comment.created webhook",
        );
    }
}
