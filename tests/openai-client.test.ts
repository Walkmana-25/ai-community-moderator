import { OpenAIClient } from '../src/openai-client';

// Mock OpenAI
jest.mock('openai', () => {
  const mockOpenAI = {
    chat: {
      completions: {
        create: jest.fn()
      }
    }
  };
  
  return jest.fn(() => mockOpenAI);
});

describe('OpenAIClient', () => {
  let client: OpenAIClient;

  beforeEach(() => {
    jest.clearAllMocks();
    client = new OpenAIClient('test-api-key', 'https://test.example.com');
  });

  describe('getModeration', () => {
    it('should return valid moderation decision', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              shouldTakeAction: true,
              actionType: 'comment',
              severity: 7,
              reason: 'Content violates guidelines',
              response: 'Please review our guidelines'
            })
          }
        }]
      };

      const OpenAI = require('openai');
      const mockInstance = new OpenAI();
      mockInstance.chat.completions.create.mockResolvedValue(mockResponse);

      const result = await client.getModeration('test prompt', 'gpt-4o');

      expect(result.shouldTakeAction).toBe(true);
      expect(result.actionType).toBe('comment');
      expect(result.severity).toBe(7);
      expect(result.reason).toBe('Content violates guidelines');
      expect(result.response).toBe('Please review our guidelines');
    });

    it('should handle invalid JSON response gracefully', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: 'Invalid JSON response'
          }
        }]
      };

      const OpenAI = require('openai');
      const mockInstance = new OpenAI();
      mockInstance.chat.completions.create.mockResolvedValue(mockResponse);

      const result = await client.getModeration('test prompt', 'gpt-4o');

      expect(result.shouldTakeAction).toBe(false);
      expect(result.actionType).toBe('none');
      expect(result.severity).toBe(1);
      expect(result.reason).toBe('Failed to parse AI response');
    });

    it('should handle API errors', async () => {
      const OpenAI = require('openai');
      const mockInstance = new OpenAI();
      mockInstance.chat.completions.create.mockRejectedValue(new Error('API Error'));

      await expect(client.getModeration('test prompt', 'gpt-4o')).rejects.toThrow('AI moderation failed: API Error');
    });

    it('should clamp severity values to valid range', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              shouldTakeAction: true,
              actionType: 'comment',
              severity: 15, // Above max
              reason: 'Test',
              response: 'Test'
            })
          }
        }]
      };

      const OpenAI = require('openai');
      const mockInstance = new OpenAI();
      mockInstance.chat.completions.create.mockResolvedValue(mockResponse);

      const result = await client.getModeration('test prompt', 'gpt-4o');

      expect(result.severity).toBe(10); // Should be clamped to max
    });
  });

  describe('testConnection', () => {
    it('should return true for successful connection', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: 'Test response'
          }
        }]
      };

      const OpenAI = require('openai');
      const mockInstance = new OpenAI();
      mockInstance.chat.completions.create.mockResolvedValue(mockResponse);

      const result = await client.testConnection();

      expect(result).toBe(true);
    });

    it('should return false for failed connection', async () => {
      const OpenAI = require('openai');
      const mockInstance = new OpenAI();
      mockInstance.chat.completions.create.mockRejectedValue(new Error('Connection failed'));

      const result = await client.testConnection();

      expect(result).toBe(false);
    });
  });
});