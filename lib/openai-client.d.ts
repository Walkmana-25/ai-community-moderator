import { ModerationDecision } from "./moderator";
export declare class OpenAIClient {
    private client;
    constructor(apiKey: string, baseURL: string);
    getModeration(prompt: string, model: string): Promise<ModerationDecision>;
    testConnection(): Promise<boolean>;
}
