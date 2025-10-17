interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp: number;
}

interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
}

class Analytics {
  private queue: AnalyticsEvent[] = [];
  private metricsQueue: PerformanceMetric[] = [];
  private flushInterval: number = 5000; // 5 seconds
  private maxQueueSize: number = 50;

  constructor() {
    if (typeof window !== 'undefined') {
      this.startFlushTimer();
      
      // Flush on page unload
      window.addEventListener('beforeunload', () => this.flush());
      
      // Flush when page becomes hidden
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          this.flush();
        }
      });
    }
  }

  track(eventName: string, properties?: Record<string, any>): void {
    const event: AnalyticsEvent = {
      name: eventName,
      properties,
      timestamp: Date.now(),
    };

    this.queue.push(event);

    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics]', eventName, properties);
    }

    if (this.queue.length >= this.maxQueueSize) {
      this.flush();
    }
  }

  trackPerformance(name: string, value: number, rating: 'good' | 'needs-improvement' | 'poor'): void {
    const metric: PerformanceMetric = {
      name,
      value,
      rating,
      timestamp: Date.now(),
    };

    this.metricsQueue.push(metric);

    if (this.metricsQueue.length >= this.maxQueueSize) {
      this.flushMetrics();
    }
  }

  page(pageName: string, properties?: Record<string, any>): void {
    this.track('page_view', {
      page: pageName,
      ...properties,
    });
  }

  identify(userId: string, traits?: Record<string, any>): void {
    this.track('identify', {
      userId,
      ...traits,
    });
  }

  private startFlushTimer(): void {
    setInterval(() => {
      this.flush();
      this.flushMetrics();
    }, this.flushInterval);
  }

  private flush(): void {
    if (this.queue.length === 0) return;

    const events = [...this.queue];
    this.queue = [];

    // Send to analytics endpoint
    this.sendEvents(events);
  }

  private flushMetrics(): void {
    if (this.metricsQueue.length === 0) return;

    const metrics = [...this.metricsQueue];
    this.metricsQueue = [];

    // Send to metrics endpoint
    this.sendMetrics(metrics);
  }

  private sendEvents(events: AnalyticsEvent[]): void {
    if (typeof navigator.sendBeacon !== 'undefined') {
      const blob = new Blob([JSON.stringify(events)], { type: 'application/json' });
      navigator.sendBeacon('/api/analytics/events', blob);
    } else {
      // Fallback for browsers without sendBeacon
      fetch('/api/analytics/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(events),
        keepalive: true,
      }).catch((error) => {
        console.error('Failed to send analytics events:', error);
      });
    }
  }

  private sendMetrics(metrics: PerformanceMetric[]): void {
    if (typeof navigator.sendBeacon !== 'undefined') {
      const blob = new Blob([JSON.stringify(metrics)], { type: 'application/json' });
      navigator.sendBeacon('/api/analytics/metrics', blob);
    } else {
      fetch('/api/analytics/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metrics),
        keepalive: true,
      }).catch((error) => {
        console.error('Failed to send performance metrics:', error);
      });
    }
  }
}

export const analytics = new Analytics();
