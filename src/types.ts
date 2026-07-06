import type { Context } from "probot";

export type DiscussionCreatedContext = Context<"discussion.created">;

export type DiscussionCommentCreatedContext = Context<"discussion_comment.created">;

export type BotConfig = {
  apiToken: string | null;
  commandPrefix: string;
  replyOnCreated: boolean;
  welcomeBody: string;
};

export type Command = {
  args: string;
  name: string;
};

export type Actor = {
  login: string;
} | null;

export type DiscussionCommentNode = {
  author: Actor;
  bodyText: string;
  createdAt: string;
  id: string;
  isAnswer: boolean;
  url: string;
};

export type DiscussionInfo = {
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

export type DiscussionInfoResponse = {
  repository: {
    discussion: DiscussionInfo | null;
  } | null;
};

export type DiscussionListItem = {
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

export type DiscussionListResponse = {
  repository: {
    discussions: {
      nodes: (DiscussionListItem | null)[] | null;
    };
  } | null;
};

export type DiscussionLookup = {
  id: string;
  number: number | null;
  title: string | null;
  url: string | null;
};

export type DiscussionLookupResponse = {
  repository: {
    discussion: DiscussionLookup | null;
  } | null;
};

export type DiscussionComment = {
  id: string;
  url: string;
};

export type AddDiscussionCommentResponse = {
  addDiscussionComment: {
    comment: DiscussionComment | null;
  } | null;
};

export type CreateReplyRequest = {
  body?: unknown;
  discussionId?: unknown;
  discussionNumber?: unknown;
  installationId?: unknown;
  owner?: unknown;
  replyToId?: unknown;
  repo?: unknown;
};

export type CreateReplyInput = {
  body: string;
  discussionId: string | null;
  discussionNumber: number | null;
  installationId: number | null;
  owner: string;
  replyToId: string | null;
  repo: string;
};

export type CreateReplyResult = {
  comment: DiscussionComment;
  discussion: DiscussionLookup;
};

export type UpdateDiscussionCommentResponse = {
  updateDiscussionComment: {
    comment: DiscussionComment | null;
  } | null;
};

export type UpdateReplyRequest = {
  body?: unknown;
  commentId?: unknown;
  installationId?: unknown;
  owner?: unknown;
  repo?: unknown;
};

export type UpdateReplyInput = {
  body: string;
  commentId: string;
  installationId: number | null;
  owner: string;
  repo: string;
};

export type UpdateReplyResult = {
  comment: DiscussionComment;
};

export type SteamAppDetails = {
  genres: string[];
  headerImage: string;
  name: string;
  shortDescription: string;
};
