import type { Context, Probot } from "probot";

const DEFAULT_COMMAND_PREFIX = "/glosc";
const DEFAULT_COMMENTS_LIMIT = 5;
const DEFAULT_LIST_LIMIT = 5;
const MAX_LIST_LIMIT = 10;

const ADD_DISCUSSION_COMMENT = `
  mutation AddDiscussionComment(
    $discussionId: ID!
    $body: String!
    $replyToId: ID
  ) {
    addDiscussionComment(
      input: {
        discussionId: $discussionId
        body: $body
        replyToId: $replyToId
      }
    ) {
      comment {
        id
        url
      }
    }
  }
`;

const GET_DISCUSSION_INFO = `
  query GetDiscussionInfo(
    $owner: String!
    $repo: String!
    $number: Int!
    $commentsLast: Int!
  ) {
    repository(owner: $owner, name: $repo) {
      discussion(number: $number) {
        id
        number
        title
        url
        createdAt
        updatedAt
        upvoteCount
        isAnswered
        category {
          name
          isAnswerable
        }
        author {
          login
        }
        answer {
          id
          url
          author {
            login
          }
        }
        comments(last: $commentsLast) {
          totalCount
          nodes {
            id
            url
            bodyText
            createdAt
            isAnswer
            author {
              login
            }
          }
        }
      }
    }
  }
`;

const LIST_DISCUSSIONS = `
  query ListDiscussions($owner: String!, $repo: String!, $limit: Int!) {
    repository(owner: $owner, name: $repo) {
      discussions(
        first: $limit
        orderBy: { field: UPDATED_AT, direction: DESC }
      ) {
        nodes {
          number
          title
          url
          updatedAt
          isAnswered
          category {
            name
          }
          author {
            login
          }
          comments {
            totalCount
          }
        }
      }
    }
  }
`;

const MARK_DISCUSSION_COMMENT_AS_ANSWER = `
  mutation MarkDiscussionCommentAsAnswer($id: ID!) {
    markDiscussionCommentAsAnswer(input: { id: $id }) {
      discussion {
        id
        url
      }
    }
  }
`;

const UNMARK_DISCUSSION_COMMENT_AS_ANSWER = `
  mutation UnmarkDiscussionCommentAsAnswer($id: ID!) {
    unmarkDiscussionCommentAsAnswer(input: { id: $id }) {
      discussion {
        id
        url
      }
    }
  }
`;

type DiscussionCreatedContext = Context<"discussion.created">;
type DiscussionCommentCreatedContext = Context<"discussion_comment.created">;

type BotConfig = {
  commandPrefix: string;
  replyOnCreated: boolean;
  welcomeBody: string;
};

type Command = {
  args: string;
  name: string;
};

type Actor = {
  login: string;
} | null;

type DiscussionCommentNode = {
  author: Actor;
  bodyText: string;
  createdAt: string;
  id: string;
  isAnswer: boolean;
  url: string;
};

type DiscussionInfo = {
  answer: {
    author: Actor;
    id: string;
    url: string;
  } | null;
  author: Actor;
  category: {
    isAnswerable: boolean;
    name: string;
  };
  comments: {
    nodes: (DiscussionCommentNode | null)[] | null;
    totalCount: number;
  };
  createdAt: string;
  isAnswered: boolean | null;
  number: number;
  title: string;
  updatedAt: string;
  upvoteCount: number;
  url: string;
};

type DiscussionInfoResponse = {
  repository: {
    discussion: DiscussionInfo | null;
  } | null;
};

type DiscussionListItem = {
  author: Actor;
  category: {
    name: string;
  };
  comments: {
    totalCount: number;
  };
  isAnswered: boolean | null;
  number: number;
  title: string;
  updatedAt: string;
  url: string;
};

type DiscussionListResponse = {
  repository: {
    discussions: {
      nodes: (DiscussionListItem | null)[] | null;
    };
  } | null;
};

type AddDiscussionCommentResponse = {
  addDiscussionComment: {
    comment: {
      id: string;
      url: string;
    } | null;
  } | null;
};

