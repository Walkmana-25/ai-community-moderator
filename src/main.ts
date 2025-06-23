import * as core from '@actions/core';
import * as github from '@actions/github';
import { Moderator } from './moderator';

async function run(): Promise<void> {
  try {
    // Get inputs
    const token = core.getInput('github-token', { required: true });
    const openaiBaseUrl = core.getInput('openai-base-url') || 'https://models.github.ai/inference';
    const model = core.getInput('model') || 'openai/gpt-4.1';
    const severityThreshold = parseInt(core.getInput('severity-threshold') || '5', 10);

    // Initialize moderator
    const moderator = new Moderator({
      githubToken: token,
      openaiApiKey: token, // Use GitHub token for GitHub Models authentication
      openaiBaseUrl,
      model,
      severityThreshold
    });

    // Get event context
    const context = github.context;
    
    // Process the event
    const result = await moderator.processEvent(context);
    
    // Set outputs
    core.setOutput('action-taken', result.actionTaken);
    core.setOutput('reason', result.reason);
    
    core.info(`Moderation completed: ${result.actionTaken} - ${result.reason}`);
  } catch (error) {
    core.setFailed(`Action failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

run();