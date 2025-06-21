import { GitHubClient } from '../src/github-client';

// Mock the Octokit constructor
jest.mock('@octokit/rest', () => {
  const mockOctokit = {
    rest: {
      repos: {
        getContent: jest.fn()
      },
      issues: {
        createComment: jest.fn(),
        lock: jest.fn()
      },
      interactions: {
        setRestrictionsForRepo: jest.fn()
      }
    },
    graphql: jest.fn()
  };
  
  return {
    Octokit: jest.fn(() => mockOctokit)
  };
});

describe('GitHubClient', () => {
  let client: GitHubClient;

  beforeEach(() => {
    jest.clearAllMocks();
    client = new GitHubClient('test-token');
  });

  describe('getFileContent', () => {
    it('should return decoded file content', async () => {
      const mockContent = Buffer.from('Hello World').toString('base64');
      const { Octokit } = require('@octokit/rest');
      const mockInstance = new Octokit();
      
      mockInstance.rest.repos.getContent.mockResolvedValue({
        data: { content: mockContent }
      });

      const result = await client.getFileContent('owner', 'repo', 'path');
      
      expect(result).toBe('Hello World');
      expect(mockInstance.rest.repos.getContent).toHaveBeenCalledWith({
        owner: 'owner',
        repo: 'repo',
        path: 'path'
      });
    });

    it('should throw error when file not found', async () => {
      const { Octokit } = require('@octokit/rest');
      const mockInstance = new Octokit();
      
      mockInstance.rest.repos.getContent.mockRejectedValue(new Error('Not found'));

      await expect(client.getFileContent('owner', 'repo', 'path')).rejects.toThrow('Not found');
    });
  });

  describe('createIssueComment', () => {
    it('should create issue comment successfully', async () => {
      const { Octokit } = require('@octokit/rest');
      const mockInstance = new Octokit();
      
      mockInstance.rest.issues.createComment.mockResolvedValue({});

      await client.createIssueComment('owner', 'repo', 1, 'test comment');

      expect(mockInstance.rest.issues.createComment).toHaveBeenCalledWith({
        owner: 'owner',
        repo: 'repo',
        issue_number: 1,
        body: 'test comment'
      });
    });
  });

  describe('hideComment', () => {
    it('should hide comment using GraphQL', async () => {
      const { Octokit } = require('@octokit/rest');
      const mockInstance = new Octokit();
      
      mockInstance.graphql.mockResolvedValue({});

      await client.hideComment('node-id-123');

      expect(mockInstance.graphql).toHaveBeenCalledWith(
        expect.stringContaining('minimizeComment'),
        { nodeId: 'node-id-123' }
      );
    });
  });

  describe('lockIssue', () => {
    it('should lock issue successfully', async () => {
      const { Octokit } = require('@octokit/rest');
      const mockInstance = new Octokit();
      
      mockInstance.rest.issues.lock.mockResolvedValue({});

      await client.lockIssue('owner', 'repo', 1);

      expect(mockInstance.rest.issues.lock).toHaveBeenCalledWith({
        owner: 'owner',
        repo: 'repo',
        issue_number: 1,
        lock_reason: 'spam'
      });
    });
  });
});