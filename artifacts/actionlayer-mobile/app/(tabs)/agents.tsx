import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getProgress, useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import { GlassCard, PrimaryButton, ProgressBar, SectionHeader, StatusBadge, ui } from '@/components/actionlayer-ui';

export default function AgentsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { agents, activeAgentId, switchAgent, deleteAgent } = useApp();
  const colors = useColors();
  const [filter, setFilter] = useState<'All' | 'Active' | 'Review Required'>('All');

  const filteredAgents = agents.filter((ag) => {
    if (filter === 'Active') return ag.id === activeAgentId;
    if (filter === 'Review Required') {
      return ag.claims.some((c) => !c.reviewed);
    }
    return true;
  });

  const handleDeleteAgent = (id: string, title: string) => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm && window.confirm(`Are you sure you want to delete "${title}"?`)) {
        deleteAgent(id);
      }
    } else {
      Alert.alert('Delete Agent', `Are you sure you want to delete "${title}"?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteAgent(id) },
      ]);
    }
  };

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 18, paddingBottom: 110 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <Text style={[ui.eyebrow, { color: colors.mutedForeground }]}>AUTONOMOUS AGENTS</Text>
          <Text style={[styles.title, { color: colors.text }]}>Your Agents ({agents.length})</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            Dedicated agents that manage requirements, resolve dependencies, and track your readiness.
          </Text>
        </View>

        {/* Quick Add Button */}
        <GlassCard style={styles.createBtn} onPress={() => router.push('/(tabs)/capture')}>
          <View style={[styles.createIcon, { backgroundColor: colors.text }]}>
            <Feather name="plus" size={18} color={colors.card} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.createText, { color: colors.text }]}>Create New Agent</Text>
            <Text style={[styles.createSub, { color: colors.mutedForeground }]}>
              Capture poster, upload PDF rulebook, or paste text
            </Text>
          </View>
          <Feather name="arrow-right" size={18} color={colors.text} />
        </GlassCard>

        {agents.length === 0 ? (
          <GlassCard style={{ alignItems: 'center', marginVertical: 30, padding: 32 }}>
            <Feather name="inbox" size={44} color={colors.mutedForeground} style={{ marginBottom: 14 }} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              No agents yet. Tap 'Create New Agent' above to get started.
            </Text>
          </GlassCard>
        ) : (
          <>
            {/* Filters */}
            <View style={styles.filters}>
              {(['All', 'Active', 'Review Required'] as const).map((item) => (
                <Pressable
                  key={item}
                  accessibilityRole="button"
                  onPress={() => setFilter(item)}
                  style={[
                    styles.filter,
                    filter === item ? styles.filterActive : styles.filterInactive,
                    { borderColor: filter === item ? colors.text : colors.border, backgroundColor: filter === item ? colors.text : colors.muted }
                  ]}
                >
                  <Text
                    style={[
                      styles.filterText,
                      { color: filter === item ? colors.card : colors.text },
                    ]}
                  >
                    {item === 'All' ? `All (${agents.length})` : item}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Agents List */}
            <SectionHeader title="Active Agent Workspaces" />
            {filteredAgents.map((ag) => {
              const isActive = ag.id === activeAgentId;
              const progress = getProgress(ag);
              const readyCount = ag.tasks.filter((t) => t.status === 'ready' || t.status === 'in_progress').length;
              const blockedCount = ag.tasks.filter((t) => t.status === 'blocked').length;
              const completedCount = ag.tasks.filter((t) => t.status === 'completed_by_user' || t.status === 'verified').length;
              const uncertainCount = ag.claims.filter((c) => !c.reviewed).length;

              return (
                <GlassCard
                  key={ag.id}
                  style={[
                    styles.card,
                    isActive && styles.cardActive,
                    isActive && { borderColor: colors.primary }
                  ]}
                >
                  <View style={styles.cardTop}>
                    <View style={[styles.icon, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                      <Feather name="award" size={20} color={colors.text} />
                    </View>
                    <View style={styles.badgeGroup}>
                      {isActive ? (
                        <StatusBadge label="Active Agent" tone="info" />
                      ) : (
                        <Pressable onPress={() => switchAgent(ag.id)}>
                          <StatusBadge label="Set as Active" tone="neutral" />
                        </Pressable>
                      )}
                      {uncertainCount > 0 ? (
                        <StatusBadge label={`${uncertainCount} Need Review`} tone="warning" />
                      ) : (
                        <StatusBadge label="Ready" tone="success" />
                      )}
                    </View>
                  </View>

                  <Text style={[styles.cardTitle, { color: colors.text }]}>{ag.title}</Text>
                  <Text style={[styles.cardSub, { color: colors.mutedForeground }]} numberOfLines={1}>
                    {ag.organizer} · Source: {ag.sourceLabel}
                  </Text>

                  {/* Progress bar */}
                  <View style={{ marginVertical: 4 }}>
                    <ProgressBar value={progress} label={`${progress}% Complete · ${completedCount} of ${ag.tasks.length} tasks`} />
                  </View>

                  <View style={styles.taskStatsRow}>
                    <View style={[styles.statPill, { backgroundColor: colors.muted }]}>
                      <Feather name="play-circle" size={13} color={colors.info} />
                      <Text style={[styles.statPillText, { color: colors.text }]}>{readyCount} Ready</Text>
                    </View>
                    <View style={[styles.statPill, { backgroundColor: colors.muted }]}>
                      <Feather name="lock" size={13} color={colors.warning} />
                      <Text style={[styles.statPillText, { color: colors.text }]}>{blockedCount} Blocked</Text>
                    </View>
                    <View style={[styles.statPill, { backgroundColor: colors.muted }]}>
                      <Feather name="check-circle" size={13} color={colors.success} />
                      <Text style={[styles.statPillText, { color: colors.text }]}>{completedCount} Done</Text>
                    </View>
                  </View>

                  <View style={[styles.cardBottom, { borderTopColor: colors.border }]}>
                    <View style={{ flexDirection: 'row', gap: 8, flex: 1, flexWrap: 'wrap' }}>
                      <PrimaryButton
                        label="Open Roadmap"
                        icon="arrow-up-right"
                        onPress={() => {
                          switchAgent(ag.id);
                          router.push(`/agent/${ag.id}`);
                        }}
                      />
                      {uncertainCount > 0 && (
                        <Pressable
                          onPress={() => {
                            switchAgent(ag.id);
                            router.push(`/review/${ag.id}`);
                          }}
                          style={[styles.reviewBtn, { backgroundColor: colors.muted, borderColor: colors.border }]}
                        >
                          <Feather name="file-text" size={15} color={colors.text} />
                          <Text style={[styles.reviewBtnText, { color: colors.text }]} numberOfLines={1}>Review Claims</Text>
                        </Pressable>
                      )}
                    </View>
                    <Pressable
                      accessibilityLabel="Delete Agent"
                      onPress={() => handleDeleteAgent(ag.id, ag.title)}
                      style={[styles.trashBtn, { backgroundColor: `${colors.destructive}22`, borderColor: `${colors.destructive}55` }]}
                    >
                      <Feather name="trash-2" size={17} color={colors.destructive} />
                    </Pressable>
                  </View>
                </GlassCard>
              );
            })}
          </>
        )}

        {/* How ActionLayer Works */}
        <SectionHeader title="How ActionLayer Works" />
        <GlassCard style={{ padding: 6, overflow: 'hidden' }}>
          {[
            ['01', 'Capture', 'Upload an image poster, PDF, or text.'],
            ['02', 'Extract', 'AI parses requirements, deadlines, and facts.'],
            ['03', 'Review', 'Confirm facts and review requirements.'],
            ['04', 'Plan', 'Automatically plan tasks and dependencies.'],
            ['05', 'Verify', 'Attach evidence to ensure readiness.'],
          ].map(([number, title, detail], idx) => (
            <View
              key={number}
              style={[
                styles.step,
                idx < 4 && { borderBottomWidth: 1, borderBottomColor: colors.border },
              ]}
            >
              <Text style={[styles.stepNumber, { color: colors.mutedForeground }]}>{number}</Text>
              <View style={styles.stepCopy}>
                <Text style={[styles.stepTitle, { color: colors.text }]}>{title}</Text>
                <Text style={[styles.stepDetail, { color: colors.mutedForeground }]}>{detail}</Text>
              </View>
            </View>
          ))}
        </GlassCard>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'transparent' },
  content: { paddingHorizontal: 20, gap: 16 },
  headerRow: { gap: 3 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 28, letterSpacing: -0.6, marginTop: 4 },
  headerSub: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19 },

  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
  },
  createIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createText: { fontFamily: 'Inter_700Bold', fontSize: 15 },
  createSub: { fontFamily: 'Inter_400Regular', fontSize: 12 },

  emptyText: { fontFamily: 'Inter_500Medium', fontSize: 14, textAlign: 'center' },

  filters: { flexDirection: 'row', gap: 8 },
  filter: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    backdropFilter: 'blur(16px)',
  } as any,
  filterActive: {
  },
  filterInactive: {
  },
  filterText: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },

  card: { padding: 16, gap: 12 },
  cardActive: {
    boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.30), 0 8px 32px rgba(0, 0, 0, 0.50)',
  } as any,
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badgeGroup: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  icon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  cardTitle: { fontFamily: 'Inter_700Bold', fontSize: 18, letterSpacing: -0.3 },
  cardSub: { fontFamily: 'Inter_400Regular', fontSize: 12 },

  taskStatsRow: { flexDirection: 'row', gap: 10 },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statPillText: { fontFamily: 'Inter_500Medium', fontSize: 12 },

  cardBottom: {
    borderTopWidth: 1,
    paddingTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  reviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  reviewBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },

  trashBtn: {
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  step: { flexDirection: 'row', gap: 14, padding: 12 },
  stepBorder: { borderBottomWidth: 1 },
  stepNumber: { fontFamily: 'Inter_700Bold', fontSize: 13, width: 24 },
  stepCopy: { flex: 1, gap: 2 },
  stepTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  stepDetail: { fontFamily: 'Inter_400Regular', fontSize: 12 },
});