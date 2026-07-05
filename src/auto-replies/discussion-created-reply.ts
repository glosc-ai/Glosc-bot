import { formatSteamAppDetails } from "../formatters/steam-app-details.js";
import { getSteamAppDetails } from "../steam/get-app-details.js";
import { extractSteamAppId } from "../utils/extract-steam-app-id.js";
import type { BotConfig } from "../types.js";

const NEW_GAME_REQUEST_TITLE = "新游戏请求";
const NEW_GAME_REQUEST_REPLY = [
  "感谢您提交的游戏申请.",
  "",
  "我已帮你通知 @3DMXM 了, 当他看到的时候会尽快处理您的申请.",
].join("\n");

export async function getDiscussionCreatedReplyBody(
  title: string,
  config: BotConfig,
  body: string,
): Promise<string | null> {
  if (title.includes(NEW_GAME_REQUEST_TITLE)) {
    return await buildNewGameRequestReply(body);
  }

  if (!config.replyOnCreated || config.welcomeBody.length === 0) {
    return null;
  }

  return config.welcomeBody;
}

async function buildNewGameRequestReply(body: string): Promise<string> {
  const appId = extractSteamAppId(body);

  if (!appId) {
    return NEW_GAME_REQUEST_REPLY;
  }

  const details = await getSteamAppDetails(appId);

  if (!details) {
    return NEW_GAME_REQUEST_REPLY;
  }

  return `${NEW_GAME_REQUEST_REPLY}\n\n${formatSteamAppDetails(details)}`;
}
