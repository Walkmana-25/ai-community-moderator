// Mock dependencies first
jest.mock('@actions/core', () => ({
  getInput: jest.fn(),
  setOutput: jest.fn(),
  setFailed: jest.fn(),
  info: jest.fn(),
  warning: jest.fn()
}));

jest.mock('@actions/github', () => ({
  context: {
    eventName: 'issues',
    payload: {
      action: 'opened',
      issue: {
        title: 'Test Issue',
        body: 'Test body',
        number: 1
      }
    },
    repo: { owner: 'test', repo: 'test' }
  }
}));

jest.mock('../src/moderator', () => ({
  Moderator: jest.fn().mockImplementation(() => ({
    processEvent: jest.fn()
  }))
}));

import * as core from '@actions/core';
import { Moderator } from '../src/moderator';

import { run } from '../src/main';

const MockedCore = core as jest.Mocked<typeof core>;
const MockedModerator = Moderator as jest.MockedClass<typeof Moderator>;

describe('main', () => {
  let mockModeratorInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    MockedCore.getInput.mockImplementation((name: string) => {
      switch (name) {
        case 'github-token':
          return 'test-token';
        case 'openai-base-url':
          return '';
        case 'model':
          return '';
        case 'severity-threshold':
          return '';
        default:
          return '';
      }
    });

    mockModeratorInstance = {
      processEvent: jest.fn()
    };
    
    MockedModerator.mockImplementation(() => mockModeratorInstance);
  });

  it('should use core.info when no action is taken', async () => {
    mockModeratorInstance.processEvent.mockResolvedValue({
      actionTaken: 'none',
      reason: 'Content deemed acceptable'
    });

    await run();

    expect(MockedCore.info).toHaveBeenCalledWith('Moderation completed: none - Content deemed acceptable');
    expect(MockedCore.warning).not.toHaveBeenCalled();
  });

  it('should use core.warning when a comment action is taken', async () => {
    mockModeratorInstance.processEvent.mockResolvedValue({
      actionTaken: 'comment',
      reason: 'Content violates guidelines'
    });

    await run();

    expect(MockedCore.warning).toHaveBeenCalledWith('Moderation action taken: comment - Content violates guidelines');
    expect(MockedCore.info).not.toHaveBeenCalled();
  });

  it('should use core.warning for lock action', async () => {
    mockModeratorInstance.processEvent.mockResolvedValue({
      actionTaken: 'lock',
      reason: 'Severe violation detected'
    });

    await run();

    expect(MockedCore.warning).toHaveBeenCalledWith('Moderation action taken: lock - Severe violation detected');
    expect(MockedCore.info).not.toHaveBeenCalled();
  });

  it('should use core.warning for hide action', async () => {
    mockModeratorInstance.processEvent.mockResolvedValue({
      actionTaken: 'hide',
      reason: 'Inappropriate content hidden'
    });

    await run();

    expect(MockedCore.warning).toHaveBeenCalledWith('Moderation action taken: hide - Inappropriate content hidden');
    expect(MockedCore.info).not.toHaveBeenCalled();
  });

  it('should use core.warning for suggest action', async () => {
    mockModeratorInstance.processEvent.mockResolvedValue({
      actionTaken: 'suggest',
      reason: 'Suggesting improvements'
    });

    await run();

    expect(MockedCore.warning).toHaveBeenCalledWith('Moderation action taken: suggest - Suggesting improvements');
    expect(MockedCore.info).not.toHaveBeenCalled();
  });

  it('should set correct outputs regardless of action type', async () => {
    mockModeratorInstance.processEvent.mockResolvedValue({
      actionTaken: 'comment',
      reason: 'Content violates guidelines'
    });

    await run();

    expect(MockedCore.setOutput).toHaveBeenCalledWith('action-taken', 'comment');
    expect(MockedCore.setOutput).toHaveBeenCalledWith('reason', 'Content violates guidelines');
  });
});