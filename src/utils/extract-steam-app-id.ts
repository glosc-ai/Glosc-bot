const STEAM_LINK_LINE_PATTERN = /(游戏官网|商店|Steam).*地址/;
const STEAM_APP_ID_PATTERN = /store\.steampowered\.com\/app\/(\d+)/;

export function extractSteamAppId(body: string): string | null {
  const lines = body.split(/\r?\n/);
  const steamLine = lines.find((line) => STEAM_LINK_LINE_PATTERN.test(line));

  if (!steamLine) {
    return null;
  }

  const match = STEAM_APP_ID_PATTERN.exec(steamLine);

  return match ? match[1] : null;
}
