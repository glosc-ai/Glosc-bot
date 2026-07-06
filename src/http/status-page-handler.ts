import type { IncomingMessage, ServerResponse } from "node:http";

const STATUS_PAGE = [
  "<!doctype html>",
  "<html>",
  "<head><title>glosc-bot</title></head>",
  "<body><h1>glosc-bot</h1><p>Probot app is running.</p></body>",
  "</html>",
].join("");

export function createStatusPageHandler() {
  return async (req: IncomingMessage, res: ServerResponse) => {
    if (req.method !== "GET") {
      return false;
    }

    const path = req.url?.split("?")[0] || "";

    if (path === "/") {
      res.writeHead(302, { "content-type": "text/plain", location: "/probot" });
      res.end("Found. Redirecting to /probot");
      return true;
    }

    if (path === "/probot") {
      res.writeHead(200, { "content-type": "text/html" });
      res.end(STATUS_PAGE);
      return true;
    }

    return false;
  };
}
