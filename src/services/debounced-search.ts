
interface DebouncedSearchOptions {
  delay?: number;
  maxCalls?: number;
  timeWindow?: number;
}

class DebouncedSearch {
  private timeouts = new Map<string, NodeJS.Timeout>();
  private callCounts = new Map<string, { count: number; resetTime: number }>();
  private options: Required<DebouncedSearchOptions>;

  constructor(options: DebouncedSearchOptions = {}) {
    this.options = {
      delay: 300,
      maxCalls: 10,
      timeWindow: 60000, // 1 minute
      ...options
    };
  }

  async search<T>(
    key: string,
    searchFn: () => Promise<T>,
    callback: (results: T) => void
  ): Promise<void> {
    // Clear existing timeout
    const existingTimeout = this.timeouts.get(key);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Check rate limiting
    if (!this.canMakeCall(key)) {
      console.warn(`Rate limit exceeded for search key: ${key}`);
      return;
    }

    // Set new timeout
    const timeout = setTimeout(async () => {
      try {
        this.incrementCallCount(key);
        const results = await searchFn();
        callback(results);
      } catch (error) {
        console.error('Debounced search failed:', error);
        callback([] as unknown as T);
      } finally {
        this.timeouts.delete(key);
      }
    }, this.options.delay);

    this.timeouts.set(key, timeout);
  }

  private canMakeCall(key: string): boolean {
    const now = Date.now();
    const callData = this.callCounts.get(key);

    if (!callData || now > callData.resetTime) {
      return true;
    }

    return callData.count < this.options.maxCalls;
  }

  private incrementCallCount(key: string): void {
    const now = Date.now();
    const callData = this.callCounts.get(key);

    if (!callData || now > callData.resetTime) {
      this.callCounts.set(key, {
        count: 1,
        resetTime: now + this.options.timeWindow
      });
    } else {
      callData.count++;
    }
  }

  cancel(key: string): void {
    const timeout = this.timeouts.get(key);
    if (timeout) {
      clearTimeout(timeout);
      this.timeouts.delete(key);
    }
  }

  cancelAll(): void {
    this.timeouts.forEach(timeout => clearTimeout(timeout));
    this.timeouts.clear();
  }

  getCallCount(key: string): number {
    const callData = this.callCounts.get(key);
    if (!callData || Date.now() > callData.resetTime) {
      return 0;
    }
    return callData.count;
  }
}

export const searchDebouncer = new DebouncedSearch();
