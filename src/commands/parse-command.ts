import type { Command } from "../types.js";

export function parseCommand(body: string, prefix: string): Command | null {
  const firstLine = body
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line.length > 0);

  if (firstLine !== prefix && !firstLine?.startsWith(`${prefix} `)) {
    return null;
  }

  const text = firstLine.slice(prefix.length).trim();

  if (text.length === 0) {
    return { args: "", name: "help" };
  }

  const [name = "", ...rest] = text.split(/\s+/);

  return {
    args: rest.join(" "),
    name: name.toLowerCase(),
  };
}
