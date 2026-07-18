export default ({ config }) => {
  return {
    ...config,
    plugins: [
      ...(config.plugins || []),
      "@sentry/react-native"
    ],
    android: {
      googleServicesFile: "./google-services.json",
      ...config.android,
      config: {
        ...config.android?.config,
        googleMaps: {
          apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "YOUR_GOOGLE_MAPS_API_KEY"
        }
      }
    }
  };
};
