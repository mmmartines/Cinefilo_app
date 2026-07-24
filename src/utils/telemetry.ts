import PostHog from 'posthog-react-native';
import { Platform } from 'react-native';

const POSTHOG_API_KEY = process.env.EXPO_PUBLIC_POSTHOG_API_KEY || 'phc_fake_api_key_for_demonstration_only';
const POSTHOG_HOST = 'https://app.posthog.com';

export const initTelemetry = () => {
  // Inicialização de telemetria base (Sem Sentry para não quebrar builds locais)
};

export const posthogConfig = {
  apiKey: POSTHOG_API_KEY,
  options: {
    host: POSTHOG_HOST,
    enableSessionRecording: true,
  }
};
