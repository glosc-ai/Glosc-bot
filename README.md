# glosc-bot

> A GitHub App built with [Probot](https://github.com/probot/probot) for replying to, fetching, and managing GitHub Discussions.

## Features

- Replies to newly created discussions with a configurable welcome message.
- Handles discussion comment commands with threaded bot replies.
- Fetches the current discussion summary and recent comments.
- Lists the latest repository discussions.
- Marks or unmarks a discussion comment as the chosen answer.

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

# Optional. Set to false/0/no/off to disable automatic welcome replies
DISCUSSION_REPLY_ON_CREATED=true

# Optional. Overrides the default new-discussion welcome reply
DISCUSSION_WELCOME_BODY="Thanks for starting this discussion."
```

The GitHub App needs the `discussion` and `discussion_comment` webhook events and `Discussions: Read & write` repository permission. The default manifest in `app.yml` includes those settings.

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
