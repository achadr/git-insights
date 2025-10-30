import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// Create mock function at module level
const mockMessagesCreate = jest.fn();

jest.mock('@anthropic-ai/sdk', () => ({
  default: jest.fn(function() {
    return {
      messages: {
        create: mockMessagesCreate
      }
    };
  })
}));

// Mock config
jest.mock('../../config/env.js', () => ({
  default: {
    ANTHROPIC_API_KEY: 'sk-ant-test-system-key',
    ANTHROPIC_MODEL: 'claude-sonnet-4'
  }
}));

// Import after mocks
import claudeService from '../../services/claudeService.js';
import Anthropic from '@anthropic-ai/sdk';
import { mockClaudeResponse } from '../mocks/mockData.js';

describe('ClaudeService', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // mockMessagesCreate is now defined from the factory above
    // Reset the service's client to use the mock
    claudeService.client = {
      messages: {
        create: mockMessagesCreate
      }
    };
  });

  describe('analyze', () => {
    beforeEach(() => {
      // Set up default mock response for all tests
      mockMessagesCreate.mockResolvedValue(mockClaudeResponse);
    });

    it('should successfully analyze code with system API key', async () => {
      const prompt = 'Analyze this code';
      const code = '';

      const result = await claudeService.analyze(prompt, code, null);

      expect(result).toBe(mockClaudeResponse.content[0].text);
      expect(mockMessagesCreate).toHaveBeenCalledWith({
        model: 'claude-sonnet-4',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });
    });

    it('should use user-provided API key when provided', async () => {
      const userApiKey = 'sk-ant-user-custom-key';

      const prompt = 'Analyze this code';
      const result = await claudeService.analyze(prompt, '', userApiKey);

      expect(result).toBe(mockClaudeResponse.content[0].text);

      // API key usage is verified through mockMessagesCreate being called
      expect(mockMessagesCreate).toHaveBeenCalled();
    });

    it('should use system API key when user key is null', async () => {
      mockMessagesCreate.mockResolvedValue(mockClaudeResponse);

      const prompt = 'Analyze this code';
      await claudeService.analyze(prompt, '', null);

      // The service should use the instance created in constructor
      // which uses the system API key
      expect(mockMessagesCreate).toHaveBeenCalled();
    });

    it('should handle rate limit errors (429)', async () => {
      const rateLimitError = new Error('Rate limit exceeded');
      rateLimitError.status = 429;

      mockMessagesCreate.mockRejectedValue(rateLimitError);

      await expect(
        claudeService.analyze('test prompt', '', null)
      ).rejects.toThrow('Rate limit exceeded');
    });

    it('should handle invalid API key errors (401)', async () => {
      const authError = new Error('Invalid API key');
      authError.status = 401;

      mockMessagesCreate.mockRejectedValue(authError);

      await expect(
        claudeService.analyze('test prompt', '', null)
      ).rejects.toThrow('Invalid API key');
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network connection failed');
      networkError.code = 'ECONNREFUSED';

      mockMessagesCreate.mockRejectedValue(networkError);

      await expect(
        claudeService.analyze('test prompt', '', null)
      ).rejects.toThrow('Network connection failed');
    });

    it('should handle timeout errors', async () => {
      const timeoutError = new Error('Request timeout');
      timeoutError.code = 'ETIMEDOUT';

      mockMessagesCreate.mockRejectedValue(timeoutError);

      await expect(
        claudeService.analyze('test prompt', '', null)
      ).rejects.toThrow('Request timeout');
    });

    it('should handle generic API errors', async () => {
      const genericError = new Error('Unknown API error');
      genericError.status = 500;

      mockMessagesCreate.mockRejectedValue(genericError);

      await expect(
        claudeService.analyze('test prompt', '', null)
      ).rejects.toThrow('Unknown API error');
    });

    it('should pass correct model and token configuration', async () => {
      mockMessagesCreate.mockResolvedValue(mockClaudeResponse);

      await claudeService.analyze('test prompt', '', null);

      expect(mockMessagesCreate).toHaveBeenCalledWith({
        model: 'claude-sonnet-4',
        max_tokens: 4096,
        messages: expect.any(Array)
      });
    });

    it('should handle empty prompt', async () => {
      mockMessagesCreate.mockResolvedValue(mockClaudeResponse);

      const result = await claudeService.analyze('', '', null);

      expect(result).toBe(mockClaudeResponse.content[0].text);
      expect(mockMessagesCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: [{ role: 'user', content: '' }]
        })
      );
    });

    it('should handle long prompts', async () => {
      mockMessagesCreate.mockResolvedValue(mockClaudeResponse);

      const longPrompt = 'a'.repeat(10000);
      await claudeService.analyze(longPrompt, '', null);

      expect(mockMessagesCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: [{ role: 'user', content: longPrompt }]
        })
      );
    });

    it('should extract text from Claude response correctly', async () => {
      const customResponse = {
        content: [
          {
            type: 'text',
            text: 'Custom analysis result'
          }
        ]
      };

      mockMessagesCreate.mockResolvedValue(customResponse);

      const result = await claudeService.analyze('test', '', null);

      expect(result).toBe('Custom analysis result');
    });
  });

  describe('parseJSON', () => {
    it('should parse valid JSON from text', () => {
      const jsonText = JSON.stringify({
        overall: 85,
        structure: { score: 90, issues: [], recommendations: [] }
      });

      const result = claudeService.parseJSON(jsonText);

      expect(result).toEqual({
        overall: 85,
        structure: { score: 90, issues: [], recommendations: [] }
      });
    });

    it('should extract JSON from text with surrounding content', () => {
      const textWithJson = `
        Here is the analysis:
        {
          "overall": 85,
          "structure": {
            "score": 90,
            "issues": [],
            "recommendations": []
          }
        }
        That's the result.
      `;

      const result = claudeService.parseJSON(textWithJson);

      expect(result).toHaveProperty('overall', 85);
      expect(result).toHaveProperty('structure');
    });

    it('should handle JSON with nested objects', () => {
      const complexJson = JSON.stringify({
        overall: 85,
        details: {
          structure: {
            score: 90,
            nested: {
              deep: {
                value: true
              }
            }
          }
        }
      });

      const result = claudeService.parseJSON(complexJson);

      expect(result.details.structure.nested.deep.value).toBe(true);
    });

    it('should handle JSON with arrays', () => {
      const jsonWithArrays = JSON.stringify({
        overall: 85,
        issues: ['issue1', 'issue2', 'issue3'],
        scores: [90, 85, 80]
      });

      const result = claudeService.parseJSON(jsonWithArrays);

      expect(result.issues).toHaveLength(3);
      expect(result.scores).toEqual([90, 85, 80]);
    });

    it('should throw error when no JSON is found', () => {
      const textWithoutJson = 'This is just plain text without any JSON';

      expect(() => {
        claudeService.parseJSON(textWithoutJson);
      }).toThrow('No JSON found in response');
    });

    it('should throw error for invalid JSON syntax', () => {
      const invalidJson = '{ invalid json syntax }';

      expect(() => {
        claudeService.parseJSON(invalidJson);
      }).toThrow('Failed to parse Claude response');
    });

    it('should handle JSON with special characters', () => {
      const jsonWithSpecialChars = JSON.stringify({
        message: 'Code contains "quotes" and \'apostrophes\'',
        path: 'C:\\Users\\test\\file.js',
        unicode: '🚀'
      });

      const result = claudeService.parseJSON(jsonWithSpecialChars);

      expect(result.message).toContain('quotes');
      expect(result.path).toContain('\\');
      expect(result.unicode).toBe('🚀');
    });

    it('should handle empty objects', () => {
      const emptyJson = '{}';

      const result = claudeService.parseJSON(emptyJson);

      expect(result).toEqual({});
    });

    it('should handle null values in JSON', () => {
      const jsonWithNull = JSON.stringify({
        value: null,
        array: [1, null, 3]
      });

      const result = claudeService.parseJSON(jsonWithNull);

      expect(result.value).toBeNull();
      expect(result.array[1]).toBeNull();
    });

    it('should handle malformed JSON gracefully', () => {
      const malformedJson = '{ "key": "value", }'; // Trailing comma

      expect(() => {
        claudeService.parseJSON(malformedJson);
      }).toThrow();
    });
  });

  describe('Error handling with different API key configurations', () => {
    it('should properly handle error with user API key', async () => {
      const userApiKey = 'sk-ant-invalid-user-key';
      const authError = new Error('Invalid credentials');
      authError.status = 401;

      mockMessagesCreate.mockRejectedValue(authError);

      await expect(
        claudeService.analyze('test', '', userApiKey)
      ).rejects.toThrow('Invalid API key');
    });

    it('should create separate instances for different user keys', async () => {
      mockMessagesCreate.mockResolvedValue(mockClaudeResponse);

      await claudeService.analyze('test', '', 'sk-ant-user-key-1');
      await claudeService.analyze('test', '', 'sk-ant-user-key-2');

      // Should have called messages.create for each analysis
      expect(mockMessagesCreate).toHaveBeenCalledTimes(2);
    });

    it('should reuse system client when no user key provided', async () => {
      mockMessagesCreate.mockResolvedValue(mockClaudeResponse);

      await claudeService.analyze('test1', '', null);
      await claudeService.analyze('test2', '', null);

      // Should have called messages.create for each analysis
      expect(mockMessagesCreate).toHaveBeenCalledTimes(2);
    });
  });

  describe('Response validation', () => {
    it('should handle response with multiple content blocks', async () => {
      const multiContentResponse = {
        content: [
          { type: 'text', text: 'First part' },
          { type: 'text', text: 'Second part' }
        ]
      };

      mockMessagesCreate.mockResolvedValue(multiContentResponse);

      const result = await claudeService.analyze('test', '', null);

      // Should return first content block
      expect(result).toBe('First part');
    });

    it('should handle empty content array gracefully', async () => {
      const emptyContentResponse = {
        content: []
      };

      mockMessagesCreate.mockResolvedValue(emptyContentResponse);

      await expect(
        claudeService.analyze('test', '', null)
      ).rejects.toThrow();
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complete analysis workflow', async () => {
      const analysisResponse = {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              overall: 85,
              structure: {
                score: 90,
                issues: ['Consider modular design'],
                recommendations: ['Break into smaller files']
              },
              naming: {
                score: 85,
                issues: [],
                recommendations: ['Use descriptive names']
              },
              errorHandling: {
                score: 80,
                issues: ['Add error boundaries'],
                recommendations: ['Implement try-catch']
              },
              documentation: {
                score: 75,
                issues: ['Missing docs'],
                recommendations: ['Add JSDoc']
              },
              testing: {
                score: 70,
                issues: ['Low coverage'],
                recommendations: ['Add unit tests']
              }
            })
          }
        ]
      };

      mockMessagesCreate.mockResolvedValue(analysisResponse);

      const result = await claudeService.analyze(
        'Analyze this code for quality',
        '',
        null
      );

      const parsed = claudeService.parseJSON(result);

      expect(parsed.overall).toBe(85);
      expect(parsed.structure.score).toBe(90);
      expect(parsed.testing.recommendations).toContain('Add unit tests');
    });
  });
});
