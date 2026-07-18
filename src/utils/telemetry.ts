import * as Sentry from '@sentry/react-native';
import PostHog from 'posthog-react-native';
import { Platform } from 'react-native';

// Fake DSN for demonstration purposes
const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN || 'https://fake@sentry.io/12345';
const POSTHOG_API_KEY = process.env.EXPO_PUBLIC_POSTHOG_API_KEY || 'phc_fake_api_key_for_demonstration_only';
const POSTHOG_HOST = 'https://app.posthog.com';

export const initTelemetry = () => {
  // Sentry
  Sentry.init({
    dsn: SENTRY_DSN,
    debug: __DEV__, // If __DEV__, print to console
    tracesSampleRate: 1.0,
    _experiments: {
      profilesSampleRate: 1.0,
    },
  });
};

export const posthogConfig = {
  apiKey: POSTHOG_API_KEY,
  options: {
    host: POSTHOG_HOST,
    enableSessionRecording: true,
  }
};