export default (app: Probot) => {
  app.on("discussion.created", async (context) => {
    const config = getConfig();

    if (!config.replyOnCreated || config.welcomeBody.length === 0) {
      return;
    }

    await addDiscussionComment(
      context,
      context.payload.discussion.node_id,
      config.welcomeBody,
    );
  });

  app.on("discussion_comment.created", async (context) => {
    if (context.isBot) {
      return;
    }

    const config = getConfig();
    const command = parseCommand(context.payload.comment.body, config.commandPrefix);

    if (!command) {
      return;
    }

    try {
      await handleCommand(context, command, config);
    } catch (error) {
      context.log.error({ error }, "Failed to handle discussion command");
      await replyToCommand(
        context,
        "I could not complete that discussion command. Check the bot logs for details.",
      );
    }
  });
};

async function handleCommand(
  context: DiscussionCommentCreatedContext,
  command: Command,
  config: BotConfig,
): Promise<void> {
  switch (command.name) {
    case "help":
      await replyToCommand(context, formatHelp(config.commandPrefix));
      return;
    case "info":
      await replyWithDiscussionInfo(context);
      return;
    case "latest":
    case "list":
      await replyWithLatestDiscussions(context, parseLimit(command.args));
      return;
    case "mark-answer":
      await markAnswer(context, command.args, config.commandPrefix);
      return;
    case "unmark-answer":
      await unmarkAnswer(context, command.args, config.commandPrefix);
      return;
    default:
      await replyToCommand(
        context,
        `Unknown command \`${command.name}\`. Try \`${config.commandPrefix} help\`.`,
      );
      return;
  }
}

async function replyWithDiscussionInfo(
  context: DiscussionCommentCreatedContext,
): Promise<void> {
  const repo = context.repo();
  const data = await context.octokit.graphql<DiscussionInfoResponse>(
    GET_DISCUSSION_INFO,
    {
      commentsLast: DEFAULT_COMMENTS_LIMIT,
      number: context.payload.discussion.number,
      owner: repo.owner,
      repo: repo.repo,
    },
  );

  await replyToCommand(context, formatDiscussionInfo(data.repository?.discussion));
}

async function replyWithLatestDiscussions(
  context: DiscussionCommentCreatedContext,
  limit: number,
): Promise<void> {
  const repo = context.repo();
  const data = await context.octokit.graphql<DiscussionListResponse>(
    LIST_DISCUSSIONS,
    {
      limit,
      owner: repo.owner,
      repo: repo.repo,
    },
  );

  await replyToCommand(context, formatDiscussionList(data.repository?.discussions.nodes));
}

async function markAnswer(
  context: DiscussionCommentCreatedContext,
  args: string,
  commandPrefix: string,
): Promise<void> {
  const commentId = parseNodeIdArg(args);

  if (!commentId) {
    await replyToCommand(
      context,
      `Usage: \`${commandPrefix} mark-answer <discussion-comment-node-id>\``,
    );
    return;
  }

  await context.octokit.graphql(MARK_DISCUSSION_COMMENT_AS_ANSWER, {
    id: commentId,
  });
  await replyToCommand(context, `Marked \`${commentId}\` as the discussion answer.`);
}

async function unmarkAnswer(
  context: DiscussionCommentCreatedContext,
  args: string,
  commandPrefix: string,
): Promise<void> {
  const commentId = parseNodeIdArg(args);

  if (!commentId) {
    await replyToCommand(
      context,
      `Usage: \`${commandPrefix} unmark-answer <discussion-comment-node-id>\``,
    );
    return;
  }

  await context.octokit.graphql(UNMARK_DISCUSSION_COMMENT_AS_ANSWER, {
    id: commentId,
  });
  await replyToCommand(context, `Removed the answer mark from \`${commentId}\`.`);
}

async function replyToCommand(
  context: DiscussionCommentCreatedContext,
  body: string,
): Promise<void> {
  await addDiscussionComment(
    context,
    context.payload.discussion.node_id,
    body,
    context.payload.comment.node_id,
  );
}

async function addDiscussionComment(
  context: DiscussionCreatedContext | DiscussionCommentCreatedContext,
  discussionId: string,
  body: string,
  replyToId: string | null = null,
): Promise<void> {
  await context.octokit.graphql<AddDiscussionCommentResponse>(
    ADD_DISCUSSION_COMMENT,
    {
      body,
      discussionId,
      replyToId,
    },
  );
}

