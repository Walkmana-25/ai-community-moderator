import { Context } from '@actions/github/lib/context';
export interface ModeratorConfig {
    githubToken: string;
    openaiApiKey: string;
    openaiBaseUrl: string;
    model: string;
    severityThreshold: number;
}
export interface ModerationResult {
    actionTaken: string;
    reason: string;
}
export interface ModerationDecision {
    shouldTakeAction: boolean;
    actionType: 'comment' | 'hide' | 'lock' | 'suggest' | 'none';
    severity: number;
    reason: string;
    response?: string;
}
export declare class Moderator {
    private githubClient;
    private openaiClient;
    private config;
    constructor(config: ModeratorConfig);
    processEvent(context: Context): Promise<ModerationResult>;
    private extractContent;
    private extractCommentContent;
    private getCommunityContext;
    private getModerationDecision;
    private buildModerationPrompt;
    private takeAction;
    private postComment;
}
