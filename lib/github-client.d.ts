export declare class GitHubClient {
    private octokit;
    constructor(token: string);
    getFileContent(owner: string, repo: string, path: string): Promise<string>;
    createIssueComment(owner: string, repo: string, issueNumber: number, body: string): Promise<void>;
    createPullRequestComment(owner: string, repo: string, pullNumber: number, body: string): Promise<void>;
    hideComment(nodeId: string): Promise<void>;
    lockIssue(owner: string, repo: string, issueNumber: number): Promise<void>;
    lockPullRequest(owner: string, repo: string, pullNumber: number): Promise<void>;
    limitInteractions(owner: string, repo: string, limit: 'existing_users' | 'contributors_only' | 'collaborators_only'): Promise<void>;
    createDiscussionComment(discussionNodeId: string, body: string): Promise<void>;
    lockDiscussion(discussionNodeId: string): Promise<void>;
    getIssue(owner: string, repo: string, issueNumber: number): Promise<{
        title: string;
        body: string | null;
    }>;
    getPullRequest(owner: string, repo: string, pullNumber: number): Promise<{
        title: string;
        body: string | null;
    }>;
    getRecentComments(owner: string, repo: string, issueNumber: number, limit?: number): Promise<Array<{
        body: string;
        created_at: string;
        user: string;
    }>>;
    getDiscussion(discussionNodeId: string): Promise<{
        title: string;
        body: string | null;
    }>;
    getRecentDiscussionComments(discussionNodeId: string, limit?: number): Promise<Array<{
        body: string;
        created_at: string;
        user: string;
    }>>;
}
