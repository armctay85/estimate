import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';

export function initSentry() {
  if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      integrations: [new BrowserTracing()],
      tracesSampleRate: 0.1,
      environment: import.meta.env.VITE_SENTRY_ENV || 'production',
      beforeSend(event) {
        // Don't send user passwords
        if (event.exception) {
          event.exception.values?.forEach((exception) => {
            if (exception.stacktrace) {
              exception.stacktrace.frames?.forEach((frame) => {
                if (frame.vars) {
                  delete frame.vars.password;
                  delete frame.vars.token;
                }
              });
            }
          });
        }
        return event;
      },
    });
  }
}

export function captureError(error: Error, context?: Record<string, any>) {
  if (import.meta.env.PROD) {
    Sentry.captureException(error, { extra: context });
  } else {
    console.error('Error captured:', error, context);
  }
}

export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info') {
  if (import.meta.env.PROD) {
    Sentry.captureMessage(message, level);
  } else {
    console.log(`[${level}] ${message}`);
  }
}
