import Anthropic from '@anthropic-ai/sdk';
import config from '../config/env.js';

class ClaudeService {
  constructor() {
    this.client = new Anthropic({
      apiKey: config.ANTHROPIC_API_KEY
    });
    this.model = config.ANTHROPIC_MODEL;
  }

  async analyze(prompt, code, userApiKey = null) {
    try {
      // Use user-provided API key if available, otherwise use default
      const client = userApiKey
        ? new Anthropic({ apiKey: userApiKey })
        : this.client;

      const message = await client.messages.create({
        model: this.model,
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      return message.content[0].text;
    } catch (error) {
      if (error.status === 429) {
        throw new Error('Rate limit exceeded');
      }
      if (error.status === 401) {
        throw new Error('Invalid API key');
      }
      throw error;
    }
  }

  parseJSON(text) {
    try {
      const match = text.match(/\{[\s\S]*\}/);

      if (!match) {
        throw new Error('No JSON found in response');
      }

      return JSON.parse(match[0]);
    } catch (error) {
      if (error.message === 'No JSON found in response') {
        throw error;
      }
      throw new Error('Failed to parse Claude response');
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default new ClaudeService();
