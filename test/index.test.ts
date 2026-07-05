import fs from "node:fs";
import path from "node:path";
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

describe("Glosc discussion bot", () => {
  let probot: Probot;

  beforeEach(() => {
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
    probot.load(myProbotApp);
  });

  test("replies when a discussion is created", async () => {
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

  afterEach(() => {
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

function createDiscussionPayload() {
  return {
    action: "created",
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

function createDiscussion() {
  return {
    answer_chosen_at: null,
    answer_chosen_by: null,
    answer_html_url: null,
    body: "Discussion body",
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
    title: "How should we handle docs?",
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
