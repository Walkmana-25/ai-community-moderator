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
}
