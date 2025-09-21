import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface AnalyticsEvent {
  event_type: string;
  event_data?: Record<string, any>;
  user_id?: string;
  session_id?: string;
  page_url?: string;
  user_agent?: string;
  timestamp?: string;
}

export const useAnalytics = () => {
  const { user } = useAuth();

  const trackEvent = useCallback(async (
    eventType: string,
    eventData?: Record<string, any>,
    additionalMetadata?: Partial<AnalyticsEvent>
  ) => {
    try {
      const analyticsEvent: AnalyticsEvent = {
        event_type: eventType,
        event_data: eventData,
        user_id: user?.id,
        page_url: window.location.href,
        user_agent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        ...additionalMetadata
      };

      // Store in book_interactions table for book-related events
      if (eventType.includes('book_') || eventType.includes('reading_')) {
        await supabase.functions.invoke('log-book-interaction', {
          body: analyticsEvent
        });
      } else {
        // For other events, you could create a general analytics table
        console.log('Analytics event:', analyticsEvent);
      }
    } catch (error) {
      console.error('Error tracking analytics event:', error);
    }
  }, [user]);

  const trackPageView = useCallback(async (pageName: string, additionalData?: Record<string, any>) => {
    await trackEvent('page_view', {
      page_name: pageName,
      ...additionalData
    });
  }, [trackEvent]);

  const trackBookInteraction = useCallback(async (
    interactionType: 'view' | 'search' | 'add_to_collection' | 'start_reading' | 'finish_reading',
    bookTitle: string,
    bookAuthor: string,
    additionalData?: Record<string, any>
  ) => {
    await trackEvent(`book_${interactionType}`, {
      book_title: bookTitle,
      book_author: bookAuthor,
      ...additionalData
    });
  }, [trackEvent]);

  const trackUserAction = useCallback(async (
    action: string,
    additionalData?: Record<string, any>
  ) => {
    await trackEvent(`user_${action}`, additionalData);
  }, [trackEvent]);

  const trackPerformanceMetric = useCallback(async (
    metricType: string,
    metricValue: number,
    context?: string
  ) => {
    try {
      await supabase.rpc('log_performance_metric', {
        p_metric_type: metricType,
        p_metric_value: metricValue,
        p_context: context,
        p_user_agent: navigator.userAgent,
        p_device_type: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop'
      });
    } catch (error) {
      console.error('Error tracking performance metric:', error);
    }
  }, []);

  // Track page load performance
  const trackPageLoadTime = useCallback(() => {
    if (typeof window !== 'undefined' && window.performance) {
      const navigation = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        const loadTime = navigation.loadEventEnd - navigation.fetchStart;
        trackPerformanceMetric('page_load_time', loadTime, window.location.pathname);
      }
    }
  }, [trackPerformanceMetric]);

  // Track core web vitals
  const trackWebVitals = useCallback(() => {
    if (typeof window !== 'undefined' && 'web-vitals' in window) {
      // This would require the web-vitals library
      // For now, we'll track basic performance metrics
      if (window.performance && window.performance.timing) {
        const timing = window.performance.timing;
        const ttfb = timing.responseStart - timing.fetchStart;
        const domContentLoaded = timing.domContentLoadedEventEnd - timing.fetchStart;
        
        trackPerformanceMetric('ttfb', ttfb, window.location.pathname);
        trackPerformanceMetric('dom_content_loaded', domContentLoaded, window.location.pathname);
      }
    }
  }, [trackPerformanceMetric]);

  return {
    trackEvent,
    trackPageView,
    trackBookInteraction,
    trackUserAction,
    trackPerformanceMetric,
    trackPageLoadTime,
    trackWebVitals
  };
};