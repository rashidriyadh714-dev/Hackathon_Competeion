import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getNextAction, getProgress, useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import { OfflineBanner, PrimaryButton, ProgressBar, SectionHeader, StatusBadge, ui } from '@/components/actionlayer-ui';

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { agent, isDemoMode, runAudit, startTask } = useApp();
  const [offline, setOffline] = useState(false);
  const progress = getProgress(agent);
  const next = useMemo(() => getNextAction(agent), [agent]);
  const nextIsBlocked = Boolean(next.blockedTask);
  const uncertain = agent.claims.filter((claim) => !claim.reviewed || claim.status === 'inferred_needs_review' || claim.status === 'missing').length;

  return <View style={[styles.root, { backgroundColor: colors.background }]}>
    <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 18, paddingBottom: 110 }]} showsVerticalScrollIndicator={false}>
      <View style={styles.topline}><View><Text style={[ui.eyebrow, { color: colors.primary }]}>ACTIONLAYER</Text><Text style={[styles.greeting, { color: colors.foreground }]}>Good morning, Alex</Text><Text style={[ui.caption, { color: colors.mutedForeground }]}>Monday, 21 September 2026</Text></View><Pressable accessibilityLabel="Notifications" style={[styles.iconButton, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => router.push('/(tabs)/activity')}><Feather name="bell" size={19} color={colors.foreground} /><View style={[styles.notificationDot, { backgroundColor: colors.risk }]} /></Pressable></View>
      {offline && <OfflineBanner />}
      <View style={[styles.demoStrip, { backgroundColor: colors.accent }]}><View style={styles.demoCopy}><Feather name="compass" size={16} color={colors.accentForeground} /><Text style={[ui.captionStrong, { color: colors.accentForeground }]}>Fictional demo mode</Text></View><Pressable onPress={() => setOffline((current) => !current)}><Text style={[ui.captionStrong, { color: colors.accentForeground }]}>{offline ? 'Online' : 'Offline'}</Text></Pressable></View>
      <View style={[styles.nextCard, { backgroundColor: colors.primary }]}><View style={styles.nextHeader}><Text style={[ui.captionStrong, { color: '#DCE6FF' }]}>YOUR NEXT ACTION</Text><StatusBadge label={nextIsBlocked ? 'Unblock first' : 'In progress'} tone={nextIsBlocked ? 'warning' : 'info'} /></View><Text style={styles.nextTitle}>{next.task.title}</Text><Text style={styles.nextDetail}>{nextIsBlocked ? `Complete “${next.task.title}” to unblock ${next.blockedTask?.title}.` : next.task.description}</Text><View style={styles.nextMeta}><View style={styles.metaItem}><Feather name="clock" size={14} color="#DCE6FF" /><Text style={styles.metaText}>{next.task.estimatedMinutes} min</Text></View><View style={styles.metaItem}><Feather name="calendar" size={14} color="#DCE6FF" /><Text style={styles.metaText}>{agent.deadlineNote}</Text></View></View><PrimaryButton label={nextIsBlocked ? 'Open prerequisite' : 'Start task'} icon="arrow-up-right" onPress={() => { startTask(next.task.id); router.push(`/agent/${agent.id}`); }} /></View>
      <SectionHeader title="Readiness at a glance" action="Run audit" onAction={runAudit} />
      <View style={styles.readinessGrid}><View style={[styles.readinessItem, { backgroundColor: colors.card, borderColor: colors.border }]}><Text style={[styles.metricValue, { color: colors.foreground }]}>{progress}%</Text><Text style={[ui.caption, { color: colors.mutedForeground }]}>Requirements complete</Text></View><View style={[styles.readinessItem, { backgroundColor: colors.card, borderColor: colors.border }]}><Text style={[styles.metricValue, { color: colors.foreground }]}>{Math.max(0, 100 - uncertain * 14)}%</Text><Text style={[ui.caption, { color: colors.mutedForeground }]}>Evidence readiness</Text></View><View style={[styles.readinessItem, { backgroundColor: colors.card, borderColor: colors.border }]}><Text style={[styles.metricValue, { color: colors.warning }]}>Medium</Text><Text style={[ui.caption, { color: colors.mutedForeground }]}>Deadline risk</Text></View></View>
      <View style={[styles.progressCard, { backgroundColor: colors.card, borderColor: colors.border }]}><ProgressBar value={progress} label={`${agent.tasks.length} tasks in this plan`} /><View style={styles.progressFoot}><Text style={[ui.caption, { color: colors.mutedForeground }]}>{uncertain} source items need review</Text><Pressable onPress={() => router.push(`/review/${agent.id}`)}><Text style={[ui.captionStrong, { color: colors.primary }]}>Review claims</Text></Pressable></View></View>
      <SectionHeader title="Active agent" action="View all" onAction={() => router.push('/(tabs)/agents')} />
      <Pressable style={[styles.agentRow, { borderBottomColor: colors.border }]} onPress={() => router.push(`/agent/${agent.id}`)}><View style={[styles.agentIcon, { backgroundColor: colors.secondary }]}><Feather name="award" size={20} color={colors.primary} /></View><View style={styles.agentCopy}><View style={styles.agentTitleRow}><Text style={[styles.agentTitle, { color: colors.foreground }]}>{agent.title}</Text><StatusBadge label="At risk" tone="warning" /></View><Text style={[ui.caption, { color: colors.mutedForeground }]}>{agent.organizer} · deadline in 27 days</Text></View><Feather name="chevron-right" size={18} color={colors.mutedForeground} /></Pressable>
      <SectionHeader title="Upcoming" />
      <View style={styles.upcoming}><View style={[styles.dateBlock, { backgroundColor: colors.secondary }]}><Text style={[ui.captionStrong, { color: colors.primary }]}>OCT</Text><Text style={[styles.dateNumber, { color: colors.foreground }]}>18</Text></View><View style={styles.upcomingCopy}><Text style={[styles.agentTitle, { color: colors.foreground }]}>Final submission</Text><Text style={[ui.caption, { color: colors.mutedForeground }]}>Northstar Build Challenge · 11:59 PM MYT</Text></View><Feather name="arrow-up-right" size={18} color={colors.primary} /></View>
      {isDemoMode && <Text style={[styles.disclaimer, { color: colors.mutedForeground }]}>All opportunity content shown here is fictional demo data for ActionLayer.</Text>}
    </ScrollView>
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 20 },
  topline: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  greeting: { fontFamily: 'Inter_700Bold', fontSize: 28, letterSpacing: -0.7, marginTop: 5 },
  iconButton: { width: 44, height: 44, borderWidth: 1, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  notificationDot: { width: 7, height: 7, borderRadius: 4, position: 'absolute', top: 9, right: 9 },
  demoStrip: { borderRadius: 12, minHeight: 36, paddingHorizontal: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  demoCopy: { flexDirection: 'row', gap: 7, alignItems: 'center' },
  nextCard: { borderRadius: 20, padding: 18, gap: 12 },
  nextHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  nextTitle: { color: '#FFFFFF', fontFamily: 'Inter_700Bold', fontSize: 22, lineHeight: 28, letterSpacing: -0.4 },
  nextDetail: { color: '#E9EEFF', fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 21 },
  nextMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { color: '#DCE6FF', fontFamily: 'Inter_500Medium', fontSize: 12 },
  readinessGrid: { flexDirection: 'row', gap: 8 },
  readinessItem: { flex: 1, padding: 13, borderRadius: 14, borderWidth: 1, gap: 4 },
  metricValue: { fontFamily: 'Inter_700Bold', fontSize: 18 },
  progressCard: { borderRadius: 16, borderWidth: 1, padding: 15, gap: 13 },
  progressFoot: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  agentRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingBottom: 16, borderBottomWidth: 1 },
  agentIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  agentCopy: { flex: 1, gap: 5 },
  agentTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  agentTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 15, flexShrink: 1 },
  upcoming: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dateBlock: { width: 52, height: 58, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  dateNumber: { fontFamily: 'Inter_700Bold', fontSize: 22 },
  upcomingCopy: { flex: 1, gap: 4 },
  disclaimer: { fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 16, textAlign: 'center', paddingHorizontal: 18 },
});