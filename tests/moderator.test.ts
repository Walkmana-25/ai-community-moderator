// Mock dependencies first
jest.mock('../src/github-client', () => ({
  GitHubClient: jest.fn().mockImplementation(() => ({
    getFileContent: jest.fn(),
    createIssueComment: jest.fn(),
    createPullRequestComment: jest.fn(),
    createDiscussionComment: jest.fn(),
    hideComment: jest.fn(),
    lockIssue: jest.fn(),
    lockPullRequest: jest.fn(),
    lockDiscussion: jest.fn(),
    limitInteractions: jest.fn()
  }))
}));

jest.mock('../src/openai-client', () => ({
  OpenAIClient: jest.fn().mockImplementation(() => ({
    getModeration: jest.fn(),
    testConnection: jest.fn()
  }))
}));

import { Moderator } from '../src/moderator';
import { GitHubClient } from '../src/github-client';
import { OpenAIClient } from '../src/openai-client';

const MockedGitHubClient = GitHubClient as jest.MockedClass<typeof GitHubClient>;
const MockedOpenAIClient = OpenAIClient as jest.MockedClass<typeof OpenAIClient>;

describe('Moderator', () => {
  let moderator: Moderator;
  const config = {
    githubToken: 'test-token',
    openaiApiKey: 'test-api-key',
    openaiBaseUrl: 'https://test.example.com',
    model: 'gpt-4o',
    severityThreshold: 5
  };

  beforeEach(() => {
    jest.clearAllMocks();
    moderator = new Moderator(config);
  });

  describe('processEvent', () => {
    it('should return no action for unsupported events', async () => {
      const context = {
        eventName: 'push',
        payload: {},
        repo: { owner: 'test', repo: 'test' }
      } as any;

      const result = await moderator.processEvent(context);

      expect(result.actionTaken).toBe('none');
      expect(result.reason).toBe('No content to moderate');
    });

    it('should process issue opened event', async () => {
      const mockGitHubInstance = {
        getFileContent: jest.fn().mockRejectedValue(new Error('File not found')),
        createIssueComment: jest.fn(),
        createPullRequestComment: jest.fn(),
        createDiscussionComment: jest.fn(),
        hideComment: jest.fn(),
        lockIssue: jest.fn(),
        lockPullRequest: jest.fn(),
        lockDiscussion: jest.fn(),
        limitInteractions: jest.fn()
      };

      const mockOpenAIInstance = {
        getModeration: jest.fn().mockResolvedValue({
          shouldTakeAction: false,
          actionType: 'none',
          severity: 3,
          reason: 'Content is acceptable'
        }),
        testConnection: jest.fn()
      };

      (MockedGitHubClient as any).mockImplementation(() => mockGitHubInstance);
      (MockedOpenAIClient as any).mockImplementation(() => mockOpenAIInstance);

      const testModerator = new Moderator(config);

      const context = {
        eventName: 'issues',
        payload: {
          action: 'opened',
          issue: {
            title: 'Test Issue',
            body: 'This is a test issue',
            number: 1
          }
        },
        repo: { owner: 'test', repo: 'test' }
      } as any;

      const result = await testModerator.processEvent(context);

      expect(result.actionTaken).toBe('none');
      expect(result.reason).toBe('Content deemed acceptable');
    });

    it('should take action when severity threshold is met', async () => {
      const mockGitHubInstance = {
        getFileContent: jest.fn().mockRejectedValue(new Error('File not found')),
        createIssueComment: jest.fn().mockResolvedValue(undefined),
        createPullRequestComment: jest.fn(),
        createDiscussionComment: jest.fn(),
        hideComment: jest.fn(),
        lockIssue: jest.fn(),
        lockPullRequest: jest.fn(),
        lockDiscussion: jest.fn(),
        limitInteractions: jest.fn()
      };

      const mockOpenAIInstance = {
        getModeration: jest.fn().mockResolvedValue({
          shouldTakeAction: true,
          actionType: 'comment',
          severity: 7,
          reason: 'Content violates guidelines',
          response: 'Please review our community guidelines.'
        }),
        testConnection: jest.fn()
      };

      (MockedGitHubClient as any).mockImplementation(() => mockGitHubInstance);
      (MockedOpenAIClient as any).mockImplementation(() => mockOpenAIInstance);

      const testModerator = new Moderator(config);

      const context = {
        eventName: 'issues',
        payload: {
          action: 'opened',
          issue: {
            title: 'Spam Issue',
            body: 'This is spam content',
            number: 1
          }
        },
        repo: { owner: 'test', repo: 'test' }
      } as any;

      const result = await testModerator.processEvent(context);

      expect(result.actionTaken).toBe('comment');
      expect(result.reason).toBe('Content violates guidelines');
      expect(mockGitHubInstance.createIssueComment).toHaveBeenCalledWith(
        'test',
        'test',
        1,
        'Please review our community guidelines.'
      );
    });

    it('should process discussion created event', async () => {
      const mockGitHubInstance = {
        getFileContent: jest.fn().mockRejectedValue(new Error('File not found')),
        createIssueComment: jest.fn(),
        createPullRequestComment: jest.fn(),
        createDiscussionComment: jest.fn().mockResolvedValue(undefined),
        hideComment: jest.fn(),
        lockIssue: jest.fn(),
        lockPullRequest: jest.fn(),
        lockDiscussion: jest.fn(),
        limitInteractions: jest.fn()
      };

      const mockOpenAIInstance = {
        getModeration: jest.fn().mockResolvedValue({
          shouldTakeAction: true,
          actionType: 'comment',
          severity: 6,
          reason: 'Discussion needs guidelines reminder',
          response: 'Welcome to discussions! Please follow our community guidelines.'
        }),
        testConnection: jest.fn()
      };

      (MockedGitHubClient as any).mockImplementation(() => mockGitHubInstance);
      (MockedOpenAIClient as any).mockImplementation(() => mockOpenAIInstance);

      const testModerator = new Moderator(config);

      const context = {
        eventName: 'discussion',
        payload: {
          action: 'created',
          discussion: {
            title: 'Test Discussion',
            body: 'This is a test discussion',
            node_id: 'D_test123'
          }
        },
        repo: { owner: 'test', repo: 'test' }
      } as any;

      const result = await testModerator.processEvent(context);

      expect(result.actionTaken).toBe('comment');
      expect(result.reason).toBe('Discussion needs guidelines reminder');
      expect(mockGitHubInstance.createDiscussionComment).toHaveBeenCalledWith(
        'D_test123',
        'Welcome to discussions! Please follow our community guidelines.'
      );
    });
  });

  describe('extractContent', () => {
    it('should extract content from issue opened event', () => {
      const context = {
        eventName: 'issues',
        payload: {
          action: 'opened',
          issue: {
            title: 'Test Issue',
            body: 'This is a test issue'
          }
        }
      };

      const content = (moderator as any).extractContent(context.eventName, context.payload);
      expect(content).toBe('Issue Title: Test Issue\nIssue Body: This is a test issue');
    });

    it('should extract content from PR opened event', () => {
      const context = {
        eventName: 'pull_request',
        payload: {
          action: 'opened',
          pull_request: {
            title: 'Test PR',
            body: 'This is a test PR'
          }
        }
      };

      const content = (moderator as any).extractContent(context.eventName, context.payload);
      expect(content).toBe('PR Title: Test PR\nPR Body: This is a test PR');
    });

    it('should extract content from comment created event', () => {
      const context = {
        eventName: 'issue_comment',
        payload: {
          action: 'created',
          comment: {
            body: 'This is a test comment'
          }
        }
      };

      const content = (moderator as any).extractContent(context.eventName, context.payload);
      expect(content).toBe('Comment: This is a test comment');
    });

    it('should extract content from discussion created event', () => {
      const context = {
        eventName: 'discussion',
        payload: {
          action: 'created',
          discussion: {
            title: 'Test Discussion',
            body: 'This is a test discussion'
          }
        }
      };

      const content = (moderator as any).extractContent(context.eventName, context.payload);
      expect(content).toBe('Discussion Title: Test Discussion\nDiscussion Body: This is a test discussion');
    });

    it('should extract content from discussion comment created event', () => {
      const context = {
        eventName: 'discussion_comment',
        payload: {
          action: 'created',
          comment: {
            body: 'This is a test discussion comment'
          }
        }
      };

      const content = (moderator as any).extractContent(context.eventName, context.payload);
      expect(content).toBe('Discussion Comment: This is a test discussion comment');
    });
  });
});