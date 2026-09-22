import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomSheet, PrimaryButton, SecondaryButton, StatusBadge, TextField, ui } from '@/components/actionlayer-ui';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';

export default function ReviewScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { agent, confirmClaim } = useApp();
  const [editing, setEditing] = useState<import('@/context/AppContext').Claim | null>(null);
  const [value, setValue] = useState('');
  const uncertain = agent.claims.filter((claim) => !claim.reviewed || claim.status === 'inferred_needs_review' || claim.status === 'missing');
  return <View style={[styles.root, { backgroundColor: colors.background }]}><ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 12, paddingBottom: 110 }]}><Pressable onPress={() => router.back()} style={styles.back}><Feather name="arrow-left" size={21} color={colors.foreground} /><Text style={[ui.captionStrong, { color: colors.foreground }]}>Back</Text></Pressable><Text style={[ui.eyebrow, { color: colors.primary }]}>EXTRACTION REVIEW</Text><Text style={[styles.title, { color: colors.foreground }]}>Check what ActionLayer found</Text><Text style={[ui.body, { color: colors.mutedForeground, textAlign: 'left' }]}>The source stays attached to every claim. Correct or remove anything before relying on this plan.</Text><View style={[styles.sourcePreview, { backgroundColor: colors.secondary }]}><Feather name="image" size={20} color={colors.primary} /><View style={styles.sourceCopy}><Text style={[ui.captionStrong, { color: colors.foreground }]}>{agent.sourceLabel}</Text><Text style={[ui.caption, { color: colors.mutedForeground }]}>Original preserved · page 1</Text></View><StatusBadge label="Source" tone="info" /></View>{uncertain.length > 0 && <View style={[styles.warning, { backgroundColor: '#F7ECD8' }]}><Feather name="alert-triangle" size={18} color={colors.warning} /><Text style={[ui.caption, { color: colors.foreground, flex: 1 }]}>{uncertain.length} item{uncertain.length === 1 ? '' : 's'} need your review before they become trusted facts.</Text></View>}<Text style={[styles.sectionTitle, { color: colors.foreground }]}>Grounded fields</Text>{agent.claims.map((claim) => <View key={claim.id} style={[styles.claim, { backgroundColor: colors.card, borderColor: colors.border }]}><View style={styles.claimTop}><Text style={[styles.claimField, { color: colors.foreground }]}>{claim.field}</Text><StatusBadge label={claim.reviewed ? `${Math.round(claim.confidence * 100)}% grounded` : claim.status === 'missing' ? 'Missing' : 'Review'} tone={claim.reviewed ? 'success' : 'warning'} /></View><Text style={[styles.claimValue, { color: colors.foreground }]}>{claim.value}</Text><Text style={[ui.caption, { color: colors.mutedForeground }]}>&quot;{claim.sourceExcerpt}&quot;</Text><View style={styles.claimActions}><Pressable onPress={() => { setEditing(claim); setValue(claim.value); }}><Text style={[ui.captionStrong, { color: colors.primary }]}>Edit</Text></Pressable>{!claim.reviewed && <Pressable onPress={() => confirmClaim(claim.id)}><Text style={[ui.captionStrong, { color: colors.primary }]}>Confirm as written</Text></Pressable>}<Pressable onPress={() => Alert.alert('Source location', `This claim is grounded in ${agent.sourceLabel}, page ${claim.sourcePage ?? 1}.`)}><Text style={[ui.captionStrong, { color: colors.primary }]}>View source</Text></Pressable></View></View>)}<PrimaryButton label="Confirm review and continue" icon="check" onPress={() => { Alert.alert('Review saved', 'Your corrections are now the source of truth for this demo workflow.'); router.replace(`/agent/${agent.id}`); }} /></ScrollView><BottomSheet visible={Boolean(editing)} title={`Edit ${editing?.field ?? 'claim'}`} onClose={() => setEditing(null)}><TextField label="Your correction" value={value} onChangeText={setValue} multiline /><PrimaryButton label="Save correction" icon="check" disabled={value.trim().length < 2} onPress={() => { if (editing) confirmClaim(editing.id, value); setEditing(null); }} /><SecondaryButton label="Cancel" onPress={() => setEditing(null)} /></BottomSheet></View>;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 16 },
  back: { flexDirection: 'row', gap: 8, alignItems: 'center', minHeight: 42 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 29, lineHeight: 35, letterSpacing: -0.6 },
  sourcePreview: { borderRadius: 14, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 10 },
  sourceCopy: { flex: 1, gap: 3 },
  warning: { borderRadius: 12, padding: 12, flexDirection: 'row', gap: 9, alignItems: 'flex-start' },
  sectionTitle: { fontFamily: 'Inter_700Bold', fontSize: 18, marginTop: 4 },
  claim: { borderWidth: 1, borderRadius: 15, padding: 14, gap: 9 },
  claimTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, alignItems: 'center' },
  claimField: { fontFamily: 'Inter_600SemiBold', fontSize: 13, flex: 1 },
  claimValue: { fontFamily: 'Inter_700Bold', fontSize: 17, lineHeight: 23 },
  claimActions: { flexDirection: 'row', gap: 17, borderTopWidth: 1, borderTopColor: '#DDD9D1', paddingTop: 10 },
});