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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAIClient = void 0;
const openai_1 = __importDefault(require("openai"));
const core = __importStar(require("@actions/core"));
class OpenAIClient {
    constructor(apiKey, baseURL) {
        this.client = new openai_1.default({
            apiKey,
            baseURL
        });
    }
    async getModeration(prompt, model) {
        try {
            const response = await this.client.chat.completions.create({
                model,
                messages: [
                    {
                        role: 'system',
                        content: 'You are a helpful community moderator. Respond only with valid JSON as specified in the prompt.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.3,
                max_tokens: 1000
            });
            const content = response.choices[0]?.message?.content;
            if (!content) {
                throw new Error('No response from AI model');
            }
            try {
                const decision = JSON.parse(content);
                // Validate the response structure
                if (typeof decision.shouldTakeAction !== 'boolean' ||
                    typeof decision.severity !== 'number' ||
                    typeof decision.reason !== 'string' ||
                    !['comment', 'hide', 'lock', 'suggest', 'none'].includes(decision.actionType)) {
                    throw new Error('Invalid response structure from AI model');
                }
                // Ensure severity is within bounds
                decision.severity = Math.max(1, Math.min(10, decision.severity));
                core.debug(`AI Decision: ${JSON.stringify(decision)}`);
                return decision;
            }
            catch (parseError) {
                core.warning(`Failed to parse AI response: ${parseError}`);
                core.debug(`Raw AI response: ${content}`);
                // Fallback decision
                return {
                    shouldTakeAction: false,
                    actionType: 'none',
                    severity: 1,
                    reason: 'Failed to parse AI response'
                };
            }
        }
        catch (error) {
            core.error(`OpenAI API error: ${error}`);
            throw new Error(`AI moderation failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async testConnection() {
        try {
            const response = await this.client.chat.completions.create({
                model: 'openai/gpt-4.1',
                messages: [{ role: 'user', content: 'Test connection' }],
                max_tokens: 5
            });
            return !!response.choices[0]?.message?.content;
        }
        catch (error) {
            core.warning(`OpenAI connection test failed: ${error}`);
            return false;
        }
    }
}
exports.OpenAIClient = OpenAIClient;
//# sourceMappingURL=openai-client.js.map