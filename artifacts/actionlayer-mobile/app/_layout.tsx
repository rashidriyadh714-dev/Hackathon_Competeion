import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { Stack, ThemeProvider, DefaultTheme } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { AppProvider, useApp } from '@/context/AppContext';
import { BlurView } from 'expo-blur';
import { ClerkProvider } from '@clerk/expo';
import { tokenCache } from '@clerk/expo/token-cache';
import { Platform, StyleSheet, View, Image, useWindowDimensions } from 'react-native';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

import Purchases from 'react-native-purchases';

const queryClient = new QueryClient();

// removed duplicate import

const TransparentTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: 'transparent',
  },
};

function RootLayoutNav() {
  return (
    <ThemeProvider value={TransparentTheme}>
      <Stack screenOptions={{ headerBackTitle: 'Back', contentStyle: { backgroundColor: 'transparent' } }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="agent/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="review/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="auth" options={{ headerShown: false, presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}

function AppBackgroundWrapper({ children }: { children: React.ReactNode }) {
  const { customBg, theme, bgDim } = useApp();
  const bgSource = customBg ? { uri: customBg } : require('../assets/apple_glass_bg.jpg');
  const isDark = theme === 'dark';

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? '#000' : '#FFF' }}>
      <Image 
        source={bgSource} 
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' }} 
        resizeMode="cover"
      />
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#000', opacity: bgDim }} pointerEvents="none" />
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: 'transparent' }}>
        {children}
      </GestureHandlerRootView>
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  const { width } = useWindowDimensions();
  const isMobileWeb = Platform.OS === 'web' && width <= 768;

  useEffect(() => {
    // Initialize RevenueCat SDK for the Shipaton Hackathon!
    if (Platform.OS === 'ios') {
      Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);
      Purchases.configure({ apiKey: process.env.EXPO_PUBLIC_RC_APPLE_KEY || "appl_placeholder_key" });
    } else if (Platform.OS === 'android') {
      Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);
      Purchases.configure({ apiKey: process.env.EXPO_PUBLIC_RC_GOOGLE_KEY || "goog_placeholder_key" });
    }

    if (Platform.OS === 'web') {
      const style = document.createElement('style');
      style.textContent = `
        html, body, #root {
          background-color: #000000 !important;
          height: 100%;
          height: 100dvh;
          margin: 0;
          padding: 0;
          overflow: hidden;
        }
        div[style*="background-color: rgb(242, 242, 242)"] {
          background-color: transparent !important;
        }
        div[aria-hidden="true"] {
          display: none !important;
          opacity: 0 !important;
          visibility: hidden !important;
        }
        * {
          -webkit-tap-highlight-color: transparent !important;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        [role="button"], [tabindex="0"], a {
          cursor: pointer !important;
        }
        ::-webkit-scrollbar {
          width: 5px;
          height: 5px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 999px;
        }
      `;
      document.head.appendChild(style);

      // Inject PWA meta tags from the guide
      let metaViewport = document.querySelector('meta[name="viewport"]');
      if (!metaViewport) {
        metaViewport = document.createElement('meta');
        metaViewport.setAttribute('name', 'viewport');
        document.head.appendChild(metaViewport);
      }
      metaViewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover');

      let metaCapable = document.querySelector('meta[name="apple-mobile-web-app-capable"]');
      if (!metaCapable) {
        metaCapable = document.createElement('meta');
        metaCapable.setAttribute('name', 'apple-mobile-web-app-capable');
        document.head.appendChild(metaCapable);
      }
      metaCapable.setAttribute('content', 'yes');

      let metaStatus = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
      if (!metaStatus) {
        metaStatus = document.createElement('meta');
        metaStatus.setAttribute('name', 'apple-mobile-web-app-status-bar-style');
        document.head.appendChild(metaStatus);
      }
      metaStatus.setAttribute('content', 'black-translucent');
    }
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  const app = (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <AppProvider>
            <AppBackgroundWrapper>
              <KeyboardProvider>
                {process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ? (
                  <ClerkProvider publishableKey={process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY} tokenCache={tokenCache}>
                    <RootLayoutNav />
                  </ClerkProvider>
                ) : <RootLayoutNav />}
              </KeyboardProvider>
            </AppBackgroundWrapper>
          </AppProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );

  if (Platform.OS === 'web' && !isMobileWeb) {
    return (
      <View style={styles.webBackdrop}>
        <View style={styles.phoneContainer}>
          {app}
        </View>
      </View>
    );
  }

  return app;
}

const styles = StyleSheet.create({
  webBackdrop: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#05070A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneContainer: {
    flex: 1,
    width: '100%',
    maxWidth: 450,
    height: '100%',
    backgroundColor: '#000000',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    boxShadow: '0 25px 60px rgba(0, 0, 0, 0.75)',
    overflow: 'hidden',
  } as any,
});
