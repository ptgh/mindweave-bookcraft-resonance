import { supabase } from '@/integrations/supabase/client';

interface AIRequestOptions {
  messages: Array<{ role: string; content: string }>;
  model?: string;
  temperature?: number;
  maxRetries?: number;
  retryDelay?: number;
}

interface AIResponse {
  content: string;
  error?: string;
}

class GeminiClient {
  private readonly DEFAULT_MAX_RETRIES = 3;
  private readonly DEFAULT_RETRY_DELAY = 1000;
  private readonly RATE_LIMIT_RETRY_DELAY = 5000;

  async chat(options: AIRequestOptions): Promise<AIResponse> {
    const {
      messages,
      model = 'google/gemini-2.5-flash',
      temperature = 0.7,
      maxRetries = this.DEFAULT_MAX_RETRIES,
      retryDelay = this.DEFAULT_RETRY_DELAY,
    } = options;

    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const { data, error } = await supabase.functions.invoke('brain-chat', {
          body: {
            messages,
            model,
            temperature,
          },
        });

        if (error) {
          throw new Error(error.message || 'AI request failed');
        }

        if (!data || !data.response) {
          throw new Error('Invalid response from AI service');
        }

        return { content: data.response };
      } catch (error) {
        lastError = error as Error;
        
        // Check for rate limit errors (429)
        if (error instanceof Error && error.message.includes('429')) {
          console.warn(`Rate limit hit, attempt ${attempt + 1}/${maxRetries + 1}`);
          if (attempt < maxRetries) {
            await this.delay(this.RATE_LIMIT_RETRY_DELAY);
            continue;
          }
          return { 
            content: '', 
            error: 'Rate limit exceeded. Please try again in a few moments.' 
          };
        }

        // Check for payment required errors (402)
        if (error instanceof Error && error.message.includes('402')) {
          return { 
            content: '', 
            error: 'AI usage limit reached. Please add credits to your workspace.' 
          };
        }

        // Retry on network errors
        if (attempt < maxRetries) {
          console.warn(`AI request failed, retrying (${attempt + 1}/${maxRetries})...`);
          await this.delay(retryDelay * Math.pow(2, attempt)); // Exponential backoff
          continue;
        }
      }
    }

    return { 
      content: '', 
      error: lastError?.message || 'Failed to get AI response after multiple attempts' 
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const geminiClient = new GeminiClient();
