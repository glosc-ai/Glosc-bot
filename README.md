# glosc-bot

> A GitHub App built with [Probot](https://github.com/probot/probot) for replying to, fetching, and managing GitHub Discussions.

## Features

- Exposes an HTTP API for another service to create GitHub Discussion replies.
- Replies to newly created discussions with a configurable welcome message.
- Handles discussion comment commands with threaded bot replies.
- Fetches the current discussion summary and recent comments.
- Lists the latest repository discussions.
- Marks or unmarks a discussion comment as the chosen answer.

## Current capabilities

This bot currently focuses on GitHub Discussions. It provides two main groups of features:

### External HTTP API

Other projects can call the bot to create replies in GitHub Discussions.

- Create a reply under a specific Discussion with `POST /api/discussions/replies`.
- Locate the Discussion by `owner`, `repo`, and `discussionNumber`.
- Or pass `discussionId` directly if the caller already has the GitHub Discussion node ID.
- Optionally pass `replyToId` to create a threaded reply under an existing Discussion comment.
- Optionally pass `installationId`; if omitted, the bot looks up the GitHub App installation for the repository.
- Protect the endpoint with `DISCUSSION_API_TOKEN` using `Authorization: Bearer <token>`.

### Discussion bot commands

Inside a GitHub Discussion comment, users can run:

- `/glosc help` - show available bot commands.
- `/glosc info` - fetch current Discussion metadata and recent comments.
- `/glosc latest [n]` - list the latest repository Discussions.
- `/glosc mark-answer <discussion-comment-node-id>` - mark a Discussion comment as the chosen answer.
- `/glosc unmark-answer <discussion-comment-node-id>` - remove the chosen-answer mark.

### Automatic behavior

- When a new Discussion is created, the bot can automatically post a welcome reply.
- When a new Discussion title contains `新游戏请求`, the bot replies:

  ```text
  感谢您提交的游戏申请.

  我已帮你通知 @3DMXM 了, 当他看到的时候会尽快处理您的申请.
  ```

- Disable the welcome reply with `DISCUSSION_REPLY_ON_CREATED=false`.
- Override the welcome text with `DISCUSSION_WELCOME_BODY`.

Not included by design: Steam price lookup, payment integration, crowdfunding pages, or automatic page creation from the `无游戏` label.

## External reply API

The other project can call this bot to create a Discussion comment:

```http
POST /api/discussions/replies
Authorization: Bearer <DISCUSSION_API_TOKEN>
Content-Type: application/json
```

```json
{
  "owner": "org-or-user",
  "repo": "repo-name",
  "discussionNumber": 7,
  "body": "Reply body",
  "replyToId": "optional-discussion-comment-node-id"
}
```

You can pass `discussionId` instead of `discussionNumber` when the caller already has the Discussion node ID. `installationId` is optional; if omitted, the bot looks up the GitHub App installation for the repository.

Successful response:

```json
{
  "comment": {
    "id": "DC_...",
    "url": "https://github.com/..."
  },
  "discussion": {
    "id": "D_...",
    "number": 7,
    "title": "Discussion title",
    "url": "https://github.com/..."
  }
}
```

## Discussion commands

Post these commands in a discussion comment:

```text
/glosc help
/glosc info
/glosc latest [n]
/glosc mark-answer <discussion-comment-node-id>
/glosc unmark-answer <discussion-comment-node-id>
```

Use `/glosc info` to fetch recent comment node IDs before marking an answer.

## Configuration

```sh
# Optional. Defaults to /glosc
DISCUSSION_COMMAND_PREFIX=/glosc

# Optional but recommended. Required by the HTTP API when set.
DISCUSSION_API_TOKEN=change-me

# Optional. Set to false/0/no/off to disable automatic welcome replies
DISCUSSION_REPLY_ON_CREATED=true

# Optional. Overrides the default new-discussion welcome reply
DISCUSSION_WELCOME_BODY="Thanks for starting this discussion."
```

The GitHub App needs the `discussion` and `discussion_comment` webhook events and `Discussions: Read & write` repository permission. The default manifest in `app.yml` includes those settings.

## Code organization

The bot is split by feature so future changes stay small:

```text
src/index.ts                         # Probot app wiring only
src/config.ts                        # environment configuration
src/constants.ts                     # shared constants
src/graphql.ts                       # GraphQL query and mutation strings
src/types.ts                         # shared TypeScript types
src/commands/*                       # discussion comment commands
src/formatters/*                     # markdown response formatting
src/github/*                         # GitHub API helpers
src/http/*                           # external HTTP API helpers and routes
src/utils/*                          # small generic utilities
```

Use explicit ESM imports with `.js` extensions in TypeScript source, for example:

```ts
import { addDiscussionComment } from "./github/add-discussion-comment.js";
```

## Setup

```sh
# Install dependencies
npm install

# Build and test
npm run build
npm test

# Run the bot
npm start
```

## Docker

```sh
# 1. Build container
docker build -t glosc-bot .

# 2. Start container
docker run -e APP_ID=<app-id> -e PRIVATE_KEY=<pem-value> glosc-bot
```

## Contributing

If you have suggestions for how glosc-bot could be improved, or want to report a bug, open an issue! We'd love all and any contributions.

For more, check out the [Contributing Guide](CONTRIBUTING.md).

## License

[ISC](LICENSE) © 2026 小莫
