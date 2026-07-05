import type { SteamAppDetails } from "../types.js";

const STEAM_APP_DETAILS_URL = "https://store.steampowered.com/api/appdetails";
const REQUEST_TIMEOUT_MS = 5000;

export async function getSteamAppDetails(
  appId: string,
): Promise<SteamAppDetails | null> {
  try {
    const url = new URL(STEAM_APP_DETAILS_URL);
    url.searchParams.set("appids", appId);
    url.searchParams.set("l", "schinese");

    const response = await fetch(url, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) {
      return null;
    }

    const payload = await response.json();
    const entry = payload?.[appId];

    if (!entry?.success || !entry.data) {
      return null;
    }

    const { data } = entry;

    if (
      typeof data.name !== "string" ||
      typeof data.header_image !== "string"
    ) {
      return null;
    }

    const genres = Array.isArray(data.genres)
      ? data.genres
          .map((genre: unknown) =>
            typeof genre === "object" && genre !== null && "description" in genre
              ? String((genre as { description: unknown }).description)
              : null,
          )
          .filter((genre: string | null): genre is string => genre !== null)
      : [];

    return {
      genres,
      headerImage: data.header_image,
      name: data.name,
      shortDescription:
        typeof data.short_description === "string"
          ? data.short_description
          : "",
    };
  } catch {
    return null;
  }
}
