import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getProgress, useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import { EmptyState, SectionHeader, StatusBadge, ui } from '@/components/actionlayer-ui';

export default function AgentsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { agent } = useApp();
  const [filter, setFilter] = useState<'Active' | 'Upcoming' | 'At risk' | 'Completed'>('Active');
  const progress = getProgress(agent);
  return <View style={[styles.root, { backgroundColor: colors.background }]}><ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 18, paddingBottom: 110 }]}><View><Text style={[ui.eyebrow, { color: colors.primary }]}>WORKFLOWS</Text><Text style={[styles.title, { color: colors.foreground }]}>Your agents</Text><Text style={[ui.body, { color: colors.mutedForeground, textAlign: 'left' }]}>Persistent plans that keep requirements, evidence, and deadlines together.</Text></View><View style={styles.filters}>{(['Active', 'Upcoming', 'At risk', 'Completed'] as const).map((item) => <Pressable key={item} onPress={() => setFilter(item)} style={[styles.filter, { backgroundColor: filter === item ? colors.primary : colors.card, borderColor: filter === item ? colors.primary : colors.border }]}><Text style={[ui.captionStrong, { color: filter === item ? colors.primaryForeground : colors.mutedForeground }]}>{item}</Text></Pressable>)}</View>{filter !== 'Completed' ? <Pressable accessibilityRole="button" onPress={() => router.push(`/agent/${agent.id}`)} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}><View style={styles.cardTop}><View style={[styles.icon, { backgroundColor: colors.secondary }]}><Feather name="award" size={20} color={colors.primary} /></View><StatusBadge label={filter === 'At risk' ? 'At risk' : 'Active'} tone={filter === 'At risk' ? 'warning' : 'success'} /></View><Text style={[styles.cardTitle, { color: colors.foreground }]}>{agent.title}</Text><Text style={[ui.caption, { color: colors.mutedForeground }]}>{agent.organizer} · Competition Agent</Text><View style={styles.cardBottom}><Text style={[ui.captionStrong, { color: colors.foreground }]}>{progress}% complete</Text><Text style={[ui.caption, { color: colors.mutedForeground }]}>Due 18 Oct 2026</Text><Feather name="chevron-right" color={colors.mutedForeground} size={18} /></View></Pressable> : <EmptyState title="No completed agents yet" detail="Keep working through your active plans and they will appear here." icon="check-circle" />}<SectionHeader title="How agents work" /><View style={styles.stepsWrap}>{[['01', 'Capture', 'Preserve the source before anything is extracted.'], ['02', 'Review', 'Confirm claims and mark uncertain details.'], ['03', 'Act', 'Follow dependencies and attach evidence.']].map(([number, title, detail]) => <View key={number} style={styles.step}><Text style={[styles.stepNumber, { color: colors.primary }]}>{number}</Text><View style={styles.stepCopy}><Text style={[styles.stepTitle, { color: colors.foreground }]}>{title}</Text><Text style={[ui.caption, { color: colors.mutedForeground }]}>{detail}</Text></View></View>)}</View></ScrollView></View>;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 20 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 29, letterSpacing: -0.6, marginTop: 5 },
  filters: { flexDirection: 'row', gap: 7 },
  filter: { borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 },
  card: { borderWidth: 1, borderRadius: 18, padding: 16, gap: 10 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  icon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontFamily: 'Inter_700Bold', fontSize: 21, letterSpacing: -0.3 },
  cardBottom: { borderTopWidth: 1, borderTopColor: '#DDD9D1', paddingTop: 13, flexDirection: 'row', alignItems: 'center', gap: 8 },
  step: { flexDirection: 'row', gap: 14, paddingVertical: 12 },
  stepsWrap: { gap: 0 },
  stepNumber: { fontFamily: 'Inter_700Bold', fontSize: 13, width: 22 },
  stepCopy: { flex: 1, gap: 4 },
  stepTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 15 },
});