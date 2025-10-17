interface FeatureFlags {
  codesplitting: boolean;
  webVitals: boolean;
  optimizedImages: boolean;
  structuredData: boolean;
  geminiRetries: boolean;
  experimentalFeatures: boolean;
}

const DEFAULT_FLAGS: FeatureFlags = {
  codesplitting: true,
  webVitals: true,
  optimizedImages: true,
  structuredData: true,
  geminiRetries: true,
  experimentalFeatures: false,
};

class FeatureFlagManager {
  private flags: FeatureFlags;
  private listeners: Set<(flags: FeatureFlags) => void> = new Set();

  constructor() {
    // Load flags from localStorage or use defaults
    const stored = localStorage.getItem('featureFlags');
    this.flags = stored ? { ...DEFAULT_FLAGS, ...JSON.parse(stored) } : { ...DEFAULT_FLAGS };
  }

  isEnabled(flag: keyof FeatureFlags): boolean {
    return this.flags[flag] ?? false;
  }

  enable(flag: keyof FeatureFlags): void {
    this.flags[flag] = true;
    this.persist();
    this.notify();
  }

  disable(flag: keyof FeatureFlags): void {
    this.flags[flag] = false;
    this.persist();
    this.notify();
  }

  toggle(flag: keyof FeatureFlags): void {
    this.flags[flag] = !this.flags[flag];
    this.persist();
    this.notify();
  }

  getAll(): Readonly<FeatureFlags> {
    return { ...this.flags };
  }

  setAll(flags: Partial<FeatureFlags>): void {
    this.flags = { ...this.flags, ...flags };
    this.persist();
    this.notify();
  }

  reset(): void {
    this.flags = { ...DEFAULT_FLAGS };
    this.persist();
    this.notify();
  }

  subscribe(listener: (flags: FeatureFlags) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private persist(): void {
    localStorage.setItem('featureFlags', JSON.stringify(this.flags));
  }

  private notify(): void {
    this.listeners.forEach((listener) => listener({ ...this.flags }));
  }

  // A/B testing support
  rollout(flag: keyof FeatureFlags, percentage: number): void {
    const userId = this.getUserId();
    const hash = this.hashString(userId + flag);
    const shouldEnable = (hash % 100) < percentage;

    if (shouldEnable) {
      this.enable(flag);
    } else {
      this.disable(flag);
    }
  }

  private getUserId(): string {
    let userId = localStorage.getItem('userId');
    if (!userId) {
      userId = Math.random().toString(36).substring(2, 15);
      localStorage.setItem('userId', userId);
    }
    return userId;
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }
}

export const featureFlags = new FeatureFlagManager();

// React hook for feature flags
export function useFeatureFlag(flag: keyof FeatureFlags): boolean {
  const [isEnabled, setIsEnabled] = React.useState(() => featureFlags.isEnabled(flag));

  React.useEffect(() => {
    const unsubscribe = featureFlags.subscribe((flags) => {
      setIsEnabled(flags[flag]);
    });
    return unsubscribe;
  }, [flag]);

  return isEnabled;
}

// React import
import React from 'react';
