import fs from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { fileURLToPath } from "node:url";
import nock from "nock";
import { Probot, ProbotOctokit } from "probot";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import myProbotApp from "../src/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const privateKey = fs.readFileSync(
  path.join(__dirname, "fixtures/mock-cert.pem"),
  "utf-8",
);

const discussionNodeId = "D_kwDOExample";
const commandCommentNodeId = "DC_kwDOCommand";
let httpHandler: any;

describe("Glosc discussion bot", () => {
  let probot: Probot;

  beforeEach(async () => {
    delete process.env.DISCUSSION_API_TOKEN;
    delete process.env.DISCUSSION_REPLY_ON_CREATED;
    delete process.env.DISCUSSION_WELCOME_BODY;

    nock.disableNetConnect();
    probot = new Probot({
      appId: 123,
      privateKey,
      Octokit: ProbotOctokit.defaults((instanceOptions: object) => ({
        ...instanceOptions,
        retry: { enabled: false },
        throttle: { enabled: false },
      })),
    });
    httpHandler = undefined;
    await probot.load(myProbotApp, {
      addHandler: (handler) => {
        httpHandler = handler;
      },
      cwd: path.join(__dirname, ".."),
    });
  });

  test("replies when a discussion is created", async () => {
    process.env.DISCUSSION_WELCOME_BODY = "Thanks for starting this discussion.";

    const mock = mockInstallationToken().post(
      "/graphql",
      expectAddDiscussionComment({
        bodyIncludes: "Thanks for starting this discussion.",
        discussionId: discussionNodeId,
        replyToId: null,
      }),
    ).reply(200, addCommentResponse());

    await probot.receive({
      name: "discussion",
      payload: createDiscussionPayload(),
    } as any);

    expect(mock.pendingMocks()).toStrictEqual([]);
  });

  test("replies with game request message when discussion title matches", async () => {
    const mock = mockInstallationToken().post(
      "/graphql",
      expectAddDiscussionComment({
        bodyIncludes: [
          "感谢您提交的游戏申请.",
          "我已帮你通知 @3DMXM 了, 当他看到的时候会尽快处理您的申请.",
        ],
        discussionId: discussionNodeId,
        replyToId: null,
      }),
    ).reply(200, addCommentResponse());

    await probot.receive({
      name: "discussion",
      payload: createDiscussionPayload("新游戏请求: Elden Ring"),
    } as any);

    expect(mock.pendingMocks()).toStrictEqual([]);
  });

  test("appends Steam details to game request reply when a Steam link is present", async () => {
    const steamMock = nock("https://store.steampowered.com")
      .get("/api/appdetails")
      .query({ appids: "3321460", l: "schinese" })
      .reply(200, {
        "3321460": {
          data: {
            genres: [{ description: "动作" }, { description: "RPG" }],
            header_image: "https://cdn.example.com/header.jpg",
            name: "红色沙漠",
            short_description: "一款动作 RPG 游戏。",
          },
          success: true,
        },
      });

    const mock = mockInstallationToken().post(
      "/graphql",
      expectAddDiscussionComment({
        bodyIncludes: [
          "感谢您提交的游戏申请.",
          "**红色沙漠**",
          "![封面](https://cdn.example.com/header.jpg)",
          "类型: 动作, RPG",
        ],
        discussionId: discussionNodeId,
        replyToId: null,
      }),
    ).reply(200, addCommentResponse());

    await probot.receive({
      name: "discussion",
      payload: createDiscussionPayload(
        "新游戏请求: Elden Ring",
        "游戏官网/商店/Steam 地址：https://store.steampowered.com/app/3321460/_/",
      ),
    } as any);

    expect(mock.pendingMocks()).toStrictEqual([]);
    expect(steamMock.pendingMocks()).toStrictEqual([]);
  });

  test("falls back to plain reply when the Steam API call fails", async () => {
    const steamMock = nock("https://store.steampowered.com")
      .get("/api/appdetails")
      .query({ appids: "3321460", l: "schinese" })
      .reply(500);

    const mock = mockInstallationToken().post(
      "/graphql",
      expectAddDiscussionComment({
        bodyIncludes: "感谢您提交的游戏申请.",
        discussionId: discussionNodeId,
        replyToId: null,
      }),
    ).reply(200, addCommentResponse());

    await probot.receive({
      name: "discussion",
      payload: createDiscussionPayload(
        "新游戏请求: Elden Ring",
        "游戏官网/商店/Steam 地址：https://store.steampowered.com/app/3321460/_/",
      ),
    } as any);

    expect(mock.pendingMocks()).toStrictEqual([]);
    expect(steamMock.pendingMocks()).toStrictEqual([]);
  });

  test("still replies to game requests when generic welcome is disabled", async () => {
    process.env.DISCUSSION_REPLY_ON_CREATED = "false";
    const mock = mockInstallationToken().post(
      "/graphql",
      expectAddDiscussionComment({
        bodyIncludes: "感谢您提交的游戏申请.",
        discussionId: discussionNodeId,
        replyToId: null,
      }),
    ).reply(200, addCommentResponse());

    await probot.receive({
      name: "discussion",
      payload: createDiscussionPayload("新游戏请求: Hollow Knight"),
    } as any);

    expect(mock.pendingMocks()).toStrictEqual([]);
  });

  test("fetches current discussion information from an info command", async () => {
    const mock = mockInstallationToken()
      .post("/graphql", (body: any) => {
        expect(body.query).toContain("query GetDiscussionInfo");
        expect(body.variables).toMatchObject({
          commentsLast: 5,
          number: 7,
          owner: "hiimbex",
          repo: "testing-things",
        });
        return true;
      })
      .reply(200, {
        data: {
          repository: {
            discussion: {
              answer: null,
              author: { login: "octocat" },
              category: {
                isAnswerable: true,
                name: "Q&A",
              },
              comments: {
                nodes: [
                  {
                    author: { login: "alice" },
                    bodyText: "The answer should be visible here.",
                    createdAt: "2026-07-06T00:00:00Z",
                    id: "DC_kwDOAnswer",
                    isAnswer: false,
                    url: "https://github.com/hiimbex/testing-things/discussions/7#discussioncomment-1",
                  },
                ],
                totalCount: 1,
              },
              createdAt: "2026-07-06T00:00:00Z",
              isAnswered: false,
              number: 7,
              title: "How should we handle docs?",
              updatedAt: "2026-07-06T00:00:00Z",
              upvoteCount: 3,
              url: "https://github.com/hiimbex/testing-things/discussions/7",
            },
          },
        },
      })
      .post(
        "/graphql",
        expectAddDiscussionComment({
          bodyIncludes: [
            "Discussion #7: How should we handle docs?",
            "Category: Q&A",
            "node: `DC_kwDOAnswer`",
          ],
          discussionId: discussionNodeId,
          replyToId: commandCommentNodeId,
        }),
      )
      .reply(200, addCommentResponse());

    await probot.receive({
      name: "discussion_comment",
      payload: createDiscussionCommentPayload("/glosc info"),
    } as any);

    expect(mock.pendingMocks()).toStrictEqual([]);
  });

  test("lists latest discussions from a command", async () => {
    const mock = mockInstallationToken()
      .post("/graphql", (body: any) => {
        expect(body.query).toContain("query ListDiscussions");
        expect(body.variables).toMatchObject({
          limit: 2,
          owner: "hiimbex",
          repo: "testing-things",
        });
        return true;
      })
      .reply(200, {
        data: {
          repository: {
            discussions: {
              nodes: [
                {
                  author: { login: "octocat" },
                  category: { name: "Ideas" },
                  comments: { totalCount: 4 },
                  isAnswered: null,
                  number: 8,
                  title: "Build a discussions bot",
                  updatedAt: "2026-07-06T00:00:00Z",
                  url: "https://github.com/hiimbex/testing-things/discussions/8",
                },
                {
                  author: { login: "alice" },
                  category: { name: "Q&A" },
                  comments: { totalCount: 1 },
                  isAnswered: true,
                  number: 7,
                  title: "How should we handle docs?",
                  updatedAt: "2026-07-05T00:00:00Z",
                  url: "https://github.com/hiimbex/testing-things/discussions/7",
                },
              ],
            },
          },
        },
      })
      .post(
        "/graphql",
        expectAddDiscussionComment({
          bodyIncludes: [
            "Latest discussions:",
            "#8 Build a discussions bot",
            "#7 How should we handle docs?",
          ],
          discussionId: discussionNodeId,
          replyToId: commandCommentNodeId,
        }),
      )
      .reply(200, addCommentResponse());

    await probot.receive({
      name: "discussion_comment",
      payload: createDiscussionCommentPayload("/glosc latest 2"),
    } as any);

    expect(mock.pendingMocks()).toStrictEqual([]);
  });

  test("marks a discussion comment as the answer", async () => {
    const mock = mockInstallationToken()
      .post("/graphql", (body: any) => {
        expect(body.query).toContain("mutation MarkDiscussionCommentAsAnswer");
        expect(body.variables).toMatchObject({ id: "DC_kwDOAnswer" });
        return true;
      })
      .reply(200, {
        data: {
          markDiscussionCommentAsAnswer: {
            discussion: {
              id: discussionNodeId,
              url: "https://github.com/hiimbex/testing-things/discussions/7",
            },
          },
        },
      })
      .post(
        "/graphql",
        expectAddDiscussionComment({
          bodyIncludes: "Marked `DC_kwDOAnswer` as the discussion answer.",
          discussionId: discussionNodeId,
          replyToId: commandCommentNodeId,
        }),
      )
      .reply(200, addCommentResponse());

    await probot.receive({
      name: "discussion_comment",
      payload: createDiscussionCommentPayload("/glosc mark-answer DC_kwDOAnswer"),
    } as any);

    expect(mock.pendingMocks()).toStrictEqual([]);
  });

  test("creates a discussion reply through the external API", async () => {
    process.env.DISCUSSION_API_TOKEN = "secret";
    const mock = nock("https://api.github.com")
      .get("/repos/hiimbex/testing-things/installation")
      .reply(200, {
        id: 2,
      })
      .post("/app/installations/2/access_tokens")
      .reply(200, {
        permissions: {
          discussions: "write",
          metadata: "read",
        },
        token: "test",
      })
      .post("/graphql", (body: any) => {
        expect(body.query).toContain("query GetDiscussionByNumber");
        expect(body.variables).toMatchObject({
          number: 7,
          owner: "hiimbex",
          repo: "testing-things",
        });
        return true;
      })
      .reply(200, {
        data: {
          repository: {
            discussion: {
              id: discussionNodeId,
              number: 7,
              title: "How should we handle docs?",
              url: "https://github.com/hiimbex/testing-things/discussions/7",
            },
          },
        },
      })
      .post(
        "/graphql",
        expectAddDiscussionComment({
          bodyIncludes: "External project reply",
          discussionId: discussionNodeId,
          replyToId: commandCommentNodeId,
        }),
      )
      .reply(200, addCommentResponse());

    const response = await callHttpHandler({
      body: {
        body: "External project reply",
        discussionNumber: 7,
        owner: "hiimbex",
        replyToId: commandCommentNodeId,
        repo: "testing-things",
      },
      headers: {
        authorization: "Bearer secret",
      },
      method: "POST",
      url: "/api/discussions/replies",
    });

    expect(response.status).toBe(201);
    expect(response.json.comment).toMatchObject({
      id: "DC_kwDOReply",
    });
    expect(mock.pendingMocks()).toStrictEqual([]);
  });

  afterEach(() => {
    delete process.env.DISCUSSION_API_TOKEN;
    delete process.env.DISCUSSION_REPLY_ON_CREATED;
    delete process.env.DISCUSSION_WELCOME_BODY;
    nock.cleanAll();
    nock.enableNetConnect();
  });
});

