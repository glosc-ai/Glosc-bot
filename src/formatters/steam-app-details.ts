import { cleanText, truncate } from "../utils/text.js";
import type { SteamAppDetails } from "../types.js";

const SHORT_DESCRIPTION_MAX_LENGTH = 200;

export function formatSteamAppDetails(details: SteamAppDetails): string {
  const lines = [`**${details.name}**`, `![封面](${details.headerImage})`];

  if (details.genres.length > 0) {
    lines.push(`类型: ${details.genres.join(", ")}`);
  }

  if (details.shortDescription.length > 0) {
    lines.push(
      truncate(cleanText(details.shortDescription), SHORT_DESCRIPTION_MAX_LENGTH),
    );
  }

  return lines.join("\n");
}
