import { run } from "probot";
import app from "./index.js";
import { getRuntimeEnv } from "./runtime-env.js";

const env = getRuntimeEnv();

Object.assign(process.env, env);

try {
  await run(app, { env });
} catch (error) {
  console.error(error);
  process.exit(1);
}
