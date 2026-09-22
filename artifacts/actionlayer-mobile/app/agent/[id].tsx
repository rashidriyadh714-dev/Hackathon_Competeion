import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getProgress, useApp, type Task } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import { BottomSheet, PrimaryButton, ProgressBar, SectionHeader, StatusBadge, TextField, ui } from '@/components/actionlayer-ui';

export default function AgentDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { agent, startTask, completeTask, addEvidence, runAudit } = useApp();
  const [tab, setTab] = useState<'overview' | 'plan' | 'evidence' | 'sources'>('overview');
  const [evidenceTask, setEvidenceTask] = useState<Task | null>(null);
  const [evidenceLabel, setEvidenceLabel] = useState('');
  const [evidenceExplanation, setEvidenceExplanation] = useState('');
  const progress = getProgress(agent);
  const audit = runAudit;

  return <View style={[styles.root, { backgroundColor: colors.background }]}><ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 12, paddingBottom: 110 }]}><Pressable accessibilityLabel="Go back" onPress={() => router.back()} style={styles.back}><Feather name="arrow-left" size={21} color={colors.foreground} /><Text style={[ui.captionStrong, { color: colors.foreground }]}>Agents</Text></Pressable><View style={styles.hero}><View style={[styles.heroIcon, { backgroundColor: colors.secondary }]}><Feather name="award" size={22} color={colors.primary} /></View><StatusBadge label="Competition Agent" tone="info" /><Text style={[styles.title, { color: colors.foreground }]}>{agent.title}</Text><Text style={[ui.body, { color: colors.mutedForeground, textAlign: 'left' }]}>{agent.organizer} · fictional demo data</Text></View><View style={styles.tabs}>{(['overview', 'plan', 'evidence', 'sources'] as const).map((item) => <Pressable key={item} onPress={() => setTab(item)} style={[styles.tab, { borderBottomColor: tab === item ? colors.primary : colors.border }]}><Text style={[ui.captionStrong, { color: tab === item ? colors.primary : colors.mutedForeground }]}>{item[0].toUpperCase() + item.slice(1)}</Text></Pressable>)}</View>{tab === 'overview' && <Overview agent={agent} progress={progress} onAudit={() => { const result = audit(); Alert.alert('Readiness audit', `${result.ready.length} ready · ${result.missing.length} missing · ${result.blocked.length} blocked · ${result.uncertain.length} uncertain`); }} />}{tab === 'plan' && <View style={styles.section}><SectionHeader title={`${agent.tasks.length} tasks · dependency-aware`} /><Text style={[ui.caption, { color: colors.mutedForeground }]}>A task is only ready when essential prerequisites are complete.</Text>{agent.tasks.map((task) => <TaskRow key={task.id} task={task} tasks={agent.tasks} onStart={() => startTask(task.id)} onComplete={() => completeTask(task.id)} onEvidence={() => setEvidenceTask(task)} />)}</View>}{tab === 'evidence' && <EvidenceTab agent={agent} onAdd={(task) => setEvidenceTask(task)} />}{tab === 'sources' && <SourcesTab agent={agent} onReview={() => router.push(`/review/${agent.id}`)} />}</ScrollView><BottomSheet visible={Boolean(evidenceTask)} title="Attach evidence" onClose={() => setEvidenceTask(null)}>{evidenceTask && <><Text style={[ui.body, { color: colors.mutedForeground, textAlign: 'left' }]}>Evidence for “{evidenceTask.title}” is stored with an explicit verification level.</Text><TextField label="Evidence label" value={evidenceLabel} onChangeText={setEvidenceLabel} placeholder="e.g. Repository URL" /><TextField label="Short explanation" value={evidenceExplanation} onChangeText={setEvidenceExplanation} placeholder="What does this prove?" multiline /><PrimaryButton label="Submit for validation" icon="check" disabled={evidenceLabel.trim().length < 3 || evidenceExplanation.trim().length < 5} onPress={() => { addEvidence(evidenceTask.id, evidenceLabel, evidenceExplanation); setEvidenceLabel(''); setEvidenceExplanation(''); setEvidenceTask(null); }} /></>}</BottomSheet></View>;
}