function getConfig(): BotConfig {
  const commandPrefix =
    process.env.DISCUSSION_COMMAND_PREFIX?.trim() || DEFAULT_COMMAND_PREFIX;

  return {
    commandPrefix,
    replyOnCreated: parseBooleanEnv(
      process.env.DISCUSSION_REPLY_ON_CREATED,
      true,
    ),
    welcomeBody:
      process.env.DISCUSSION_WELCOME_BODY?.trim() ||
      [
        "Thanks for starting this discussion.",
        "",
        `A maintainer will take a look soon. You can ask me for help with \`${commandPrefix} help\`.`,
      ].join("\n"),
  };
}

function parseBooleanEnv(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined) {
    return defaultValue;
  }

  return !["0", "false", "no", "off"].includes(value.trim().toLowerCase());
}

function parseCommand(body: string, prefix: string): Command | null {
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

function parseLimit(args: string): number {
  const limit = Number.parseInt(args, 10);

  if (Number.isNaN(limit)) {
    return DEFAULT_LIST_LIMIT;
  }

  return Math.max(1, Math.min(MAX_LIST_LIMIT, limit));
}

function parseNodeIdArg(args: string): string | null {
  const [nodeId] = args.trim().split(/\s+/);
  return nodeId?.length ? nodeId : null;
}

function formatHelp(prefix: string): string {
  return [
    "Glosc discussion bot commands:",
    "",
    `- \`${prefix} help\` - show this message.`,
    `- \`${prefix} info\` - fetch metadata and recent comments for this discussion.`,
    `- \`${prefix} latest [n]\` - list the latest repository discussions (1-${MAX_LIST_LIMIT}).`,
    `- \`${prefix} mark-answer <commentNodeId>\` - mark a discussion comment as the answer.`,
    `- \`${prefix} unmark-answer <commentNodeId>\` - remove the answer mark from a comment.`,
  ].join("\n");
}

function formatDiscussionInfo(discussion: DiscussionInfo | null | undefined): string {
  if (!discussion) {
    return "I could not find this discussion.";
  }

  const recentComments = (discussion.comments.nodes ?? [])
    .filter((comment): comment is DiscussionCommentNode => comment !== null)
    .map((comment) => {
      const author = comment.author?.login ?? "unknown";
      const answerBadge = comment.isAnswer ? " answer" : "";
      const excerpt = truncate(cleanText(comment.bodyText), 120);

      return `- ${author}${answerBadge}: ${excerpt}\n  ${comment.url}\n  node: \`${comment.id}\``;
    });

  const answer = discussion.answer
    ? `${discussion.answer.author?.login ?? "unknown"} - ${discussion.answer.url}`
    : "not chosen";

  return [
    `Discussion #${discussion.number}: ${discussion.title}`,
    discussion.url,
    "",
    `Author: ${discussion.author?.login ?? "unknown"}`,
    `Category: ${discussion.category.name} (${discussion.category.isAnswerable ? "answerable" : "not answerable"})`,
    `Answered: ${discussion.isAnswered ? "yes" : "no"}`,
    `Answer: ${answer}`,
    `Comments: ${discussion.comments.totalCount}`,
    `Upvotes: ${discussion.upvoteCount}`,
    "",
    "Recent comments:",
    recentComments.length ? recentComments.join("\n") : "No comments yet.",
  ].join("\n");
}

function formatDiscussionList(
  discussions: (DiscussionListItem | null)[] | null | undefined,
): string {
  const items = (discussions ?? []).filter(
    (discussion): discussion is DiscussionListItem => discussion !== null,
  );

  if (items.length === 0) {
    return "No discussions found for this repository.";
  }

  return [
    "Latest discussions:",
    "",
    ...items.map((discussion) => {
      const status = discussion.isAnswered ? "answered" : "open";
      const author = discussion.author?.login ?? "unknown";

      return [
        `- #${discussion.number} ${discussion.title}`,
        `  ${discussion.url}`,
        `  ${discussion.category.name}; ${status}; ${discussion.comments.totalCount} comments; by ${author}`,
      ].join("\n");
    }),
  ].join("\n");
}

function cleanText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function truncate(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 3)}...`;
}
