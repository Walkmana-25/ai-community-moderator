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
exports.Moderator = void 0;
const github_client_1 = require("./github-client");
const openai_client_1 = require("./openai-client");
const core = __importStar(require("@actions/core"));
class Moderator {
    constructor(config) {
        this.config = config;
        this.githubClient = new github_client_1.GitHubClient(config.githubToken);
        this.openaiClient = new openai_client_1.OpenAIClient(config.openaiApiKey, config.openaiBaseUrl);
    }
    async processEvent(context) {
        const { eventName, payload } = context;
        core.info(`Processing event: ${eventName}`);
        // Extract content to moderate based on event type
        const contentToModerate = this.extractContent(eventName, payload);
        if (!contentToModerate) {
            return { actionTaken: 'none', reason: 'No content to moderate' };
        }
        // Get community health files for context
        const communityContext = await this.getCommunityContext(context);
        // Get moderation decision from AI
        const decision = await this.getModerationDecision(contentToModerate, communityContext);
        // Take action if needed
        if (decision.shouldTakeAction && decision.severity >= this.config.severityThreshold) {
            return await this.takeAction(context, decision);
        }
        return { actionTaken: 'none', reason: 'Content deemed acceptable' };
    }
    extractContent(eventName, payload) {
        switch (eventName) {
            case 'issues':
                if (payload.action === 'opened') {
                    return `Issue Title: ${payload.issue.title}\nIssue Body: ${payload.issue.body || ''}`;
                }
                break;
            case 'pull_request':
                if (payload.action === 'opened') {
                    return `PR Title: ${payload.pull_request.title}\nPR Body: ${payload.pull_request.body || ''}`;
                }
                break;
            case 'issue_comment':
                if (payload.action === 'created') {
                    return `Comment: ${payload.comment.body}`;
                }
                break;
            case 'pull_request_review_comment':
                if (payload.action === 'created') {
                    return `Review Comment: ${payload.comment.body}`;
                }
                break;
        }
        return null;
    }
    async getCommunityContext(context) {
        const { owner, repo } = context.repo;
        let communityContext = '';
        try {
            // Try to get contributing guidelines
            const contributing = await this.githubClient.getFileContent(owner, repo, '.github/CONTRIBUTING.md')
                .catch(() => this.githubClient.getFileContent(owner, repo, 'CONTRIBUTING.md'))
                .catch(() => null);
            if (contributing) {
                communityContext += `Contributing Guidelines:\n${contributing}\n\n`;
            }
            // Try to get code of conduct
            const codeOfConduct = await this.githubClient.getFileContent(owner, repo, '.github/CODE_OF_CONDUCT.md')
                .catch(() => this.githubClient.getFileContent(owner, repo, 'CODE_OF_CONDUCT.md'))
                .catch(() => null);
            if (codeOfConduct) {
                communityContext += `Code of Conduct:\n${codeOfConduct}\n\n`;
            }
            // Try to get issue template
            const issueTemplate = await this.githubClient.getFileContent(owner, repo, '.github/ISSUE_TEMPLATE.md')
                .catch(() => null);
            if (issueTemplate) {
                communityContext += `Issue Template:\n${issueTemplate}\n\n`;
            }
        }
        catch (error) {
            core.warning(`Failed to fetch community files: ${error}`);
        }
        return communityContext || 'No specific community guidelines found.';
    }
    async getModerationDecision(content, communityContext) {
        const prompt = this.buildModerationPrompt(content, communityContext);
        try {
            const decision = await this.openaiClient.getModeration(prompt, this.config.model);
            return decision;
        }
        catch (error) {
            core.warning(`AI moderation failed: ${error}`);
            return {
                shouldTakeAction: false,
                actionType: 'none',
                severity: 0,
                reason: 'AI moderation unavailable'
            };
        }
    }
    buildModerationPrompt(content, communityContext) {
        return `You are a skilled community moderator for a GitHub repository. Your role is to review content and enforce community guidelines while being helpful and polite.

Community Guidelines:
${communityContext}

Content to Review:
${content}

Please evaluate this content and respond with a JSON object containing:
- shouldTakeAction: boolean (true if moderation action needed)
- actionType: string ("comment", "hide", "lock", "suggest", or "none")
- severity: number (1-10, where 10 is most severe)
- reason: string (explanation of your decision)
- response: string (optional: helpful response to post as comment)

Guidelines for your evaluation:
- Be helpful and constructive rather than punitive
- Consider if content violates community guidelines
- Look for spam, harassment, off-topic content, or unhelpful contributions
- Suggest improvements when possible
- Only recommend hiding/locking for severe violations
- Provide educational feedback when appropriate

Respond only with valid JSON.`;
    }
    async takeAction(context, decision) {
        const { eventName, payload } = context;
        const { owner, repo } = context.repo;
        try {
            switch (decision.actionType) {
                case 'comment':
                    if (decision.response) {
                        await this.postComment(context, decision.response);
                        return { actionTaken: 'comment', reason: decision.reason };
                    }
                    break;
                case 'hide':
                    if ((eventName === 'issue_comment' || eventName === 'pull_request_review_comment') && payload.comment) {
                        await this.githubClient.hideComment(payload.comment.node_id);
                        return { actionTaken: 'hide', reason: decision.reason };
                    }
                    break;
                case 'lock':
                    if (eventName === 'issues' && payload.issue) {
                        await this.githubClient.lockIssue(owner, repo, payload.issue.number);
                        return { actionTaken: 'lock', reason: decision.reason };
                    }
                    else if (eventName === 'pull_request' && payload.pull_request) {
                        await this.githubClient.lockPullRequest(owner, repo, payload.pull_request.number);
                        return { actionTaken: 'lock', reason: decision.reason };
                    }
                    break;
                case 'suggest':
                    if (decision.response) {
                        await this.postComment(context, decision.response);
                        return { actionTaken: 'suggest', reason: decision.reason };
                    }
                    break;
            }
        }
        catch (error) {
            core.warning(`Failed to take action: ${error}`);
        }
        return { actionTaken: 'none', reason: 'Action could not be completed' };
    }
    async postComment(context, comment) {
        const { eventName, payload } = context;
        const { owner, repo } = context.repo;
        if (eventName === 'issues' && payload.issue) {
            await this.githubClient.createIssueComment(owner, repo, payload.issue.number, comment);
        }
        else if (eventName === 'pull_request' && payload.pull_request) {
            await this.githubClient.createPullRequestComment(owner, repo, payload.pull_request.number, comment);
        }
        else if (eventName === 'issue_comment' && payload.issue) {
            await this.githubClient.createIssueComment(owner, repo, payload.issue.number, comment);
        }
    }
}
exports.Moderator = Moderator;
//# sourceMappingURL=moderator.js.map