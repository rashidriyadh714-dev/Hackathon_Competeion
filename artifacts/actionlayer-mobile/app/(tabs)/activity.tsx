import { Feather } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SectionHeader, StatusBadge, ui } from '@/components/actionlayer-ui';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';

export default function ActivityScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { activities } = useApp();
  return <View style={[styles.root, { backgroundColor: colors.background }]}><ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 18, paddingBottom: 110 }]}><Text style={[ui.eyebrow, { color: colors.primary }]}>ACTIVITY</Text><Text style={[styles.title, { color: colors.foreground }]}>A clear record of progress</Text><Text style={[ui.body, { color: colors.mutedForeground, textAlign: 'left' }]}>Every important change is recorded so you can see what happened and why.</Text><SectionHeader title="Recent" /><View style={styles.timeline}>{activities.map((event, index) => <View key={event.id} style={styles.event}><View style={styles.rail}>{<View style={[styles.dot, { backgroundColor: event.tone === 'success' ? colors.success : event.tone === 'warning' ? colors.warning : colors.primary }]} />}{index < activities.length - 1 && <View style={[styles.line, { backgroundColor: colors.border }]} />}</View><View style={styles.eventCopy}><View style={styles.eventTop}><Text style={[styles.eventTitle, { color: colors.foreground }]}>{event.title}</Text><StatusBadge label={event.tone === 'success' ? 'Done' : event.tone === 'warning' ? 'Review' : 'Info'} tone={event.tone} /></View><Text style={[ui.caption, { color: colors.mutedForeground }]}>{event.detail}</Text><Text style={[styles.time, { color: colors.mutedForeground }]}>{event.time}</Text></View></View>)}</View></ScrollView></View>;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 16 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 28, letterSpacing: -0.6, marginTop: 4 },
  timeline: { gap: 0 },
  event: { flexDirection: 'row', gap: 12, minHeight: 92 },
  rail: { width: 18, alignItems: 'center' },
  dot: { width: 11, height: 11, borderRadius: 6, marginTop: 5 },
  line: { width: 1, flex: 1, marginVertical: 5 },
  eventCopy: { flex: 1, gap: 5, paddingBottom: 20 },
  eventTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  eventTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 15, flex: 1 },
  time: { fontFamily: 'Inter_500Medium', fontSize: 11, marginTop: 2 },
});