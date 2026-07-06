import { DEFAULT_COMMAND_PREFIX } from "./constants.js";
import type { BotConfig } from "./types.js";

export function getConfig(): BotConfig {
    const commandPrefix =
        process.env.DISCUSSION_COMMAND_PREFIX?.trim() || DEFAULT_COMMAND_PREFIX;

    // 当标题包含 “新游戏请求” 的时候返回
    if (process.env.DISCUSSION_TITLE?.includes("新游戏请求")) {
        return {
            apiToken: process.env.DISCUSSION_API_TOKEN?.trim() || null,
            commandPrefix,
            replyOnCreated: parseBooleanEnv(
                process.env.DISCUSSION_REPLY_ON_CREATED,
                true,
            ),
            welcomeBody:
                process.env.DISCUSSION_WELCOME_BODY?.trim() ||
                [
                    "感谢您提交的游戏申请.",
                    "",
                    "我已帮你通知 @3DMXM 了, 当他看到的时候会尽快处理您的申请.",
                ].join("\n"),
        };
    } else {
        return {
            apiToken: process.env.DISCUSSION_API_TOKEN?.trim() || null,
            commandPrefix,
            replyOnCreated: parseBooleanEnv(
                process.env.DISCUSSION_REPLY_ON_CREATED,
                true,
            ),
            welcomeBody:
                process.env.DISCUSSION_WELCOME_BODY?.trim() ||
                [
                    "感谢您提交的游戏申请.",
                    "",
                    "我已帮你通知 @3DMXM 了, 当他看到的时候会尽快处理您的申请.",
                ].join("\n"),
        };
    }
}

function parseBooleanEnv(
    value: string | undefined,
    defaultValue: boolean,
): boolean {
    if (value === undefined) {
        return defaultValue;
    }

    return !["0", "false", "no", "off"].includes(value.trim().toLowerCase());
}
