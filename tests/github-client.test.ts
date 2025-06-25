import { GitHubClient } from "../src/github-client";

// Mock the Octokit constructor
jest.mock("@octokit/rest", () => {
  const mockOctokit = {
    rest: {
      repos: {
        getContent: jest.fn(),
      },
      issues: {
        createComment: jest.fn(),
        lock: jest.fn(),
        get: jest.fn(),
        listComments: jest.fn(),
      },
      pulls: {
        get: jest.fn(),
      },
      interactions: {
        setRestrictionsForRepo: jest.fn(),
      },
    },
    graphql: jest.fn(),
  };

  return {
    Octokit: jest.fn(() => mockOctokit),
  };
});

describe("GitHubClient", () => {
  let client: GitHubClient;

  beforeEach(() => {
    jest.clearAllMocks();
    client = new GitHubClient("test-token");
  });

  describe("getFileContent", () => {
    it("should return decoded file content", async () => {
      const mockContent = Buffer.from("Hello World").toString("base64");
      const { Octokit } = require("@octokit/rest");
      const mockInstance = new Octokit();

      mockInstance.rest.repos.getContent.mockResolvedValue({
        data: { content: mockContent },
      });

      const result = await client.getFileContent("owner", "repo", "path");

      expect(result).toBe("Hello World");
      expect(mockInstance.rest.repos.getContent).toHaveBeenCalledWith({
        owner: "owner",
        repo: "repo",
        path: "path",
      });
    });

    it("should throw error when file not found", async () => {
      const { Octokit } = require("@octokit/rest");
      const mockInstance = new Octokit();

      mockInstance.rest.repos.getContent.mockRejectedValue(
        new Error("Not found"),
      );

      await expect(
        client.getFileContent("owner", "repo", "path"),
      ).rejects.toThrow("Not found");
    });
  });

  describe("createIssueComment", () => {
    it("should create issue comment successfully", async () => {
      const { Octokit } = require("@octokit/rest");
      const mockInstance = new Octokit();

      mockInstance.rest.issues.createComment.mockResolvedValue({});

      await client.createIssueComment("owner", "repo", 1, "test comment");

      expect(mockInstance.rest.issues.createComment).toHaveBeenCalledWith({
        owner: "owner",
        repo: "repo",
        issue_number: 1,
        body: "test comment",
      });
    });
  });

  describe("hideComment", () => {
    it("should hide comment using GraphQL", async () => {
      const { Octokit } = require("@octokit/rest");
      const mockInstance = new Octokit();

      mockInstance.graphql.mockResolvedValue({});

      await client.hideComment("node-id-123");

      expect(mockInstance.graphql).toHaveBeenCalledWith(
        expect.stringContaining("minimizeComment"),
        { nodeId: "node-id-123" },
      );
    });
  });

  describe("lockIssue", () => {
    it("should lock issue successfully", async () => {
      const { Octokit } = require("@octokit/rest");
      const mockInstance = new Octokit();

      mockInstance.rest.issues.lock.mockResolvedValue({});

      await client.lockIssue("owner", "repo", 1);

      expect(mockInstance.rest.issues.lock).toHaveBeenCalledWith({
        owner: "owner",
        repo: "repo",
        issue_number: 1,
        lock_reason: "spam",
      });
    });
  });

  describe("getIssue", () => {
    it("should return issue title and body", async () => {
      const { Octokit } = require("@octokit/rest");
      const mockInstance = new Octokit();

      mockInstance.rest.issues.get.mockResolvedValue({
        data: {
          title: "Test Issue",
          body: "This is a test issue",
        },
      });

      const result = await client.getIssue("owner", "repo", 1);

      expect(result).toEqual({
        title: "Test Issue",
        body: "This is a test issue",
      });
      expect(mockInstance.rest.issues.get).toHaveBeenCalledWith({
        owner: "owner",
        repo: "repo",
        issue_number: 1,
      });
    });

    it("should handle null body", async () => {
      const { Octokit } = require("@octokit/rest");
      const mockInstance = new Octokit();

      mockInstance.rest.issues.get.mockResolvedValue({
        data: {
          title: "Test Issue",
          body: null,
        },
      });

      const result = await client.getIssue("owner", "repo", 1);

      expect(result).toEqual({
        title: "Test Issue",
        body: null,
      });
    });
  });

  describe("getPullRequest", () => {
    it("should return PR title and body", async () => {
      const { Octokit } = require("@octokit/rest");
      const mockInstance = new Octokit();

      mockInstance.rest.pulls.get.mockResolvedValue({
        data: {
          title: "Test PR",
          body: "This is a test PR",
        },
      });

      const result = await client.getPullRequest("owner", "repo", 1);

      expect(result).toEqual({
        title: "Test PR",
        body: "This is a test PR",
      });
      expect(mockInstance.rest.pulls.get).toHaveBeenCalledWith({
        owner: "owner",
        repo: "repo",
        pull_number: 1,
      });
    });
  });

  describe("getRecentComments", () => {
    it("should return recent comments in chronological order", async () => {
      const { Octokit } = require("@octokit/rest");
      const mockInstance = new Octokit();

      mockInstance.rest.issues.listComments.mockResolvedValue({
        data: [
          {
            body: "Third comment",
            created_at: "2023-01-03T00:00:00Z",
            user: { login: "user3" },
            author_association: "CONTRIBUTOR",
          },
          {
            body: "Second comment",
            created_at: "2023-01-02T00:00:00Z",
            user: { login: "user2" },
            author_association: "COLLABORATOR",
          },
          {
            body: "First comment",
            created_at: "2023-01-01T00:00:00Z",
            user: { login: "user1" },
            author_association: "OWNER",
          },
        ],
      });

      const result = await client.getRecentComments("owner", "repo", 1, 3);

      expect(result).toEqual([
        {
          body: "First comment",
          created_at: "2023-01-01T00:00:00Z",
          user: "user1",
          author_association: "OWNER",
        },
        {
          body: "Second comment",
          created_at: "2023-01-02T00:00:00Z",
          user: "user2",
          author_association: "COLLABORATOR",
        },
        {
          body: "Third comment",
          created_at: "2023-01-03T00:00:00Z",
          user: "user3",
          author_association: "CONTRIBUTOR",
        },
      ]);
      expect(mockInstance.rest.issues.listComments).toHaveBeenCalledWith({
        owner: "owner",
        repo: "repo",
        issue_number: 1,
        sort: "created",
        direction: "desc",
        per_page: 3,
      });
    });

    it("should handle comments with null users", async () => {
      const { Octokit } = require("@octokit/rest");
      const mockInstance = new Octokit();

      mockInstance.rest.issues.listComments.mockResolvedValue({
        data: [
          {
            body: "Comment from unknown user",
            created_at: "2023-01-01T00:00:00Z",
            user: null,
            author_association: null,
          },
        ],
      });

      const result = await client.getRecentComments("owner", "repo", 1, 1);

      expect(result).toEqual([
        {
          body: "Comment from unknown user",
          created_at: "2023-01-01T00:00:00Z",
          user: "unknown",
          author_association: "NONE",
        },
      ]);
    });
  });

  describe("createDiscussionComment", () => {
    it("should create discussion comment using GraphQL", async () => {
      const { Octokit } = require("@octokit/rest");
      const mockInstance = new Octokit();

      mockInstance.graphql.mockResolvedValue({});

      await client.createDiscussionComment(
        "D_test123",
        "test discussion comment",
      );

      expect(mockInstance.graphql).toHaveBeenCalledWith(
        expect.stringContaining("addDiscussionComment"),
        { discussionId: "D_test123", body: "test discussion comment" },
      );
    });
  });

  describe("lockDiscussion", () => {
    it("should lock discussion using GraphQL", async () => {
      const { Octokit } = require("@octokit/rest");
      const mockInstance = new Octokit();

      mockInstance.graphql.mockResolvedValue({});

      await client.lockDiscussion("D_test123");

      expect(mockInstance.graphql).toHaveBeenCalledWith(
        expect.stringContaining("lockLockable"),
        { discussionId: "D_test123" },
      );
    });
  });

  describe("getDiscussion", () => {
    it("should return discussion title and body", async () => {
      const { Octokit } = require("@octokit/rest");
      const mockInstance = new Octokit();

      mockInstance.graphql.mockResolvedValue({
        node: {
          title: "Test Discussion",
          body: "This is a test discussion",
        },
      });

      const result = await client.getDiscussion("D_test123");

      expect(result).toEqual({
        title: "Test Discussion",
        body: "This is a test discussion",
      });
      expect(mockInstance.graphql).toHaveBeenCalledWith(
        expect.stringContaining("node(id: $discussionId)"),
        { discussionId: "D_test123" },
      );
    });

    it("should handle null body", async () => {
      const { Octokit } = require("@octokit/rest");
      const mockInstance = new Octokit();

      mockInstance.graphql.mockResolvedValue({
        node: {
          title: "Test Discussion",
          body: null,
        },
      });

      const result = await client.getDiscussion("D_test123");

      expect(result).toEqual({
        title: "Test Discussion",
        body: null,
      });
    });
  });

  describe("getRecentDiscussionComments", () => {
    it("should return recent discussion comments", async () => {
      const { Octokit } = require("@octokit/rest");
      const mockInstance = new Octokit();

      mockInstance.graphql.mockResolvedValue({
        node: {
          comments: {
            nodes: [
              {
                body: "First comment",
                createdAt: "2023-01-01T00:00:00Z",
                author: { login: "user1" },
                authorAssociation: "OWNER",
              },
              {
                body: "Second comment",
                createdAt: "2023-01-02T00:00:00Z",
                author: { login: "user2" },
                authorAssociation: "COLLABORATOR",
              },
            ],
          },
        },
      });

      const result = await client.getRecentDiscussionComments("D_test123", 2);

      expect(result).toEqual([
        {
          body: "First comment",
          created_at: "2023-01-01T00:00:00Z",
          user: "user1",
          author_association: "OWNER",
        },
        {
          body: "Second comment",
          created_at: "2023-01-02T00:00:00Z",
          user: "user2",
          author_association: "COLLABORATOR",
        },
      ]);
      expect(mockInstance.graphql).toHaveBeenCalledWith(
        expect.stringContaining("comments(last: $limit)"),
        { discussionId: "D_test123", limit: 2 },
      );
    });

    it("should handle comments with null authors", async () => {
      const { Octokit } = require("@octokit/rest");
      const mockInstance = new Octokit();

      mockInstance.graphql.mockResolvedValue({
        node: {
          comments: {
            nodes: [
              {
                body: "Comment from unknown user",
                createdAt: "2023-01-01T00:00:00Z",
                author: null,
                authorAssociation: null,
              },
            ],
          },
        },
      });

      const result = await client.getRecentDiscussionComments("D_test123", 1);

      expect(result).toEqual([
        {
          body: "Comment from unknown user",
          created_at: "2023-01-01T00:00:00Z",
          user: "unknown",
          author_association: "NONE",
        },
      ]);
    });
  });
});
