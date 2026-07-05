export const ADD_DISCUSSION_COMMENT = `
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

export const GET_DISCUSSION_BY_NUMBER = `
  query GetDiscussionByNumber($owner: String!, $repo: String!, $number: Int!) {
    repository(owner: $owner, name: $repo) {
      discussion(number: $number) {
        id
        number
        title
        url
      }
    }
  }
`;

export const GET_DISCUSSION_INFO = `
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

export const LIST_DISCUSSIONS = `
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

export const MARK_DISCUSSION_COMMENT_AS_ANSWER = `
  mutation MarkDiscussionCommentAsAnswer($id: ID!) {
    markDiscussionCommentAsAnswer(input: { id: $id }) {
      discussion {
        id
        url
      }
    }
  }
`;

export const UNMARK_DISCUSSION_COMMENT_AS_ANSWER = `
  mutation UnmarkDiscussionCommentAsAnswer($id: ID!) {
    unmarkDiscussionCommentAsAnswer(input: { id: $id }) {
      discussion {
        id
        url
      }
    }
  }
`;
