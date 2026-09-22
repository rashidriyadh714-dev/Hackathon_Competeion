import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PrimaryButton, SecondaryButton, TextField, ui } from '@/components/actionlayer-ui';
import { useColors } from '@/hooks/useColors';

export default function AuthScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [mode, setMode] = useState<'register' | 'login'>('register');
  return <View style={[styles.root, { backgroundColor: colors.background }]}><ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 42 }]}><View style={[styles.mark, { backgroundColor: colors.primary }]}><Feather name="layers" size={26} color="#FFFFFF" /></View><Text style={[styles.brand, { color: colors.foreground }]}>ActionLayer</Text><Text style={[styles.title, { color: colors.foreground }]}>{mode === 'register' ? 'Turn information into action.' : 'Welcome back.'}</Text><Text style={[ui.body, { color: colors.mutedForeground }]}>A calm place to keep requirements, deadlines, evidence, and the next step together.</Text><View style={styles.form}><TextField label="Email address" value={email} onChangeText={setEmail} placeholder="you@example.edu" /><PrimaryButton label={mode === 'register' ? 'Create demo account' : 'Continue'} icon="arrow-right" disabled={!email.includes('@')} onPress={() => router.replace('/(tabs)')} /><Text style={[ui.caption, { color: colors.mutedForeground, textAlign: 'center' }]}>Demo mode uses fictional data. No account is created in this preview.</Text></View><Pressable onPress={() => setMode(mode === 'register' ? 'login' : 'register')}><Text style={[ui.captionStrong, { color: colors.primary, textAlign: 'center' }]}>{mode === 'register' ? 'Already have an account? Sign in' : 'New here? Create an account'}</Text></Pressable><SecondaryButton label="Continue with fictional demo" icon="compass" onPress={() => router.replace('/(tabs)')} /></ScrollView></View>;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 24, gap: 16, flexGrow: 1, justifyContent: 'center' },
  mark: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 6 },
  brand: { fontFamily: 'Inter_700Bold', fontSize: 14, letterSpacing: 2, textAlign: 'center' },
  title: { fontFamily: 'Inter_700Bold', fontSize: 31, lineHeight: 37, letterSpacing: -0.8, textAlign: 'center', marginTop: 16 },
  form: { gap: 15, marginTop: 15 },
});