// appInsights.ts — client-side error/telemetry monitoring. The API already
// reports server-side exceptions to Azure Application Insights (api/host.json);
// this is the missing other half — without it, a JS crash or unhandled
// rejection in a visitor's browser leaves no trace anywhere. Reuses the same
// Application Insights resource, so backend and frontend telemetry land in one
// place. Connection string is safe to expose client-side (same trust model as
// a GA measurement ID) — never a secret like an API key. No-ops entirely when
// unconfigured, matching how every other optional integration in this app
// degrades silently.
//
// The SDK is lazy-imported (like the Speech SDK in speechService.ts) so it
// doesn't add ~75KB gzipped to the initial bundle — it loads in parallel with
// the app shell instead of blocking it. This means there's a brief window
// right at boot where an error wouldn't be caught; an acceptable trade-off for
// keeping first paint fast, same call this app already makes elsewhere.
import type { ApplicationInsights } from '@microsoft/applicationinsights-web';

let appInsights: ApplicationInsights | null = null;

export function initAppInsights(): void {
  const connectionString = import.meta.env.VITE_APPINSIGHTS_CONNECTION_STRING;
  if (!connectionString) return;

  void import('@microsoft/applicationinsights-web').then(({ ApplicationInsights: AI }) => {
    appInsights = new AI({
      config: {
        connectionString,
        enableAutoRouteTracking: true, // React Router navigation counted as pageviews
        enableCorsCorrelation: true,
        enableRequestHeaderTracking: true,
        enableResponseHeaderTracking: true,
        autoTrackPageVisitTime: true,
        // disableExceptionTracking defaults to false — auto-hooks window.onerror,
        // catching the "any console errors and things like that" case this was
        // added for. enableUnhandledPromiseRejectionTracking is a separate flag,
        // off by default — without it, a rejected promise nobody .catch()es
        // (a common source of silent failures in async code) goes unreported.
        enableUnhandledPromiseRejectionTracking: true,
      },
    });
    appInsights.loadAppInsights();
    appInsights.trackPageView();
  });
}

/** Reports a caught error (e.g. from ErrorBoundary) with extra context. No-op if unconfigured. */
export function trackException(error: Error, properties?: Record<string, string>): void {
  appInsights?.trackException({ exception: error, properties });
}
