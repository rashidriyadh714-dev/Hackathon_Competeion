import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getNextAction, getProgress, useApp, type ReadinessAuditResult } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import { GlassCard, PrimaryButton, ProgressBar, SecondaryButton, SectionHeader, StatusBadge, ui } from '@/components/actionlayer-ui';
import { WallpaperSettings } from '@/components/WallpaperSettings';

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { agents, activeAgentId, agent, switchAgent, runAudit, startTask, deleteAgent, theme } = useApp();
  const shadowColor = theme === 'dark' ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.95)';
  const textShadow = { textShadowColor: shadowColor, textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 8 };
  const [auditResult, setAuditResult] = useState<ReadinessAuditResult | null>(null);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [showWallpaperModal, setShowWallpaperModal] = useState(false);

  const progress = agent ? getProgress(agent) : 0;
  const next = useMemo(() => (agent ? getNextAction(agent) : { task: null, blockedTask: null }), [agent]);
  const nextIsBlocked = Boolean(next.blockedTask);
  const uncertain = agent ? agent.claims.filter((claim) => !claim.reviewed).length : 0;

  const handleRunAudit = () => {
    if (!agent) return;
    const res = runAudit(agent.id);
    setAuditResult(res);
    setShowAuditModal(true);
  };

  const handleDeleteAgent = () => {
    if (!agent) return;
    if (typeof window !== 'undefined' && window.confirm && window.confirm(`Are you sure you want to delete "${agent.title}"?`)) {
      deleteAgent(agent.id);
    } else {
      Alert.alert('Delete Agent', `Are you sure you want to delete "${agent.title}"?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteAgent(agent.id) },
      ]);
    }
  };

  const milestones = [
    { title: 'Eligibility', tasks: agent?.tasks.filter((t) => t.category === 'Eligibility') || [] },
    { title: 'Conflicts', tasks: agent?.tasks.filter((t) => t.category === 'Conflicts') || [] },
    { title: 'Foundation', tasks: agent?.tasks.filter((t) => t.category === 'Foundation') || [] },
    { title: 'Proposal', tasks: agent?.tasks.filter((t) => t.category === 'Proposal') || [] },
    { title: 'Build', tasks: agent?.tasks.filter((t) => t.category === 'Build') || [] },
    { title: 'Presentation', tasks: agent?.tasks.filter((t) => t.category === 'Presentation') || [] },
    { title: 'Submission', tasks: agent?.tasks.filter((t) => t.category === 'Submission') || [] },
  ]
    .map((ms) => {
      const minSeq = ms.tasks.length > 0 ? Math.min(...ms.tasks.map((t) => t.sequenceNumber || 999)) : 999;
      return { ...ms, minSeq };
    })
    .sort((a, b) => a.minSeq - b.minSeq);

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: 110 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topline}>
          <View>
            <Text style={[ui.eyebrow, { color: colors.mutedForeground }, textShadow]}>ACTIONLAYER WORKSPACE</Text>
            <Text style={[styles.greeting, { color: colors.text }, textShadow]}>Good morning, Rashid</Text>
            <Text style={[styles.subGreeting, { color: colors.mutedForeground }, textShadow]}>Liquid Glass & Strategic Execution</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Pressable
              accessibilityLabel="Wallpaper Settings"
              style={[styles.iconButton, { backgroundColor: colors.muted, borderColor: colors.border }]}
              onPress={() => setShowWallpaperModal(true)}
            >
              <Feather name="image" size={18} color={colors.text} />
            </Pressable>
            <Pressable
              accessibilityLabel="Notifications & Activity"
              style={[styles.iconButton, { backgroundColor: colors.muted, borderColor: colors.border }]}
              onPress={() => router.push('/(tabs)/activity')}
            >
              <Feather name="bell" size={18} color={colors.text} />
              {agents.length > 0 && <View style={[styles.notificationDot, { backgroundColor: colors.destructive }]} />}
            </Pressable>
          </View>
        </View>

        {!agent ? (
          <GlassCard style={styles.emptyState}>
            <View style={[styles.emptyIconWrap, { backgroundColor: colors.muted, borderColor: colors.border }]}>
              <Feather name="layers" size={32} color={colors.text} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Welcome to ActionLayer</Text>
            <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
              Turn any competition poster, rulebook, or PDF into an intelligent agent that manages your requirements, roadmap, and evidence.
            </Text>
            <PrimaryButton
              label="Create Your First Agent"
              icon="plus"
              onPress={() => router.push('/(tabs)/capture')}
            />
          </GlassCard>
        ) : (
          <>
            <View style={styles.agentSelectorWrap}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.agentTabsList}>
                {agents.map((ag) => {
                  const isActive = ag.id === activeAgentId;
                  const agProgress = getProgress(ag);
                  return (
                    <Pressable
                      key={ag.id}
                      onPress={() => switchAgent(ag.id)}
                      style={[
                        styles.agentChip,
                        isActive ? styles.agentChipActive : styles.agentChipInactive,
                        { borderColor: isActive ? colors.text : colors.border, backgroundColor: isActive ? colors.primary : colors.muted }
                      ]}
                    >
                      <Feather
                        name={isActive ? 'check-circle' : 'circle'}
                        size={14}
                        color={isActive ? colors.primaryForeground : colors.mutedForeground}
                      />
                      <Text
                        numberOfLines={1}
                        style={[
                          styles.agentChipText,
                          { color: isActive ? colors.primaryForeground : colors.text },
                        ]}
                      >
                        {ag.title}
                      </Text>
                      <View style={[styles.miniBadge, { backgroundColor: isActive ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)' }]}>
                        <Text style={[styles.miniBadgeText, { color: isActive ? colors.primaryForeground : colors.text }]}>
                          {agProgress}%
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
                <Pressable
                  onPress={() => router.push('/(tabs)/capture')}
                  style={[styles.agentChipAdd, { borderColor: colors.border, backgroundColor: colors.muted }]}
                >
                  <Feather name="plus" size={15} color={colors.text} />
                  <Text style={[styles.agentChipAddText, { color: colors.text }]}>New Agent</Text>
                </Pressable>
              </ScrollView>
            </View>

            {next.task ? (
              <GlassCard style={styles.nextCard}>
                <View style={styles.nextHeader}>
                  <View style={styles.nextTagRow}>
                    <Feather name="zap" size={15} color={colors.info} />
                    <Text style={[styles.nextEyebrow, { color: colors.text }]}>NEXT STRATEGIC ACTION</Text>
                  </View>
                  <StatusBadge
                    label={nextIsBlocked ? 'Prerequisite' : 'Ready'}
                    tone={nextIsBlocked ? 'warning' : 'success'}
                  />
                </View>
                <Text style={[styles.nextTitle, { color: colors.text }]}>{next.task.title}</Text>
                <Text style={[styles.nextDetail, { color: colors.text }]}>
                  {nextIsBlocked
                    ? `Complete "${next.task.title}" to unblock ${next.blockedTask?.title}.`
                    : next.task.description}
                </Text>
                <View style={styles.nextMeta}>
                  <View style={[styles.metaItem, { backgroundColor: colors.muted }]}>
                    <Feather name="clock" size={13} color={colors.mutedForeground} />
                    <Text style={[styles.metaText, { color: colors.text }]}>{next.task.estimatedMinutes} min</Text>
                  </View>
                  <View style={[styles.metaItem, { backgroundColor: colors.muted }]}>
                    <Feather name="calendar" size={13} color={colors.mutedForeground} />
                    <Text style={[styles.metaText, { color: colors.text }]}>{agent.deadlineNote}</Text>
                  </View>
                  <View style={[styles.metaItem, { backgroundColor: colors.muted }]}>
                    <Feather name="tag" size={13} color={colors.mutedForeground} />
                    <Text style={[styles.metaText, { color: colors.text }]}>{next.task.category}</Text>
                  </View>
                </View>
                <PrimaryButton
                  label={nextIsBlocked ? 'Open Prerequisite Task' : 'Execute Task in Roadmap'}
                  icon="arrow-up-right"
                  onPress={() => {
                    if (next.task) startTask(next.task.id);
                    router.push(`/agent/${agent.id}`);
                  }}
                />
              </GlassCard>
            ) : (
              <GlassCard style={styles.nextCard}>
                <View style={styles.nextHeader}>
                  <View style={styles.nextTagRow}>
                    <Feather name="award" size={15} color={colors.success} />
                    <Text style={[styles.nextEyebrow, { color: colors.text }]}>ALL CLEAR</Text>
                  </View>
                </View>
                <Text style={[styles.nextTitle, { color: colors.text }]}>No pending tasks</Text>
                <Text style={[styles.nextDetail, { color: colors.text }]}>You have completed all requirements for this agent.</Text>
              </GlassCard>
            )}

            <SectionHeader title="Readiness at a glance" action="Run 4-factor audit" onAction={handleRunAudit} />
            <View style={styles.readinessGrid}>
              <GlassCard style={styles.readinessItem}>
                <Text style={[styles.metricValue, { color: colors.text }]}>{progress}%</Text>
                <Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>Requirements Complete</Text>
              </GlassCard>
              <GlassCard style={styles.readinessItem}>
                <Text style={[styles.metricValue, { color: colors.text }]}>{Math.max(0, 100 - uncertain * 12)}%</Text>
                <Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>Evidence Readiness</Text>
              </GlassCard>
              <GlassCard style={styles.readinessItem}>
                <Text style={[styles.metricValue, { color: colors.success }]}>High</Text>
                <Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>Source Integrity</Text>
              </GlassCard>
            </View>

            <GlassCard style={styles.progressCard}>
              <ProgressBar value={progress} label={`${agent.tasks.length} tasks across ${milestones.length} milestones`} />
              <View style={styles.progressFoot}>
                <Text style={[styles.progressCaption, { color: colors.mutedForeground }]}>
                  {uncertain === 0 ? 'All source claims verified' : `${uncertain} source item(s) need review`}
                </Text>
                <Pressable onPress={() => router.push(`/review/${agent.id}`)}>
                  <Text style={[styles.progressAction, { color: colors.text }]}>Review Claims & Sources</Text>
                </Pressable>
              </View>
            </GlassCard>

            <SectionHeader title="Milestone Roadmap" action="Open full DAG" onAction={() => router.push(`/agent/${agent.id}`)} />
            <GlassCard style={{ padding: 0, overflow: 'hidden' }}>
              {milestones.map((ms, idx) => {
                const completedCount = ms.tasks.filter((t) => t.status === 'completed_by_user' || t.status === 'verified').length;
                const isAllDone = ms.tasks.length > 0 && completedCount === ms.tasks.length;
                const hasReady = ms.tasks.some((t) => t.status === 'ready' || t.status === 'in_progress');
                return (
                  <Pressable
                    key={ms.title}
                    onPress={() => router.push(`/agent/${agent.id}`)}
                    style={[
                      styles.milestoneRow,
                      idx < milestones.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
                    ]}
                  >
                    <View
                      style={[
                        styles.milestoneBadge,
                        {
                          backgroundColor: isAllDone
                            ? `${colors.success}33`
                            : hasReady
                              ? `${colors.primary}33`
                              : colors.muted,
                          borderColor: isAllDone
                            ? colors.success
                            : colors.border,
                        },
                      ]}
                    >
                      <Feather
                        name={isAllDone ? 'check' : hasReady ? 'play' : 'lock'}
                        size={13}
                        color={isAllDone ? colors.success : hasReady ? colors.primary : colors.mutedForeground}
                      />
                    </View>
                    <View style={styles.milestoneInfo}>
                      <Text style={[styles.milestoneTitle, { color: colors.text }]}>{ms.title}</Text>
                      <Text style={[styles.milestoneCount, { color: colors.mutedForeground }]}>
                        {completedCount} of {ms.tasks.length} requirements met
                      </Text>
                    </View>
                    <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
                  </Pressable>
                );
              })}
            </GlassCard>

            <SectionHeader title="Active Agent Details" action="View all agents" onAction={() => router.push('/(tabs)/agents')} />
            <GlassCard style={styles.agentCard} onPress={() => router.push(`/agent/${agent.id}`)}>
              <View style={[styles.agentIcon, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                <Feather name="award" size={20} color={colors.text} />
              </View>
              <View style={styles.agentCopy}>
                <View style={styles.agentTitleRow}>
                  <Text style={[styles.agentTitle, { color: colors.text }]}>{agent.title}</Text>
                  <StatusBadge label="Active" tone="info" />
                </View>
                <Text style={[styles.agentSub, { color: colors.mutedForeground }]}>
                  {agent.organizer} · {agent.sourceLabel}
                </Text>
              </View>
              <Pressable
                accessibilityLabel="Delete Agent"
                onPress={(e) => {
                  e.stopPropagation();
                  handleDeleteAgent();
                }}
                style={[styles.trashBtn, { backgroundColor: `${colors.destructive}22`, borderColor: `${colors.destructive}55` }]}
              >
                <Feather name="trash-2" size={17} color={colors.destructive} />
              </Pressable>
            </GlassCard>

            <SectionHeader title="Target Submission" />
            <GlassCard style={styles.upcoming}>
              <View style={[styles.dateBlock, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                <Feather name="calendar" size={22} color={colors.text} />
              </View>
              <View style={styles.upcomingCopy}>
                <Text style={[styles.upcomingTitle, { color: colors.text }]}>Final Submission Deadline</Text>
                <Text style={[styles.upcomingSub, { color: colors.mutedForeground }]}>{agent.title} · {agent.deadlineNote}</Text>
              </View>
              <Feather name="arrow-up-right" size={18} color={colors.text} />
            </GlassCard>
          </>
        )}
      </ScrollView>

      <Modal visible={showAuditModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <GlassCard style={styles.auditModalBox}>
            <View style={styles.auditHeader}>
              <Feather name="shield" size={22} color={colors.text} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.auditTitle, { color: colors.text }]}>Four-Factor Readiness Audit</Text>
                <Text style={[styles.auditSub, { color: colors.mutedForeground }]}>{agent?.title}</Text>
              </View>
              <Pressable onPress={() => setShowAuditModal(false)} style={[styles.closeBtn, { backgroundColor: colors.muted }]}>
                <Feather name="x" size={18} color={colors.text} />
              </Pressable>
            </View>

            {auditResult && (
              <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
                <View style={styles.auditStatsRow}>
                  <View style={[styles.auditStat, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                    <Text style={[styles.auditStatVal, { color: colors.text }]}>{auditResult.requirementsCompletionPct}%</Text>
                    <Text style={[styles.auditStatLabel, { color: colors.mutedForeground }]}>Completion</Text>
                  </View>
                  <View style={[styles.auditStat, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                    <Text style={[styles.auditStatVal, { color: colors.success }]}>
                      {auditResult.evidenceReadinessPct}%
                    </Text>
                    <Text style={[styles.auditStatLabel, { color: colors.mutedForeground }]}>Evidence</Text>
                  </View>
                  <View style={[styles.auditStat, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                    <Text
                      style={[
                        styles.auditStatVal,
                        {
                          color:
                            auditResult.deadlineRiskLevel === 'Low'
                              ? colors.success
                              : auditResult.deadlineRiskLevel === 'Medium'
                                ? colors.warning
                                : colors.risk,
                        },
                      ]}
                    >
                      {auditResult.deadlineRiskLevel}
                    </Text>
                    <Text style={[styles.auditStatLabel, { color: colors.mutedForeground }]}>Risk Level</Text>
                  </View>
                </View>

                <Text style={[styles.auditSectionTitle, { color: colors.text }]}>Audit Findings</Text>
                {auditResult.riskReasons.map((reason, i) => (
                  <View key={i} style={styles.auditItemRow}>
                    <Feather name="alert-circle" size={14} color={colors.warning} />
                    <Text style={[styles.auditItemText, { color: colors.text }]}>{reason}</Text>
                  </View>
                ))}

                <Text style={[styles.auditSectionTitle, { marginTop: 12, color: colors.text }]}>
                  Remaining Items ({auditResult.missingTasks.length})
                </Text>
                {auditResult.missingTasks.map((t) => (
                  <View key={t.id} style={styles.auditItemRow}>
                    <Feather name="circle" size={12} color={colors.mutedForeground} />
                    <Text style={[styles.auditItemMuted, { color: colors.mutedForeground }]}>
                      {t.title} ({t.category})
                    </Text>
                  </View>
                ))}
              </ScrollView>
            )}

            <View style={{ gap: 8, marginTop: 14 }}>
              <PrimaryButton
                label="Go to Roadmap & Complete Tasks"
                icon="arrow-right"
                onPress={() => {
                  setShowAuditModal(false);
                  if (agent) router.push(`/agent/${agent.id}`);
                }}
              />
              <SecondaryButton label="Dismiss" onPress={() => setShowAuditModal(false)} />
            </View>
          </GlassCard>
        </View>
      </Modal>

      <Modal visible={showWallpaperModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <GlassCard style={[styles.auditModalBox, { maxWidth: 500, padding: 0 }]}>
            <View style={[styles.auditHeader, { padding: 20, paddingBottom: 0 }]}>
              <Feather name="image" size={22} color={colors.text} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.auditTitle, { color: colors.text }]}>Appearance & Wallpaper</Text>
              </View>
              <Pressable onPress={() => setShowWallpaperModal(false)} style={[styles.closeBtn, { backgroundColor: colors.muted }]}>
                <Feather name="x" size={18} color={colors.text} />
              </Pressable>
            </View>
            <ScrollView style={{ maxHeight: 600, padding: 20 }}>
              <WallpaperSettings />
              <View style={{ marginTop: 24, gap: 10 }}>
                <PrimaryButton label="Apply & Close" icon="check" onPress={() => setShowWallpaperModal(false)} />
                <SecondaryButton label="Back" onPress={() => setShowWallpaperModal(false)} />
              </View>
            </ScrollView>
          </GlassCard>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'transparent' },
  content: { paddingHorizontal: 20, gap: 16 },
  topline: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  greeting: { fontFamily: 'Inter_700Bold', fontSize: 26, letterSpacing: -0.6, marginTop: 4 },
  subGreeting: { fontFamily: 'Inter_400Regular', fontSize: 13 },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(16px)',
  } as any,
  notificationDot: { width: 7, height: 7, borderRadius: 4, position: 'absolute', top: 9, right: 9 },

  agentSelectorWrap: { marginHorizontal: -20, paddingHorizontal: 20 },
  agentTabsList: { flexDirection: 'row', gap: 8, paddingVertical: 4 },
  agentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    backdropFilter: 'blur(16px)',
  } as any,
  agentChipActive: {
    boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.35), 0 4px 14px rgba(0, 0, 0, 0.25)',
  } as any,
  agentChipInactive: {
  } as any,
  agentChipAdd: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
  },
  agentChipText: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  agentChipAddText: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  miniBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999 },
  miniBadgeText: { fontFamily: 'Inter_700Bold', fontSize: 11 },

  emptyState: { alignItems: 'center', justifyContent: 'center', gap: 12, marginVertical: 30, padding: 28 },
  emptyIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: 6,
  },
  emptyTitle: { fontFamily: 'Inter_700Bold', fontSize: 22, textAlign: 'center' },
  emptyDesc: { fontFamily: 'Inter_400Regular', fontSize: 14, textAlign: 'center', lineHeight: 21, marginBottom: 8 },

  nextCard: { padding: 20, gap: 14 },
  nextHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  nextTagRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  nextEyebrow: { fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 1.5 },
  nextTitle: { fontFamily: 'Inter_700Bold', fontSize: 21, lineHeight: 27, letterSpacing: -0.4 },
  nextDetail: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 21 },
  nextMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  metaText: { fontFamily: 'Inter_500Medium', fontSize: 12 },

  readinessGrid: { flexDirection: 'row', gap: 10 },
  readinessItem: { flex: 1, padding: 14, gap: 4 },
  metricValue: { fontFamily: 'Inter_700Bold', fontSize: 20 },
  metricLabel: { fontFamily: 'Inter_400Regular', fontSize: 11 },

  progressCard: { padding: 16, gap: 12 },
  progressFoot: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressCaption: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  progressAction: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },

  milestoneRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  milestoneBorder: { borderBottomWidth: 1 },
  milestoneBadge: { width: 30, height: 30, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  milestoneInfo: { flex: 1, gap: 2 },
  milestoneTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  milestoneCount: { fontFamily: 'Inter_400Regular', fontSize: 12 },

  agentCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14 },
  agentIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  agentCopy: { flex: 1, gap: 4 },
  agentTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  agentTitle: { fontFamily: 'Inter_700Bold', fontSize: 15 },
  agentSub: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  trashBtn: {
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  upcoming: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  dateBlock: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  upcomingCopy: { flex: 1, gap: 3 },
  upcomingTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  upcomingSub: { fontFamily: 'Inter_400Regular', fontSize: 12 },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backdropFilter: 'blur(12px)',
  } as any,
  auditModalBox: { width: '100%', maxWidth: 420, padding: 20, gap: 14 },
  auditHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  auditTitle: { fontFamily: 'Inter_700Bold', fontSize: 17 },
  auditSub: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  closeBtn: {
    padding: 6,
    borderRadius: 999,
  },
  auditStatsRow: { flexDirection: 'row', gap: 8, marginVertical: 10 },
  auditStat: {
    flex: 1,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    gap: 2,
  },
  auditStatVal: { fontFamily: 'Inter_700Bold', fontSize: 18 },
  auditStatLabel: { fontFamily: 'Inter_400Regular', fontSize: 11 },
  auditSectionTitle: { fontFamily: 'Inter_700Bold', fontSize: 13, marginTop: 8, marginBottom: 4 },
  auditItemRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  auditItemText: { fontFamily: 'Inter_400Regular', fontSize: 12, flex: 1 },
  auditItemMuted: { fontFamily: 'Inter_400Regular', fontSize: 12, flex: 1 },
});
