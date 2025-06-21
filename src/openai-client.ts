import OpenAI from 'openai';
import { ModerationDecision } from './moderator';
import * as core from '@actions/core';

export class OpenAIClient {
  private client: OpenAI;

  constructor(apiKey: string, baseURL: string) {
    this.client = new OpenAI({
      apiKey,
      baseURL
    });
  }

  async getModeration(prompt: string, model: string): Promise<ModerationDecision> {
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
        const decision = JSON.parse(content) as ModerationDecision;
        
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
      } catch (parseError) {
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
    } catch (error) {
      core.error(`OpenAI API error: ${error}`);
      throw new Error(`AI moderation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: 'Test connection' }],
        max_tokens: 5
      });
      return !!response.choices[0]?.message?.content;
    } catch (error) {
      core.warning(`OpenAI connection test failed: ${error}`);
      return false;
    }
  }
}