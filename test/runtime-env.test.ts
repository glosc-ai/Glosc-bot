import { createPrivateKey } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";
import { getRuntimeEnv, normalizePrivateKeyEnv } from "../src/runtime-env.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const privateKey = readFileSync(
  path.join(__dirname, "fixtures/mock-cert.pem"),
  "utf8",
);

describe("runtime environment", () => {
  test("normalizes quoted multiline private keys", () => {
    const normalized = normalizePrivateKeyEnv(`"${privateKey}"`);

    expect(() => createPrivateKey(normalized)).not.toThrow();
  });

  test("normalizes quoted escaped-newline private keys", () => {
    const normalized = normalizePrivateKeyEnv(
      `"${privateKey.replace(/\n/g, "\\n")}"`,
    );

    expect(() => createPrivateKey(normalized)).not.toThrow();
  });

  test("normalizes quoted base64 private keys", () => {
    const normalized = normalizePrivateKeyEnv(
      `"${Buffer.from(privateKey).toString("base64")}"`,
    );

    expect(() => createPrivateKey(normalized)).not.toThrow();
  });

  test("loads .env values before normalizing the private key", () => {
    const cwd = mkdtempSync(path.join(tmpdir(), "glosc-env-"));

    try {
      writeFileSync(cwd + "/.env", `PRIVATE_KEY="${privateKey}"\nAPP_ID=123\n`);

      const env = getRuntimeEnv(cwd, {
        APP_ID: "456",
        PRIVATE_KEY: "not a key",
      });

      expect(env.APP_ID).toBe("123");
      expect(() => createPrivateKey(env.PRIVATE_KEY ?? "")).not.toThrow();
    } finally {
      rmSync(cwd, { force: true, recursive: true });
    }
  });
});