function Overview({ agent, progress, onAudit }: { agent: import('@/context/AppContext').Agent; progress: number; onAudit: () => void }) {
  const colors = useColors();
  const uncertain = agent.claims.filter((claim) => !claim.reviewed || claim.status === 'inferred_needs_review' || claim.status === 'missing').length;
  const blocked = agent.tasks.filter((task) => task.status === 'blocked').length;
  return <View style={styles.section}><View style={styles.overviewHeader}><View><Text style={[ui.caption, { color: colors.mutedForeground }]}>Submission deadline</Text><Text style={[styles.deadline, { color: colors.foreground }]}>18 Oct 2026</Text><Text style={[ui.caption, { color: colors.warning }]}>27 days · timezone confirmed</Text></View><View style={[styles.countdown, { backgroundColor: colors.secondary }]}><Text style={[styles.countdownNumber, { color: colors.primary }]}>27</Text><Text style={[ui.captionStrong, { color: colors.primary }]}>DAYS</Text></View></View><ProgressBar value={progress} label="Requirements completion" /><View style={styles.indicators}><Metric label="Evidence" value={`${Math.max(0, 100 - blocked * 14)}%`} tone="success" /><Metric label="Source confidence" value={uncertain > 0 ? 'Review' : 'High'} tone={uncertain > 0 ? 'warning' : 'success'} /><Metric label="Deadline risk" value="Medium" tone="warning" /></View><View style={[styles.callout, { backgroundColor: colors.secondary }]}><Feather name="compass" size={18} color={colors.primary} /><View style={styles.calloutCopy}><Text style={[styles.calloutTitle, { color: colors.foreground }]}>Next action</Text><Text style={[ui.caption, { color: colors.mutedForeground }]}>Finish the concept before creating the project repository.</Text></View></View><PrimaryButton label="Run final readiness audit" icon="check-circle" onPress={onAudit} /><SectionHeader title="Current blockers" /><View style={styles.blockers}><StatusBadge label={`${blocked} blocked task`} tone="warning" /><Text style={[ui.caption, { color: colors.mutedForeground }]}>The repository task is waiting on the concept task.</Text></View></View>;
}

function Metric({ label, value, tone }: { label: string; value: string; tone: 'success' | 'warning' }) {
  const colors = useColors();
  return <View style={styles.metric}><Text style={[styles.metricValue, { color: tone === 'success' ? colors.success : colors.warning }]}>{value}</Text><Text style={[ui.caption, { color: colors.mutedForeground }]}>{label}</Text></View>;
}

function TaskRow({ task, tasks, onStart, onComplete, onEvidence }: { task: Task; tasks: Task[]; onStart: () => void; onComplete: () => void; onEvidence: () => void }) {
  const colors = useColors();
  const dependency = task.dependencyIds.map((id) => tasks.find((item) => item.id === id)?.title).filter(Boolean).join(', ');
  const ready = task.dependencyIds.every((id) => ['completed_by_user', 'verified'].includes(tasks.find((item) => item.id === id)?.status ?? ''));
  const isComplete = task.status === 'completed_by_user' || task.status === 'verified';
  return <View style={[styles.taskRow, { borderColor: task.status === 'blocked' ? colors.warning : colors.border, backgroundColor: colors.card }]}><View style={styles.taskRowTop}><View style={[styles.taskNumber, { backgroundColor: isComplete ? colors.accent : colors.secondary }]}><Text style={[ui.captionStrong, { color: isComplete ? colors.accentForeground : colors.primary }]}>{isComplete ? '✓' : task.id.replace('task-', '').slice(0, 2).toUpperCase()}</Text></View><View style={styles.taskCopy}><View style={styles.taskTitleLine}><Text style={[styles.taskTitle, { color: colors.foreground }]}>{task.title}</Text><StatusBadge label={task.status === 'blocked' || !ready ? 'Blocked' : isComplete ? 'Complete' : task.status === 'in_progress' ? 'In progress' : 'Ready'} tone={task.status === 'blocked' || !ready ? 'warning' : isComplete ? 'success' : 'info'} /></View><Text style={[ui.caption, { color: colors.mutedForeground }]}>{task.category} · {task.estimatedMinutes} min</Text>{!ready && dependency && <Text style={[ui.caption, { color: colors.warning }]}>Waiting on: {dependency}</Text>}</View></View>{!isComplete && <View style={styles.taskActions}>{task.evidenceRequired && <Pressable onPress={onEvidence}><Text style={[ui.captionStrong, { color: colors.primary }]}>Add evidence</Text></Pressable>}{ready && <Pressable onPress={task.status === 'in_progress' ? onComplete : onStart}><Text style={[ui.captionStrong, { color: colors.primary }]}>{task.status === 'in_progress' ? 'Mark complete' : 'Start task'}</Text></Pressable>}</View>}</View>;
}

