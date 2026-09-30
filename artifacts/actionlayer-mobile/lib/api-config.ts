import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Dynamically resolves the API server base URL depending on runtime environment:
 * 1. EXPO_PUBLIC_API_URL if explicitly provided (e.g. public tunnel / production URL).
 * 2. In web browsers:
 *    - If on direct Metro port 8081: routes to port 5001 on the same host (localhost or LAN IP).
 *    - If on unified gateway (port 8080) or public tunnel (trycloudflare.com / ngrok): uses window.location.origin so all /api requests route through the gateway.
 * 3. In native Expo Go (iOS/Android): Automatically derives the host computer IP from debugger host.
 * 4. Fallback: http://localhost:5001.
 */
export function getApiBaseUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL && process.env.EXPO_PUBLIC_API_URL.trim().length > 0) {
    return process.env.EXPO_PUBLIC_API_URL.trim().replace(/\/+$/, '');
  }

  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location) {
    const { hostname, port, origin } = window.location;

    // Direct Metro dev server on port 8081
    if (port === '8081') {
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'http://localhost:5001';
      }
      if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
        return `http://${hostname}:5001`;
      }
    }

    // Unified gateway (port 8080), public tunnel (trycloudflare.com, ngrok), or custom domain
    return origin;
  }

  // Native Expo Go on physical device (iOS / Android)
  const hostUri = Constants.expoConfig?.hostUri || (Constants as any)?.manifest?.debuggerHost;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
      return `http://${ip}:5001`;
    }
  }

  return 'http://localhost:5001';
}
