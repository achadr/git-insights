// Manual mock for @anthropic-ai/sdk
// Prevents any real API calls during tests

import { jest } from '@jest/globals';

const mockMessagesCreate = jest.fn();

const mockAnthropicInstance = {
  messages: {
    create: mockMessagesCreate
  }
};

const Anthropic = jest.fn(() => mockAnthropicInstance);

// Export the constructor as default
export default Anthropic;

// Export mock functions for test assertions
export { mockMessagesCreate, mockAnthropicInstance };
