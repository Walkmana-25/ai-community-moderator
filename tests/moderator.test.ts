// Mock dependencies first
jest.mock('../src/github-client', () => ({
  GitHubClient: jest.fn().mockImplementation(() => ({
    getFileContent: jest.fn(),
    createIssueComment: jest.fn(),
    createPullRequestComment: jest.fn(),
    hideComment: jest.fn(),
    lockIssue: jest.fn(),
    lockPullRequest: jest.fn(),
    limitInteractions: jest.fn(),
    getIssue: jest.fn(),
    getPullRequest: jest.fn(),
    getRecentComments: jest.fn()
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
        hideComment: jest.fn(),
        lockIssue: jest.fn(),
        lockPullRequest: jest.fn(),
        limitInteractions: jest.fn(),
        getIssue: jest.fn(),
        getPullRequest: jest.fn(),
        getRecentComments: jest.fn()
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
        hideComment: jest.fn(),
        lockIssue: jest.fn(),
        lockPullRequest: jest.fn(),
        limitInteractions: jest.fn(),
        getIssue: jest.fn(),
        getPullRequest: jest.fn(),
        getRecentComments: jest.fn()
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

    it('should include enhanced context for issue comments', async () => {
      const mockGitHubInstance = {
        getFileContent: jest.fn().mockRejectedValue(new Error('File not found')),
        createIssueComment: jest.fn(),
        createPullRequestComment: jest.fn(),
        hideComment: jest.fn(),
        lockIssue: jest.fn(),
        lockPullRequest: jest.fn(),
        limitInteractions: jest.fn(),
        getIssue: jest.fn().mockResolvedValue({
          title: 'Original Issue',
          body: 'This is the original issue description'
        }),
        getPullRequest: jest.fn(),
        getRecentComments: jest.fn().mockResolvedValue([
          { body: 'First comment', created_at: '2023-01-01T00:00:00Z', user: 'user1' },
          { body: 'Second comment', created_at: '2023-01-02T00:00:00Z', user: 'user2' }
        ])
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
        eventName: 'issue_comment',
        payload: {
          action: 'created',
          issue: {
            number: 1
          },
          comment: {
            body: 'This is a new comment'
          }
        },
        repo: { owner: 'test', repo: 'test' }
      } as any;

      await testModerator.processEvent(context);

      // Verify that the enhanced context was used
      expect(mockGitHubInstance.getIssue).toHaveBeenCalledWith('test', 'test', 1);
      expect(mockGitHubInstance.getRecentComments).toHaveBeenCalledWith('test', 'test', 1, 3);
      
      // Verify the AI was called with enhanced context
      expect(mockOpenAIInstance.getModeration).toHaveBeenCalled();
      const calledPrompt = mockOpenAIInstance.getModeration.mock.calls[0][0];
      expect(calledPrompt).toContain('Original Issue');
      expect(calledPrompt).toContain('This is the original issue description');
      expect(calledPrompt).toContain('Recent Comments:');
      expect(calledPrompt).toContain('@user1: First comment');
      expect(calledPrompt).toContain('@user2: Second comment');
      expect(calledPrompt).toContain('New Comment: This is a new comment');
    });

    it('should include enhanced context for PR review comments', async () => {
      const mockGitHubInstance = {
        getFileContent: jest.fn().mockRejectedValue(new Error('File not found')),
        createIssueComment: jest.fn(),
        createPullRequestComment: jest.fn(),
        hideComment: jest.fn(),
        lockIssue: jest.fn(),
        lockPullRequest: jest.fn(),
        limitInteractions: jest.fn(),
        getIssue: jest.fn(),
        getPullRequest: jest.fn().mockResolvedValue({
          title: 'Test PR',
          body: 'This is a test pull request'
        }),
        getRecentComments: jest.fn().mockResolvedValue([
          { body: 'PR comment 1', created_at: '2023-01-01T00:00:00Z', user: 'reviewer1' }
        ])
      };

      const mockOpenAIInstance = {
        getModeration: jest.fn().mockResolvedValue({
          shouldTakeAction: false,
          actionType: 'none',
          severity: 2,
          reason: 'Content is acceptable'
        }),
        testConnection: jest.fn()
      };

      (MockedGitHubClient as any).mockImplementation(() => mockGitHubInstance);
      (MockedOpenAIClient as any).mockImplementation(() => mockOpenAIInstance);

      const testModerator = new Moderator(config);

      const context = {
        eventName: 'pull_request_review_comment',
        payload: {
          action: 'created',
          pull_request: {
            number: 2
          },
          comment: {
            body: 'This looks good to me'
          }
        },
        repo: { owner: 'test', repo: 'test' }
      } as any;

      await testModerator.processEvent(context);

      // Verify that the enhanced context was used
      expect(mockGitHubInstance.getPullRequest).toHaveBeenCalledWith('test', 'test', 2);
      expect(mockGitHubInstance.getRecentComments).toHaveBeenCalledWith('test', 'test', 2, 3);
      
      // Verify the AI was called with enhanced context
      expect(mockOpenAIInstance.getModeration).toHaveBeenCalled();
      const calledPrompt = mockOpenAIInstance.getModeration.mock.calls[0][0];
      expect(calledPrompt).toContain('Test PR');
      expect(calledPrompt).toContain('This is a test pull request');
      expect(calledPrompt).toContain('Recent Comments:');
      expect(calledPrompt).toContain('@reviewer1: PR comment 1');
      expect(calledPrompt).toContain('New Review Comment: This looks good to me');
    });
  });
});