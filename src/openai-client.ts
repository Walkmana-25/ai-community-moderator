import OpenAI from "openai";
import { ModerationDecision } from "./moderator";
import * as core from "@actions/core";

export class OpenAIClient {
  private client: OpenAI;

  constructor(apiKey: string, baseURL: string) {
    this.client = new OpenAI({
      apiKey,
      baseURL,
    });
  }

  async getModeration(
    prompt: string,
    model: string,
  ): Promise<ModerationDecision> {
    try {
      const response = await this.client.chat.completions.create({
        model,
        messages: [
          {
            role: "system",
            content:
              "You are a helpful community moderator. Respond only with valid JSON as specified in the prompt.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 1000,
      });
  
      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No response from AI model");
      }
  
      // Helper: try to extract a single JSON object from arbitrary text
      const extractJson = (text: string): string | null => {
        if (!text) return null;
        // Remove common code fences and surrounding backticks
        text = text.replace(/```(?:json)?\r?\n?/gi, "").replace(/```/g, "");
        // Remove surrounding single backticks
        text = text.replace(/`/g, "");
        // Find first '{' and then find matching closing '}' by tracking depth
        const firstIdx = text.indexOf("{");
        if (firstIdx === -1) return null;
        let depth = 0;
        for (let i = firstIdx; i < text.length; i++) {
          const ch = text[i];
          if (ch === "{") depth++;
          else if (ch === "}") {
            depth--;
            if (depth === 0) {
              return text.slice(firstIdx, i + 1);
            }
          }
        }
        // Fallback: try simple regex to capture a {...} block (greedy)
        const match = text.match(/\{[\s\S]*\}/);
        return match ? match[0] : null;
      };
  
      // Attempt to extract JSON and parse
      let parsed: any = null;
      const candidates: string[] = [];
      const extracted = extractJson(content);
      if (extracted) candidates.push(extracted);
      // also try raw content as last resort
      candidates.push(content.trim());
  
      for (const candidate of candidates) {
        try {
          parsed = JSON.parse(candidate);
          break;
        } catch {
          // continue to next candidate
        }
      }
  
      if (!parsed) {
        core.warning(`Failed to parse AI response as JSON`);
        core.debug(`Raw AI response: ${content}`);
        return {
          shouldTakeAction: false,
          actionType: "none",
          severity: 1,
          reason: "Failed to parse AI response",
        };
      }
  
      // Validate the parsed object structure
      const decision = parsed as ModerationDecision;
      if (
        typeof decision.shouldTakeAction !== "boolean" ||
        typeof decision.severity !== "number" ||
        typeof decision.reason !== "string" ||
        !["comment", "hide", "lock", "suggest", "none"].includes(
          (decision.actionType as any) || "",
        )
      ) {
        core.warning(
          `AI returned JSON but with invalid shape: ${JSON.stringify(decision)}`,
        );
        return {
          shouldTakeAction: false,
          actionType: "none",
          severity: 1,
          reason: "Invalid response structure from AI model",
        };
      }
  
      // Normalize fields
      decision.severity = Math.round(
        Math.max(1, Math.min(10, Number(decision.severity) || 1)),
      );
      if (decision.response === undefined) {
        decision.response = null;
      }
  
      core.debug(`AI Decision: ${JSON.stringify(decision)}`);
      return decision;
    } catch (error) {
      core.error(`OpenAI API error: ${error}`);
      throw new Error(
        `AI moderation failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.chat.completions.create({
        model: "openai/gpt-4.1",
        messages: [{ role: "user", content: "Test connection" }],
        max_tokens: 5,
      });
      return !!response.choices[0]?.message?.content;
    } catch (error) {
      core.warning(`OpenAI connection test failed: ${error}`);
      return false;
    }
  }
}
