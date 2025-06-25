import { Octokit } from "@octokit/rest";
import * as core from "@actions/core";

export class GitHubClient {
  private octokit: Octokit;

  constructor(token: string) {
    this.octokit = new Octokit({
      auth: token,
      userAgent: "ai-community-moderator",
    });
  }

  async getFileContent(
    owner: string,
    repo: string,
    path: string,
  ): Promise<string> {
    try {
      const response = await this.octokit.rest.repos.getContent({
        owner,
        repo,
        path,
      });

      if ("content" in response.data && response.data.content) {
        return Buffer.from(response.data.content, "base64").toString("utf-8");
      }

      throw new Error("File content not found");
    } catch (error) {
      core.debug(`Failed to get file ${path}: ${error}`);
      throw error;
    }
  }

  async createIssueComment(
    owner: string,
    repo: string,
    issueNumber: number,
    body: string,
  ): Promise<void> {
    try {
      await this.octokit.rest.issues.createComment({
        owner,
        repo,
        issue_number: issueNumber,
        body,
      });
      core.info(`Posted comment on issue #${issueNumber}`);
    } catch (error) {
      core.error(`Failed to create issue comment: ${error}`);
      throw error;
    }
  }

  async createPullRequestComment(
    owner: string,
    repo: string,
    pullNumber: number,
    body: string,
  ): Promise<void> {
    try {
      await this.octokit.rest.issues.createComment({
        owner,
        repo,
        issue_number: pullNumber,
        body,
      });
      core.info(`Posted comment on PR #${pullNumber}`);
    } catch (error) {
      core.error(`Failed to create PR comment: ${error}`);
      throw error;
    }
  }

  async hideComment(nodeId: string): Promise<void> {
    try {
      await this.octokit.graphql(
        `
        mutation($nodeId: ID!) {
          minimizeComment(input: {subjectId: $nodeId, classifier: SPAM}) {
            minimizedComment {
              isMinimized
            }
          }
        }
      `,
        { nodeId },
      );
      core.info(`Hidden comment with node ID: ${nodeId}`);
    } catch (error) {
      core.error(`Failed to hide comment: ${error}`);
      throw error;
    }
  }

  async lockIssue(
    owner: string,
    repo: string,
    issueNumber: number,
  ): Promise<void> {
    try {
      await this.octokit.rest.issues.lock({
        owner,
        repo,
        issue_number: issueNumber,
        lock_reason: "spam",
      });
      core.info(`Locked issue #${issueNumber}`);
    } catch (error) {
      core.error(`Failed to lock issue: ${error}`);
      throw error;
    }
  }

  async lockPullRequest(
    owner: string,
    repo: string,
    pullNumber: number,
  ): Promise<void> {
    try {
      await this.octokit.rest.issues.lock({
        owner,
        repo,
        issue_number: pullNumber,
        lock_reason: "spam",
      });
      core.info(`Locked PR #${pullNumber}`);
    } catch (error) {
      core.error(`Failed to lock PR: ${error}`);
      throw error;
    }
  }

  async limitInteractions(
    owner: string,
    repo: string,
    limit: "existing_users" | "contributors_only" | "collaborators_only",
  ): Promise<void> {
    try {
      await this.octokit.rest.interactions.setRestrictionsForRepo({
        owner,
        repo,
        limit,
        expiry: "one_day",
      });
      core.info(`Limited interactions for repository to ${limit}`);
    } catch (error) {
      core.error(`Failed to limit interactions: ${error}`);
      throw error;
    }
  }

  async createDiscussionComment(
    discussionNodeId: string,
    body: string,
  ): Promise<void> {
    try {
      // Use GraphQL for creating discussion comments as the REST API doesn't support this yet
      await this.octokit.graphql(
        `
        mutation($discussionId: ID!, $body: String!) {
          addDiscussionComment(input: {discussionId: $discussionId, body: $body}) {
            comment {
              id
            }
          }
        }
      `,
        {
          discussionId: discussionNodeId,
          body,
        },
      );
      core.info(
        `Posted comment on discussion with node ID: ${discussionNodeId}`,
      );
    } catch (error) {
      core.error(`Failed to create discussion comment: ${error}`);
      throw error;
    }
  }

