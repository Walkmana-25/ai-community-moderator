"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitHubClient = void 0;
const rest_1 = require("@octokit/rest");
const core = __importStar(require("@actions/core"));
class GitHubClient {
    constructor(token) {
        this.octokit = new rest_1.Octokit({
            auth: token,
            userAgent: 'ai-community-moderator'
        });
    }
    async getFileContent(owner, repo, path) {
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
        }
        catch (error) {
            core.debug(`Failed to get file ${path}: ${error}`);
            throw error;
        }
    }
    async createIssueComment(owner, repo, issueNumber, body) {
        try {
            await this.octokit.rest.issues.createComment({
                owner,
                repo,
                issue_number: issueNumber,
                body
            });
            core.info(`Posted comment on issue #${issueNumber}`);
        }
        catch (error) {
            core.error(`Failed to create issue comment: ${error}`);
            throw error;
        }
    }
    async createPullRequestComment(owner, repo, pullNumber, body) {
        try {
            await this.octokit.rest.issues.createComment({
                owner,
                repo,
                issue_number: pullNumber,
                body
            });
            core.info(`Posted comment on PR #${pullNumber}`);
        }
        catch (error) {
            core.error(`Failed to create PR comment: ${error}`);
            throw error;
        }
    }
    async hideComment(nodeId) {
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
        }
        catch (error) {
            core.error(`Failed to hide comment: ${error}`);
            throw error;
        }
    }
    async lockIssue(owner, repo, issueNumber) {
        try {
            await this.octokit.rest.issues.lock({
                owner,
                repo,
                issue_number: issueNumber,
                lock_reason: 'spam'
            });
            core.info(`Locked issue #${issueNumber}`);
        }
        catch (error) {
            core.error(`Failed to lock issue: ${error}`);
            throw error;
        }
    }
    async lockPullRequest(owner, repo, pullNumber) {
        try {
            await this.octokit.rest.issues.lock({
                owner,
                repo,
                issue_number: pullNumber,
                lock_reason: 'spam'
            });
            core.info(`Locked PR #${pullNumber}`);
        }
        catch (error) {
            core.error(`Failed to lock PR: ${error}`);
            throw error;
        }
    }
    async limitInteractions(owner, repo, limit) {
        try {
            await this.octokit.rest.interactions.setRestrictionsForRepo({
                owner,
                repo,
                limit,
                expiry: 'one_day'
            });
            core.info(`Limited interactions for repository to ${limit}`);
        }
        catch (error) {
            core.error(`Failed to limit interactions: ${error}`);
            throw error;
        }
    }
    async createDiscussionComment(discussionNodeId, body) {
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
        }
        catch (error) {
            core.error(`Failed to create discussion comment: ${error}`);
            throw error;
        }
    }
    async lockDiscussion(discussionNodeId) {
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
        }
        catch (error) {
            core.error(`Failed to lock discussion: ${error}`);
            throw error;
        }
    }
    async getIssue(owner, repo, issueNumber) {
        try {
            const response = await this.octokit.rest.issues.get({
                owner,
                repo,
                issue_number: issueNumber
            });
            return {
                title: response.data.title,
                body: response.data.body || null
            };
        }
        catch (error) {
            core.debug(`Failed to get issue ${issueNumber}: ${error}`);
            throw error;
        }
    }
    async getPullRequest(owner, repo, pullNumber) {
        try {
            const response = await this.octokit.rest.pulls.get({
                owner,
                repo,
                pull_number: pullNumber
            });
            return {
                title: response.data.title,
                body: response.data.body || null
            };
        }
        catch (error) {
            core.debug(`Failed to get PR ${pullNumber}: ${error}`);
            throw error;
        }
    }
    async getRecentComments(owner, repo, issueNumber, limit = 3) {
        try {
            const response = await this.octokit.rest.issues.listComments({
                owner,
                repo,
                issue_number: issueNumber,
                sort: 'created',
                direction: 'desc',
                per_page: limit
            });
            return response.data.map(comment => ({
                body: comment.body || '',
                created_at: comment.created_at,
                user: comment.user?.login || 'unknown'
            })).reverse(); // Reverse to get chronological order (oldest first)
        }
        catch (error) {
            core.debug(`Failed to get recent comments for issue ${issueNumber}: ${error}`);
            throw error;
        }
    }
}
exports.GitHubClient = GitHubClient;
//# sourceMappingURL=github-client.js.map