import { env } from '../config/env';

/**
 * OpenRouter AI Service
 * Integrates with OpenRouter API for AI model interactions
 */

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface OpenRouterResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface OpenRouterRequestOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export class OpenRouterService {
  private apiKey: string;
  private baseUrl: string;
  private defaultModel: string;

  constructor(
    apiKey: string = env.OPENROUTER_API_KEY,
    baseUrl: string = env.OPENROUTER_BASE_URL,
    defaultModel: string = env.OPENROUTER_MODEL
  ) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.defaultModel = defaultModel;

    if (!this.apiKey) {
      throw new Error('OPENROUTER_API_KEY environment variable is not set');
    }
  }

  /**
   * Send a message to OpenRouter API
   */
  async sendMessage(
    messages: Message[],
    options: OpenRouterRequestOptions = {}
  ): Promise<string> {
    const {
      model = this.defaultModel,
      temperature = 0.7,
      maxTokens = 2000,
      systemPrompt,
    } = options;

    const payload = {
      model,
      messages: systemPrompt
        ? [{ role: 'system', content: systemPrompt }, ...messages]
        : messages,
      temperature,
      max_tokens: maxTokens,
    };

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
          'HTTP-Referer': env.FRONTEND_URL,
          'X-Title': 'DokAi',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `OpenRouter API error: ${response.status} - ${
            errorData.error?.message || 'Unknown error'
          }`
        );
      }

      const data: OpenRouterResponse = await response.json();
      const content = data.choices[0]?.message?.content;

      if (!content) {
        throw new Error('No content received from OpenRouter API');
      }

      return content;
    } catch (error) {
      console.error('OpenRouter API error:', error);
      throw error;
    }
  }

  /**
   * Generate documentation for code
   */
  async generateDocumentation(code: string, language: string): Promise<string> {
    const systemPrompt = `You are an expert code documentation generator. Generate clear, concise, and professional documentation for the provided ${language} code. Include:
1. Function/Class description
2. Parameters and their types
3. Return value and type
4. Usage examples if applicable
5. Any important notes or edge cases`;

    const messages: Message[] = [
      {
        role: 'user',
        content: `Generate documentation for this ${language} code:\n\n${code}`,
      },
    ];

    return this.sendMessage(messages, {
      systemPrompt,
      temperature: 0.5,
      maxTokens: 2000,
    });
  }

  /**
   * Generate code explanations
   */
  async explainCode(code: string, language: string): Promise<string> {
    const systemPrompt = `You are an expert code explainer. Provide a clear, step-by-step explanation of what the provided ${language} code does. Break it down into:
1. Overall purpose
2. Key components and what they do
3. Logic flow
4. Important details to understand`;

    const messages: Message[] = [
      {
        role: 'user',
        content: `Explain this ${language} code:\n\n${code}`,
      },
    ];

    return this.sendMessage(messages, {
      systemPrompt,
      temperature: 0.5,
      maxTokens: 1500,
    });
  }

  /**
   * Review code for improvements
   */
  async reviewCode(code: string, language: string): Promise<string> {
    const systemPrompt = `You are an expert code reviewer. Analyze the provided ${language} code and provide:
1. Any potential bugs or issues
2. Performance improvements
3. Best practices that could be applied
4. Security considerations
5. Code style and readability suggestions`;

    const messages: Message[] = [
      {
        role: 'user',
        content: `Review this ${language} code:\n\n${code}`,
      },
    ];

    return this.sendMessage(messages, {
      systemPrompt,
      temperature: 0.5,
      maxTokens: 2000,
    });
  }

  /**
   * Generate unit tests
   */
  async generateTests(
    code: string,
    language: string,
    framework?: string
  ): Promise<string> {
    const frameworkText = framework ? ` using ${framework}` : '';
    const systemPrompt = `You are an expert test writer. Generate comprehensive unit tests${frameworkText} for the provided ${language} code. Include:
1. Test setup and teardown
2. Happy path tests
3. Edge case tests
4. Error handling tests
5. Complete test coverage`;

    const messages: Message[] = [
      {
        role: 'user',
        content: `Generate tests for this ${language} code${frameworkText}:\n\n${code}`,
      },
    ];

    return this.sendMessage(messages, {
      systemPrompt,
      temperature: 0.6,
      maxTokens: 2500,
    });
  }

  /**
   * Chat with context for conversation
   */
  async chat(
    userMessage: string,
    conversationHistory: Message[] = [],
    options: OpenRouterRequestOptions = {}
  ): Promise<string> {
    const messages: Message[] = [
      ...conversationHistory,
      { role: 'user', content: userMessage },
    ];

    return this.sendMessage(messages, options);
  }

  /**
   * Get available models
   */
  async getAvailableModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.status}`);
      }

      const data = await response.json();
      return data.data.map((model: any) => model.id);
    } catch (error) {
      console.error('Error fetching available models:', error);
      return [this.defaultModel];
    }
  }
}

// Export singleton instance
export const openRouterService = new OpenRouterService();