function EvidenceTab({ agent, onAdd }: { agent: import('@/context/AppContext').Agent; onAdd: (task: Task) => void }) {
  const colors = useColors();
  return <View style={styles.section}><SectionHeader title="Evidence by requirement" /><Text style={[ui.caption, { color: colors.mutedForeground }]}>Attached evidence is not automatically official verification.</Text>{agent.tasks.map((task) => { const evidence = agent.evidence.find((item) => item.taskId === task.id); return <View key={task.id} style={[styles.evidenceRow, { borderBottomColor: colors.border }]}><View style={styles.evidenceCopy}><Text style={[styles.taskTitle, { color: colors.foreground }]}>{task.title}</Text>{evidence ? <><StatusBadge label={`Level ${evidence.verification?.level ?? 2} · ${evidence.verification?.status === 'partially_verified' ? 'Partially verified' : 'Verified'}`} tone="warning" /><Text style={[ui.caption, { color: colors.mutedForeground }]}>{evidence.label}</Text></> : <Text style={[ui.caption, { color: colors.mutedForeground }]}>Missing evidence</Text>}</View>{!evidence && <Pressable onPress={() => onAdd(task)}><Feather name="paperclip" size={19} color={colors.primary} /></Pressable>}</View>; })}</View>;
}

function SourcesTab({ agent, onReview }: { agent: import('@/context/AppContext').Agent; onReview: () => void }) {
  const colors = useColors();
  return <View style={styles.section}><SectionHeader title="Source record" action="Review" onAction={onReview} /><View style={[styles.sourceCard, { backgroundColor: colors.card, borderColor: colors.border }]}><View style={styles.sourceTop}><Feather name="image" size={21} color={colors.primary} /><StatusBadge label="Preserved" tone="success" /></View><Text style={[styles.taskTitle, { color: colors.foreground }]}>{agent.sourceLabel}</Text><Text style={[ui.caption, { color: colors.mutedForeground }]}>{agent.sourceType} · captured today · private</Text></View><SectionHeader title="Grounded claims" />{agent.claims.map((claim) => <View key={claim.id} style={[styles.claimRow, { borderBottomColor: colors.border }]}><View style={styles.claimCopy}><Text style={[ui.captionStrong, { color: colors.foreground }]}>{claim.field}</Text><Text style={[ui.caption, { color: colors.mutedForeground }]}>{claim.sourceExcerpt}</Text></View><StatusBadge label={`${Math.round(claim.confidence * 100)}%`} tone={claim.reviewed ? 'success' : 'warning'} /></View>)}</View>;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 18 },
  back: { flexDirection: 'row', gap: 8, alignItems: 'center', minHeight: 42 },
  hero: { gap: 9 },
  heroIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: 'Inter_700Bold', fontSize: 29, lineHeight: 34, letterSpacing: -0.6 },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#DDD9D1' },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2 },
  section: { gap: 14 },
  overviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  deadline: { fontFamily: 'Inter_700Bold', fontSize: 21, marginTop: 3 },
  countdown: { width: 72, height: 72, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  countdownNumber: { fontFamily: 'Inter_700Bold', fontSize: 30, lineHeight: 32 },
  indicators: { flexDirection: 'row', gap: 8 },
  metric: { flex: 1, padding: 11, borderRadius: 12, backgroundColor: '#FFFFFF10', gap: 3 },
  metricValue: { fontFamily: 'Inter_700Bold', fontSize: 16 },
  callout: { padding: 13, borderRadius: 13, flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  calloutCopy: { flex: 1, gap: 4 },
  calloutTitle: { fontFamily: 'Inter_700Bold', fontSize: 14 },
  blockers: { gap: 6 },
  taskRow: { borderWidth: 1, borderRadius: 15, padding: 13, gap: 10 },
  taskRowTop: { flexDirection: 'row', gap: 10 },
  taskNumber: { width: 32, height: 32, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  taskCopy: { flex: 1, gap: 5 },
  taskTitleLine: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  taskTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 14, flex: 1, lineHeight: 19 },
  taskActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 18, borderTopWidth: 1, borderTopColor: '#DDD9D1', paddingTop: 9 },
  evidenceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 13, borderBottomWidth: 1 },
  evidenceCopy: { flex: 1, gap: 5 },
  sourceCard: { borderWidth: 1, borderRadius: 15, padding: 14, gap: 9 },
  sourceTop: { flexDirection: 'row', justifyContent: 'space-between' },
  claimRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, borderBottomWidth: 1 },
  claimCopy: { flex: 1, gap: 4 },
});