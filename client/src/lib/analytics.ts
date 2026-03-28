/**
 * Analytics Tracking Module
 * Track user behavior, feature usage, and conversion events
 */

// Event types
type EventType = 
  | 'page_view'
  | 'estimate_created'
  | 'pdf_uploaded'
  | 'quote_validated'
  | 'tender_analyzed'
  | 'upgrade_clicked'
  | 'subscription_started'
  | 'feature_used';

interface AnalyticsEvent {
  type: EventType;
  userId?: string;
  timestamp: string;
  properties: Record<string, any>;
  sessionId: string;
}

class Analytics {
  private sessionId: string;
  private userId?: string;
  private endpoint: string;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.endpoint = import.meta.env.VITE_ANALYTICS_ENDPOINT || '/api/analytics';
    this.loadUserId();
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  private loadUserId(): void {
    // Load from localStorage or auth context
    this.userId = localStorage.getItem('userId') || undefined;
  }

  setUserId(userId: string): void {
    this.userId = userId;
    localStorage.setItem('userId', userId);
  }

  track(eventType: EventType, properties: Record<string, any> = {}): void {
    const event: AnalyticsEvent = {
      type: eventType,
      userId: this.userId,
      timestamp: new Date().toISOString(),
      properties,
      sessionId: this.sessionId,
    };

    // Send to backend
    this.send(event);

    // Also log to console in development
    if (import.meta.env.DEV) {
      console.log('[Analytics]', event);
    }
  }

  private async send(event: AnalyticsEvent): Promise<void> {
    try {
      await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
        keepalive: true,
      });
    } catch (err) {
      // Silently fail - don't break user experience
      console.error('Analytics error:', err);
    }
  }

  // Convenience methods
  pageView(page: string, properties?: Record<string, any>): void {
    this.track('page_view', { page, ...properties });
  }

  estimateCreated(estimateId: string, totalCost: number): void {
    this.track('estimate_created', { estimateId, totalCost });
  }

  pdfUploaded(fileSize: number, pageCount: number): void {
    this.track('pdf_uploaded', { fileSize, pageCount });
  }

  quoteValidated(quoteId: string, trustScore: number): void {
    this.track('quote_validated', { quoteId, trustScore });
  }

  tenderAnalyzed(tenderId: string, variance: number): void {
    this.track('tender_analyzed', { tenderId, variance });
  }

  upgradeClicked(plan: string): void {
    this.track('upgrade_clicked', { plan });
  }

  subscriptionStarted(plan: string, amount: number): void {
    this.track('subscription_started', { plan, amount });
  }

  featureUsed(feature: string, duration?: number): void {
    this.track('feature_used', { feature, duration });
  }
}

// Singleton instance
export const analytics = new Analytics();

// React hook
export function useAnalytics() {
  return analytics;
}
