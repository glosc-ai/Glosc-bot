import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseEnv } from "node:util";

export function getRuntimeEnv(
  cwd = process.cwd(),
  env: NodeJS.ProcessEnv = process.env,
): NodeJS.ProcessEnv {
  return normalizeRuntimeEnv({
    ...env,
    ...loadDotEnv(cwd),
  });
}

export function normalizeRuntimeEnv(
  env: NodeJS.ProcessEnv,
): NodeJS.ProcessEnv {
  const normalized = { ...env };

  if (normalized.PRIVATE_KEY) {
    normalized.PRIVATE_KEY = normalizePrivateKeyEnv(normalized.PRIVATE_KEY);
  }

  return normalized;
}

export function normalizePrivateKeyEnv(privateKey: string): string {
  const unquoted = stripOuterQuotes(privateKey.trim()).trim();
  const normalizedLineEndings = unquoted
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\r\n?/g, "\n")
    .trim();

  return decodeBase64PrivateKey(normalizedLineEndings) ?? normalizedLineEndings;
}

function loadDotEnv(cwd: string): NodeJS.ProcessEnv {
  try {
    return parseEnv(readFileSync(join(cwd, ".env"), "utf8"));
  } catch (error) {
    if (isNodeError(error) && error.code === "ENOENT") {
      return {};
    }

    throw error;
  }
}

function stripOuterQuotes(value: string): string {
  const firstCharacter = value[0];

  if (
    (firstCharacter === `"` || firstCharacter === `'`) &&
    value.at(-1) === firstCharacter
  ) {
    return value.slice(1, -1);
  }

  return value;
}

function decodeBase64PrivateKey(value: string): string | null {
  const compactValue = value.replace(/\s+/g, "");

  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(compactValue)) {
    return null;
  }

  try {
    const decoded = Buffer.from(compactValue, "base64").toString("utf8");

    if (decoded.includes("-----BEGIN") && decoded.includes("PRIVATE KEY-----")) {
      return normalizePrivateKeyEnv(decoded);
    }
  } catch {
    return null;
  }

  return null;
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
}
