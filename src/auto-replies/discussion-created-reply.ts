import type { BotConfig } from "../types.js";

const NEW_GAME_REQUEST_TITLE = "新游戏请求";
const NEW_GAME_REQUEST_REPLY = [
  "感谢您提交的游戏申请.",
  "",
  "我已帮你通知 @3DMXM 了, 当他看到的时候会尽快处理您的申请.",
].join("\n");

export function getDiscussionCreatedReplyBody(
  title: string,
  config: BotConfig,
): string | null {
  if (title.includes(NEW_GAME_REQUEST_TITLE)) {
    return NEW_GAME_REQUEST_REPLY;
  }

  if (!config.replyOnCreated || config.welcomeBody.length === 0) {
    return null;
  }

  return config.welcomeBody;
}