  async lockDiscussion(discussionNodeId: string): Promise<void> {
    try {
      // Use GraphQL for locking discussions as the REST API doesn't support this yet
      await this.octokit.graphql(
        `
        mutation($discussionId: ID!) {
          lockLockable(input: {lockableId: $discussionId, lockReason: SPAM}) {
            lockedRecord {
              locked
            }
          }
        }
      `,
        { discussionId: discussionNodeId },
      );
      core.info(`Locked discussion with node ID: ${discussionNodeId}`);
    } catch (error) {
      core.error(`Failed to lock discussion: ${error}`);
      throw error;
    }
  }

  async getIssue(
    owner: string,
    repo: string,
    issueNumber: number,
  ): Promise<{ title: string; body: string | null }> {
    try {
      const response = await this.octokit.rest.issues.get({
        owner,
        repo,
        issue_number: issueNumber,
      });
      return {
        title: response.data.title,
        body: response.data.body || null,
      };
    } catch (error) {
      core.debug(`Failed to get issue ${issueNumber}: ${error}`);
      throw error;
    }
  }

  async getPullRequest(
    owner: string,
    repo: string,
    pullNumber: number,
  ): Promise<{ title: string; body: string | null }> {
    try {
      const response = await this.octokit.rest.pulls.get({
        owner,
        repo,
        pull_number: pullNumber,
      });
      return {
        title: response.data.title,
        body: response.data.body || null,
      };
    } catch (error) {
      core.debug(`Failed to get PR ${pullNumber}: ${error}`);
      throw error;
    }
  }

  async getRecentComments(
    owner: string,
    repo: string,
    issueNumber: number,
    limit: number = 3,
  ): Promise<Array<{ body: string; created_at: string; user: string; author_association: string }>> {
    try {
      const response = await this.octokit.rest.issues.listComments({
        owner,
        repo,
        issue_number: issueNumber,
        sort: "created",
        direction: "desc",
        per_page: limit,
      });

      return response.data
        .map((comment) => ({
          body: comment.body || "",
          created_at: comment.created_at,
          user: comment.user?.login || "unknown",
          author_association: comment.author_association || "NONE",
        }))
        .reverse(); // Reverse to get chronological order (oldest first)
    } catch (error) {
      core.debug(
        `Failed to get recent comments for issue ${issueNumber}: ${error}`,
      );
      throw error;
    }
  }

  async getDiscussion(
    discussionNodeId: string,
  ): Promise<{ title: string; body: string | null }> {
    try {
      const result = await this.octokit.graphql(
        `
        query($discussionId: ID!) {
          node(id: $discussionId) {
            ... on Discussion {
              title
              body
            }
          }
        }
      `,
        { discussionId: discussionNodeId },
      );

      const discussion = (result as any).node;
      return {
        title: discussion.title,
        body: discussion.body || null,
      };
    } catch (error) {
      core.debug(`Failed to get discussion ${discussionNodeId}: ${error}`);
      throw error;
    }
  }

  async getRecentDiscussionComments(
    discussionNodeId: string,
    limit: number = 3,
  ): Promise<Array<{ body: string; created_at: string; user: string; author_association: string }>> {
    try {
      const result = await this.octokit.graphql(
        `
        query($discussionId: ID!, $limit: Int!) {
          node(id: $discussionId) {
            ... on Discussion {
              comments(last: $limit) {
                nodes {
                  body
                  createdAt
                  author {
                    login
                  }
                  authorAssociation
                }
              }
            }
          }
        }
      `,
        { discussionId: discussionNodeId, limit },
      );

      const discussion = (result as any).node;
      return discussion.comments.nodes.map((comment: any) => ({
        body: comment.body || "",
        created_at: comment.createdAt,
        user: comment.author?.login || "unknown",
        author_association: comment.authorAssociation || "NONE",
      }));
    } catch (error) {
      core.debug(
        `Failed to get recent discussion comments for ${discussionNodeId}: ${error}`,
      );
      throw error;
    }
  }
}
