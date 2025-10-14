// Advanced rate limiting with exponential backoff and queue management

interface QueuedRequest {
  execute: () => Promise<any>;
  resolve: (value: any) => void;
  reject: (error: any) => void;
  retries: number;
}

class GoogleBooksRateLimiter {
  private requests: number[] = [];
  private queue: QueuedRequest[] = [];
  private processing = false;
  
  // Configuration
  private readonly maxRequests = 10;
  private readonly timeWindow = 10000; // 10 seconds
  private readonly maxRetries = 3;
  private readonly baseDelay = 1000; // 1 second
  
  canMakeRequest(): boolean {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.timeWindow);
    return this.requests.length < this.maxRequests;
  }
  
  recordRequest(): void {
    this.requests.push(Date.now());
  }
  
  async enqueue<T>(requestFn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({
        execute: requestFn,
        resolve,
        reject,
        retries: 0
      });
      
      if (!this.processing) {
        this.processQueue();
      }
    });
  }
  
  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    
    while (this.queue.length > 0) {
      const request = this.queue[0];
      
      if (this.canMakeRequest()) {
        this.queue.shift();
        this.recordRequest();
        
        try {
          const result = await request.execute();
          request.resolve(result);
        } catch (error) {
          // Check if it's a rate limit error
          if (this.isRateLimitError(error) && request.retries < this.maxRetries) {
            // Exponential backoff
            const delay = this.baseDelay * Math.pow(2, request.retries);
            console.log(`Rate limited. Retrying in ${delay}ms (attempt ${request.retries + 1}/${this.maxRetries})`);
            
            await this.delay(delay);
            request.retries++;
            this.queue.unshift(request); // Put back at front
          } else {
            request.reject(error);
          }
        }
      } else {
        // Wait before checking again
        await this.delay(100);
      }
    }
    
    this.processing = false;
  }
  
  private isRateLimitError(error: any): boolean {
    return error?.message?.includes('429') || 
           error?.message?.includes('rate limit') ||
           error?.status === 429;
  }
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  clearQueue(): void {
    this.queue.forEach(req => req.reject(new Error('Queue cleared')));
    this.queue = [];
  }
  
  getQueueSize(): number {
    return this.queue.length;
  }
}

export const googleBooksRateLimiter = new GoogleBooksRateLimiter();