function mockInstallationToken(): nock.Scope {
  return nock("https://api.github.com")
    .post("/app/installations/2/access_tokens")
    .reply(200, {
      permissions: {
        discussions: "write",
        metadata: "read",
      },
      token: "test",
    });
}

async function callHttpHandler(options: {
  body?: unknown;
  headers?: Record<string, string>;
  method: string;
  url: string;
}) {
  let responseBody = "";
  let responseStatus = 0;
  const req = Readable.from(
    options.body === undefined ? [] : [JSON.stringify(options.body)],
  ) as any;
  const res = {
    end(chunk: unknown) {
      responseBody = chunk ? String(chunk) : "";
    },
    writeHead(status: number) {
      responseStatus = status;
    },
  } as any;

  req.headers = options.headers ?? {};
  req.method = options.method;
  req.url = options.url;

  const handled = await httpHandler(req, res);

  expect(handled).toBe(true);

  return {
    json: responseBody ? JSON.parse(responseBody) : null,
    status: responseStatus,
  };
}

function expectAddDiscussionComment(options: {
  bodyIncludes: string | string[];
  discussionId: string;
  replyToId: string | null;
}) {
  return (body: any) => {
    const bodyIncludes = Array.isArray(options.bodyIncludes)
      ? options.bodyIncludes
      : [options.bodyIncludes];

    expect(body.query).toContain("mutation AddDiscussionComment");
    expect(body.variables).toMatchObject({
      discussionId: options.discussionId,
      replyToId: options.replyToId,
    });

    for (const expected of bodyIncludes) {
      expect(body.variables.body).toContain(expected);
    }

    return true;
  };
}

