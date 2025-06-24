import { Octokit } from '@octokit/rest';
import * as core from '@actions/core';

export class GitHubClient {
  private octokit: Octokit;

  constructor(token: string) {
    this.octokit = new Octokit({
      auth: token,
      userAgent: 'ai-community-moderator'
    });
  }

  async getFileContent(owner: string, repo: string, path: string): Promise<string> {
    try {
      const response = await this.octokit.rest.repos.getContent({
        owner,
        repo,
        path
      });

      if ('content' in response.data && response.data.content) {
        return Buffer.from(response.data.content, 'base64').toString('utf-8');
      }
      
      throw new Error('File content not found');
    } catch (error) {
      core.debug(`Failed to get file ${path}: ${error}`);
      throw error;
    }
  }

  async createIssueComment(owner: string, repo: string, issueNumber: number, body: string): Promise<void> {
    try {
      await this.octokit.rest.issues.createComment({
        owner,
        repo,
        issue_number: issueNumber,
        body
      });
      core.info(`Posted comment on issue #${issueNumber}`);
    } catch (error) {
      core.error(`Failed to create issue comment: ${error}`);
      throw error;
    }
  }

  async createPullRequestComment(owner: string, repo: string, pullNumber: number, body: string): Promise<void> {
    try {
      await this.octokit.rest.issues.createComment({
        owner,
        repo,
        issue_number: pullNumber,
        body
      });
      core.info(`Posted comment on PR #${pullNumber}`);
    } catch (error) {
      core.error(`Failed to create PR comment: ${error}`);
      throw error;
    }
  }

  async hideComment(nodeId: string): Promise<void> {
    try {
      await this.octokit.graphql(`
        mutation($nodeId: ID!) {
          minimizeComment(input: {subjectId: $nodeId, classifier: SPAM}) {
            minimizedComment {
              isMinimized
            }
          }
        }
      `, { nodeId });
      core.info(`Hidden comment with node ID: ${nodeId}`);
    } catch (error) {
      core.error(`Failed to hide comment: ${error}`);
      throw error;
    }
  }

  async lockIssue(owner: string, repo: string, issueNumber: number): Promise<void> {
    try {
      await this.octokit.rest.issues.lock({
        owner,
        repo,
        issue_number: issueNumber,
        lock_reason: 'spam'
      });
      core.info(`Locked issue #${issueNumber}`);
    } catch (error) {
      core.error(`Failed to lock issue: ${error}`);
      throw error;
    }
  }

  async lockPullRequest(owner: string, repo: string, pullNumber: number): Promise<void> {
    try {
      await this.octokit.rest.issues.lock({
        owner,
        repo,
        issue_number: pullNumber,
        lock_reason: 'spam'
      });
      core.info(`Locked PR #${pullNumber}`);
    } catch (error) {
      core.error(`Failed to lock PR: ${error}`);
      throw error;
    }
  }

  async limitInteractions(owner: string, repo: string, limit: 'existing_users' | 'contributors_only' | 'collaborators_only'): Promise<void> {
    try {
      await this.octokit.rest.interactions.setRestrictionsForRepo({
        owner,
        repo,
        limit,
        expiry: 'one_day'
      });
      core.info(`Limited interactions for repository to ${limit}`);
    } catch (error) {
      core.error(`Failed to limit interactions: ${error}`);
      throw error;
    }
  }

  async createDiscussionComment(discussionNodeId: string, body: string): Promise<void> {
    try {
      // Use GraphQL for creating discussion comments as the REST API doesn't support this yet
      await this.octokit.graphql(`
        mutation($discussionId: ID!, $body: String!) {
          addDiscussionComment(input: {discussionId: $discussionId, body: $body}) {
            comment {
              id
            }
          }
        }
      `, { 
        discussionId: discussionNodeId, 
        body 
      });
      core.info(`Posted comment on discussion with node ID: ${discussionNodeId}`);
    } catch (error) {
      core.error(`Failed to create discussion comment: ${error}`);
      throw error;
    }
  }

  async lockDiscussion(discussionNodeId: string): Promise<void> {
    try {
      // Use GraphQL for locking discussions as the REST API doesn't support this yet
      await this.octokit.graphql(`
        mutation($discussionId: ID!) {
          lockLockable(input: {lockableId: $discussionId, lockReason: SPAM}) {
            lockedRecord {
              locked
            }
          }
        }
      `, { discussionId: discussionNodeId });
      core.info(`Locked discussion with node ID: ${discussionNodeId}`);
    } catch (error) {
      core.error(`Failed to lock discussion: ${error}`);
      throw error;
    }
  }
}