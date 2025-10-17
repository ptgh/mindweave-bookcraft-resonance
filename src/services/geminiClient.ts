interface GeminiRequestOptions {
  messages: Array<{ role: string; content: string }>;
  model?: string;
  stream?: boolean;
  maxRetries?: number;
  timeout?: number;
}

interface GeminiResponse {
  choices: Array<{
    message: {
      content: string;
    };
    delta?: {
      content?: string;
    };
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface TokenUsageLog {
  timestamp: string;
  model: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  estimated_cost: number;
}

const TOKEN_COSTS = {
  'google/gemini-2.5-pro': { input: 0.000125, output: 0.000375 },
  'google/gemini-2.5-flash': { input: 0.0000375, output: 0.00015 },
  'google/gemini-2.5-flash-lite': { input: 0.000015, output: 0.00006 },
} as const;

class GeminiClient {
  private baseUrl = 'https://ai.gateway.lovable.dev/v1/chat/completions';
  private tokenUsageLogs: TokenUsageLog[] = [];

  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private calculateCost(model: string, usage: GeminiResponse['usage']): number {
    if (!usage) return 0;

    const costs = TOKEN_COSTS[model as keyof typeof TOKEN_COSTS] || TOKEN_COSTS['google/gemini-2.5-flash'];
    const inputCost = (usage.prompt_tokens / 1000) * costs.input;
    const outputCost = (usage.completion_tokens / 1000) * costs.output;

    return inputCost + outputCost;
  }

  private logTokenUsage(model: string, usage: GeminiResponse['usage']): void {
    if (!usage) return;

    const log: TokenUsageLog = {
      timestamp: new Date().toISOString(),
      model,
      prompt_tokens: usage.prompt_tokens,
      completion_tokens: usage.completion_tokens,
      total_tokens: usage.total_tokens,
      estimated_cost: this.calculateCost(model, usage),
    };

    this.tokenUsageLogs.push(log);

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Gemini Token Usage]', log);
    }

    // Keep only last 100 logs
    if (this.tokenUsageLogs.length > 100) {
      this.tokenUsageLogs.shift();
    }
  }

  async chat(options: GeminiRequestOptions): Promise<GeminiResponse> {
    const {
      messages,
      model = 'google/gemini-2.5-flash',
      stream = false,
      maxRetries = 3,
      timeout = 30000,
    } = options;

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(this.baseUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            messages,
            stream,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          if (response.status === 429) {
            // Rate limit - exponential backoff
            const backoffMs = Math.min(1000 * Math.pow(2, attempt), 10000);
            console.warn(`Rate limited, retrying in ${backoffMs}ms...`);
            await this.sleep(backoffMs);
            continue;
          }

          if (response.status === 402) {
            throw new Error('Payment required: Please add credits to your Lovable AI workspace.');
          }

          const errorText = await response.text();
          throw new Error(`Gemini API error: ${response.status} ${errorText}`);
        }

        const data: GeminiResponse = await response.json();

        // Log token usage
        this.logTokenUsage(model, data.usage);

        return data;
      } catch (error) {
        lastError = error as Error;

        if (error instanceof Error && error.name === 'AbortError') {
          console.warn(`Request timeout (attempt ${attempt + 1}/${maxRetries})`);
        } else {
          console.error(`Gemini request failed (attempt ${attempt + 1}/${maxRetries}):`, error);
        }

        // Don't retry on certain errors
        if (
          error instanceof Error &&
          (error.message.includes('Payment required') || error.message.includes('Invalid API key'))
        ) {
          throw error;
        }

        // Exponential backoff for retries
        if (attempt < maxRetries - 1) {
          const backoffMs = Math.min(1000 * Math.pow(2, attempt), 10000);
          await this.sleep(backoffMs);
        }
      }
    }

    throw lastError || new Error('Failed to complete Gemini request after all retries');
  }

  getTokenUsageLogs(): TokenUsageLog[] {
    return [...this.tokenUsageLogs];
  }

  getTotalCost(): number {
    return this.tokenUsageLogs.reduce((sum, log) => sum + log.estimated_cost, 0);
  }

  clearLogs(): void {
    this.tokenUsageLogs = [];
  }
}

export const geminiClient = new GeminiClient();