function addCommentResponse() {
  return {
    data: {
      addDiscussionComment: {
        comment: {
          id: "DC_kwDOReply",
          url: "https://github.com/hiimbex/testing-things/discussions/7#discussioncomment-2",
        },
      },
    },
  };
}

function createDiscussionPayload(
  title = "How should we handle docs?",
  body?: string,
) {
  return {
    action: "created",
    discussion: createDiscussion(title, body),
    installation: {
      id: 2,
    },
    repository: createRepository(),
    sender: {
      id: 1,
      login: "octocat",
      type: "User",
    },
  };
}

function createDiscussionCommentPayload(body: string) {
  return {
    action: "created",
    comment: {
      body,
      id: 1001,
      node_id: commandCommentNodeId,
      user: {
        id: 1,
        login: "octocat",
        type: "User",
      },
    },
    discussion: createDiscussion(),
    installation: {
      id: 2,
    },
    repository: createRepository(),
    sender: {
      id: 1,
      login: "octocat",
      type: "User",
    },
  };
}

function createDiscussion(
  title = "How should we handle docs?",
  body = "Discussion body",
) {
  return {
    answer_chosen_at: null,
    answer_chosen_by: null,
    answer_html_url: null,
    body,
    category: {
      id: 99,
      is_answerable: true,
      name: "Q&A",
      node_id: "DIC_kwDOCategory",
      slug: "q-a",
    },
    comments: 0,
    created_at: "2026-07-06T00:00:00Z",
    html_url: "https://github.com/hiimbex/testing-things/discussions/7",
    id: 700,
    node_id: discussionNodeId,
    number: 7,
    state: "open",
    title,
    updated_at: "2026-07-06T00:00:00Z",
    user: {
      id: 1,
      login: "octocat",
      type: "User",
    },
  };
}

function createRepository() {
  return {
    id: 1296269,
    name: "testing-things",
    owner: {
      id: 1,
      login: "hiimbex",
      type: "User",
    },
  };
}
