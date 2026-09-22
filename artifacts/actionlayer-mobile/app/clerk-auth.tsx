import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSignIn, useSignUp } from '@clerk/expo';
import { Feather } from '@expo/vector-icons';
import { PrimaryButton, SecondaryButton, TextField, ui } from '@/components/actionlayer-ui';
import { useColors } from '@/hooks/useColors';

export default function ClerkAuthScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { signIn, errors: signInErrors, fetchStatus: signInStatus } = useSignIn();
  const { signUp, errors: signUpErrors, fetchStatus: signUpStatus } = useSignUp();
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [verificationStarted, setVerificationStarted] = useState(false);

  const busy = signInStatus === 'fetching' || signUpStatus === 'fetching';
  const errorMessage = mode === 'signIn'
    ? signInErrors?.fields?.identifier?.message ?? signInErrors?.fields?.password?.message
    : signUpErrors?.fields?.emailAddress?.message ?? signUpErrors?.fields?.password?.message;

  const submit = async () => {
    if (!email.includes('@') || password.length < 8) return;
    if (mode === 'signIn') {
      const result = await signIn.password({ emailAddress: email.trim(), password });
      if (result.error) Alert.alert('Sign in failed', result.error.message);
      else if (signIn.status === 'complete') await signIn.finalize();
      else if (signIn.status === 'needs_client_trust') await signIn.mfa.sendEmailCode();
    } else {
      const result = await signUp.password({ emailAddress: email.trim(), password });
      if (result.error) Alert.alert('Account creation failed', result.error.message);
      else {
        await signUp.verifications.sendEmailCode();
        setVerificationStarted(true);
      }
    }
  };

  const verify = async () => {
    const result = await signUp.verifications.verifyEmailCode({ code });
    if (result.error) Alert.alert('Verification failed', result.error.message);
    else if (signUp.status === 'complete') await signUp.finalize();
  };

  return <View style={[styles.root, { backgroundColor: colors.background }]}><ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 42 }]}><View style={[styles.mark, { backgroundColor: colors.primary }]}><Feather name="layers" size={26} color="#FFFFFF" /></View><Text style={[styles.brand, { color: colors.foreground }]}>ActionLayer</Text><Text style={[styles.title, { color: colors.foreground }]}>{verificationStarted ? 'Check your email.' : mode === 'signIn' ? 'Welcome back.' : 'Turn information into action.'}</Text><Text style={[ui.body, { color: colors.mutedForeground }]}>A calm place to keep requirements, deadlines, evidence, and the next step together.</Text>{verificationStarted ? <View style={styles.form}><TextField label="Verification code" value={code} onChangeText={setCode} placeholder="123456" /><PrimaryButton label="Verify email" icon="check" disabled={code.trim().length < 4 || busy} onPress={verify} /><SecondaryButton label="Send a new code" icon="refresh-cw" onPress={() => signUp.verifications.sendEmailCode()} /></View> : <View style={styles.form}><TextField label="Email address" value={email} onChangeText={setEmail} placeholder="you@example.edu" /><TextField label="Password" value={password} onChangeText={setPassword} placeholder="At least 8 characters" /><PrimaryButton label={mode === 'signIn' ? 'Sign in' : 'Create account'} icon="arrow-right" disabled={!email.includes('@') || password.length < 8 || busy} onPress={submit} />{errorMessage && <Text style={[ui.caption, { color: colors.risk }]}>{errorMessage}</Text>}</View>}<Pressable onPress={() => { setMode(mode === 'signIn' ? 'signUp' : 'signIn'); setVerificationStarted(false); }}><Text style={[ui.captionStrong, { color: colors.primary, textAlign: 'center' }]}>{mode === 'signIn' ? 'New here? Create an account' : 'Already have an account? Sign in'}</Text></Pressable></ScrollView></View>;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 24, gap: 16, flexGrow: 1, justifyContent: 'center' },
  mark: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 6 },
  brand: { fontFamily: 'Inter_700Bold', fontSize: 14, letterSpacing: 2, textAlign: 'center' },
  title: { fontFamily: 'Inter_700Bold', fontSize: 31, lineHeight: 37, letterSpacing: -0.8, textAlign: 'center', marginTop: 16 },
  form: { gap: 15, marginTop: 15 },
});