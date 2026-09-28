import { Feather } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View, Platform, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import { getProgress, getNextAction, useApp, type Task, type ReadinessAuditResult } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import {
  BottomSheet,
  GlassCard,
  PrimaryButton,
  ProgressBar,
  SecondaryButton,
  SectionHeader,
  StatusBadge,
  TextField,
  ui,
} from '@/components/actionlayer-ui';

export default function AgentDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { agent, startTask, completeTask, addEvidence, runAudit } = useApp();
  const [tab, setTab] = useState<'overview' | 'graph' | 'evidence' | 'sources'>('overview');

  if (!agent) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ color: colors.foreground, fontFamily: 'Inter_600SemiBold' }}>Agent not found</Text>
      </View>
    );
  }
  const [detailTask, setDetailTask] = useState<Task | null>(null);
  const [evidenceTask, setEvidenceTask] = useState<Task | null>(null);
  const [evidenceLabel, setEvidenceLabel] = useState('');
  const [evidenceExplanation, setEvidenceExplanation] = useState('');
  const [evidenceLevel, setEvidenceLevel] = useState<1 | 2 | 3>(2);
  const [auditResult, setAuditResult] = useState<ReadinessAuditResult | null>(null);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [evidenceFile, setEvidenceFile] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);

  const progress = getProgress(agent);

  const handleOpenAudit = () => {
    const result = runAudit();
    setAuditResult(result);
    setShowAuditModal(true);
  };

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setEvidenceFile(result.assets[0]);
        setEvidenceLevel(3); // Default to AI-assisted assessment if file attached
      }
    } catch (err) {
      console.warn('Failed to pick file:', err);
    }
  };

  const handleAttachEvidence = async () => {
    if (!evidenceTask) return;

    if (!evidenceFile) {
      if (evidenceLabel.trim() && evidenceExplanation.trim()) {
        addEvidence(evidenceTask.id, evidenceLabel, evidenceExplanation, evidenceLevel);
        setEvidenceLabel('');
        setEvidenceExplanation('');
        setEvidenceTask(null);
      }
      return;
    }

    try {
      setIsUploading(true);
      const formData = new FormData();
      
      if (Platform.OS === 'web') {
        const response = await fetch(evidenceFile.uri);
        const blob = await response.blob();
        formData.append('file', blob, evidenceFile.name || 'upload');
      } else {
        formData.append('file', {
          uri: evidenceFile.uri,
          name: evidenceFile.name,
          type: evidenceFile.mimeType || 'application/octet-stream',
        } as any);
      }

      formData.append('evidenceType', evidenceFile.mimeType?.startsWith('image/') ? 'image' : 'pdf');
      formData.append('textValue', evidenceLabel);
      formData.append('userExplanation', evidenceExplanation);

      const res = await fetch(`http://localhost:5001/api/v1/tasks/${evidenceTask.id}/evidence`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Upload failed');
      const { verification } = await res.json();
      
      addEvidence(evidenceTask.id, evidenceLabel || evidenceFile.name, evidenceExplanation, (verification.verificationLevel ?? 3) as (1 | 2 | 3), verification);

      setEvidenceFile(null);
      setEvidenceLabel('');
      setEvidenceExplanation('');
      setEvidenceTask(null);
    } catch (err) {
      console.warn(err);
      alert('Failed to upload evidence');
    } finally {
      setIsUploading(false);
    }
  };

  const [editTaskState, setEditTaskState] = useState<Task | null>(null);
  const [editTaskTitle, setEditTaskTitle] = useState('');
  const [editTaskDesc, setEditTaskDesc] = useState('');
  const { editTask: editTaskAction } = useApp();

  const handleEditTaskSave = () => {
    if (editTaskState && editTaskTitle.trim()) {
      editTaskAction(editTaskState.id, editTaskTitle, editTaskDesc);
      setEditTaskState(null);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 12, paddingBottom: 110 }]}
        showsVerticalScrollIndicator={false}
      >
        <Pressable accessibilityLabel="Go back to agents" onPress={() => router.push('/(tabs)/agents')} style={styles.back}>
          <Feather name="arrow-left" size={21} color={colors.foreground} />
          <Text style={[ui.captionStrong, { color: colors.foreground }]}>Workflows</Text>
        </Pressable>

        <View style={styles.hero}>
          <View style={[styles.heroIcon, { backgroundColor: colors.secondary }]}>
            <Feather name="award" size={24} color={colors.primary} />
          </View>
          <View style={styles.heroBadgeRow}>
            <StatusBadge label={agent.type ? agent.type + ' Agent' : 'Agent'} tone="info" />
            <StatusBadge label="Live Roadmap" tone="success" />
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>{agent.title}</Text>
          <Text style={[ui.body, { color: colors.mutedForeground, textAlign: 'left' }]}>
            {agent.organizer} · Source: {agent.sourceLabel}
          </Text>
        </View>

        {/* Tab switcher */}
        <View style={styles.tabs}>
          {(['overview', 'graph', 'evidence', 'sources'] as const).map((item) => (
            <Pressable
              key={item}
              accessibilityRole="tab"
              onPress={() => setTab(item)}
              style={[styles.tab, { borderBottomColor: tab === item ? colors.primary : colors.border }]}
            >
              <Text style={[ui.captionStrong, { color: tab === item ? colors.primary : colors.mutedForeground }]}>
                {item === 'graph' ? 'Graph (DAG)' : item[0].toUpperCase() + item.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>

        {tab === 'overview' && (
          <OverviewTab
            agent={agent}
            progress={progress}
            onOpenAudit={handleOpenAudit}
            onNavigateGraph={() => setTab('graph')}
            onStartTask={startTask}
            onCompleteTask={completeTask}
          />
        )}

        {tab === 'graph' && (
          <GraphTab
            agent={agent}
            onStart={startTask}
            onComplete={completeTask}
            onEvidence={(task) => setEvidenceTask(task)}
            onSelectTask={(task) => setDetailTask(task)}
            onEdit={(task) => {
              setEditTaskState(task);
              setEditTaskTitle(task.title);
              setEditTaskDesc(task.description);
            }}
          />
        )}

        {tab === 'evidence' && (
          <EvidenceTab
            agent={agent}
            onAdd={(task) => setEvidenceTask(task)}
          />
        )}

        {tab === 'sources' && (
          <SourcesTab
            agent={agent}
            onReview={() => router.push(`/review/${agent.id}`)}
          />
        )}
      </ScrollView>

      {/* Attach Evidence BottomSheet */}
      <BottomSheet
        visible={Boolean(evidenceTask)}
        title={`Attach Evidence for "${evidenceTask?.title.slice(0, 26)}..."`}
        onClose={() => setEvidenceTask(null)}
      >
        {evidenceTask && (
          <>
            <Text style={[ui.caption, { color: colors.mutedForeground }]}>
              Evidence is evaluated against explicit requirements. Select the verification level appropriate for this artifact.
            </Text>

            <TextField
              label="Artifact Label or Name"
              value={evidenceLabel}
              onChangeText={setEvidenceLabel}
              placeholder="e.g. GitHub Repository URL / Concept PDF"
            />

            <TextField
              label="Verification Explanation"
              value={evidenceExplanation}
              onChangeText={setEvidenceExplanation}
              placeholder="Explain how this artifact satisfies the requirement…"
              multiline
            />

            <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Attached Document</Text>
            {evidenceFile ? (
              <View style={[styles.filePreview, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
                <Feather name="file" size={20} color={colors.primary} />
                <Text style={{ flex: 1, color: colors.foreground }} numberOfLines={1}>{evidenceFile.name}</Text>
                <Pressable onPress={() => setEvidenceFile(null)}>
                  <Feather name="x" size={18} color={colors.mutedForeground} />
                </Pressable>
              </View>
            ) : (
              <Pressable
                onPress={handlePickFile}
                style={[styles.uploadBox, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <Feather name="upload-cloud" size={24} color={colors.primary} />
                <Text style={{ color: colors.primary, fontFamily: 'Inter_600SemiBold', marginTop: 8 }}>
                  Tap to upload Image or PDF
                </Text>
                <Text style={[ui.caption, { color: colors.mutedForeground, marginTop: 4 }]}>
                  Required for Level 3 AI Verification
                </Text>
              </Pressable>
            )}

            <Text style={[styles.fieldLabel, { color: colors.foreground, marginTop: 10 }]}>Verification Method</Text>
            <View style={styles.levelSelector}>
              <Pressable
                onPress={() => setEvidenceLevel(1)}
                style={[
                  styles.levelOption,
                  {
                    backgroundColor: evidenceLevel === 1 ? colors.secondary : colors.card,
                    borderColor: evidenceLevel === 1 ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text style={[styles.levelTitle, { color: colors.foreground }]}>Level 1: User Declaration</Text>
                <Text style={[ui.caption, { color: colors.mutedForeground }]}>Self-confirmed completion</Text>
              </Pressable>

              <Pressable
                onPress={() => setEvidenceLevel(2)}
                style={[
                  styles.levelOption,
                  {
                    backgroundColor: evidenceLevel === 2 ? colors.secondary : colors.card,
                    borderColor: evidenceLevel === 2 ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text style={[styles.levelTitle, { color: colors.foreground }]}>Level 2: Evidence Attached</Text>
                <Text style={[ui.caption, { color: colors.mutedForeground }]}>Artifact presence verified</Text>
              </Pressable>

              <Pressable
                onPress={() => setEvidenceLevel(3)}
                style={[
                  styles.levelOption,
                  {
                    backgroundColor: evidenceLevel === 3 ? colors.secondary : colors.card,
                    borderColor: evidenceLevel === 3 ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text style={[styles.levelTitle, { color: colors.foreground }]}>Level 3: AI-Assisted Assessment</Text>
                <Text style={[ui.caption, { color: colors.mutedForeground }]}>Gemini rubric evaluation</Text>
              </Pressable>
            </View>

            <View style={{ marginTop: 12, gap: 8 }}>
              {isUploading ? (
                <View style={{ padding: 14, backgroundColor: colors.primary, borderRadius: 12, alignItems: 'center' }}>
                  <ActivityIndicator color="#FFF" />
                </View>
              ) : (
                <PrimaryButton
                  label="Attach Evidence"
                  disabled={(!evidenceFile && (evidenceLabel.trim().length < 3 || evidenceExplanation.trim().length < 5))}
                  onPress={handleAttachEvidence}
                />
              )}
            </View>
            <SecondaryButton label="Cancel" onPress={() => setEvidenceTask(null)} />
          </>
        )}
      </BottomSheet>

      {/* Edit Task BottomSheet */}
      <BottomSheet
        visible={Boolean(editTaskState)}
        title="Edit Task"
        onClose={() => setEditTaskState(null)}
      >
        {editTaskState && (
          <View style={{ gap: 12 }}>
            <TextField
              label="Task Title"
              value={editTaskTitle}
              onChangeText={setEditTaskTitle}
            />
            <TextField
              label="Task Description"
              value={editTaskDesc}
              onChangeText={setEditTaskDesc}
              multiline
            />
            <PrimaryButton
              label="Save Changes"
              icon="check"
              disabled={!editTaskTitle.trim()}
              onPress={handleEditTaskSave}
            />
            <SecondaryButton
              label="Cancel"
              onPress={() => setEditTaskState(null)}
            />
          </View>
        )}
      </BottomSheet>

      {/* Directive Section 16: Task Detail BottomSheet */}
      <BottomSheet
        visible={Boolean(detailTask)}
        title={detailTask?.title ?? 'Task Details'}
        onClose={() => setDetailTask(null)}
      >
        {detailTask && (
          <View style={styles.detailSheetContent}>
            <View style={styles.detailRow}>
              <Text style={[ui.caption, { color: colors.mutedForeground }]}>Status</Text>
              <StatusBadge
                label={
                  detailTask.status === 'blocked'
                    ? 'Blocked'
                    : detailTask.status === 'completed_by_user' || detailTask.status === 'verified'
                    ? 'Completed'
                    : detailTask.status === 'in_progress'
                    ? 'In Progress'
                    : 'Ready'
                }
                tone={
                  detailTask.status === 'blocked'
                    ? 'warning'
                    : detailTask.status === 'completed_by_user' || detailTask.status === 'verified'
                    ? 'success'
                    : 'info'
                }
              />
            </View>
            <View style={styles.detailRow}>
              <Text style={[ui.caption, { color: colors.mutedForeground }]}>Milestone</Text>
              <Text style={[ui.captionStrong, { color: colors.foreground }]}>{detailTask.category}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={[ui.caption, { color: colors.mutedForeground }]}>Estimated Effort</Text>
              <Text style={[ui.captionStrong, { color: colors.foreground }]}>{detailTask.estimatedMinutes} minutes</Text>
            </View>

            <Text style={[styles.detailSectionTitle, { color: colors.foreground }]}>Objective</Text>
            <Text style={[ui.body, { color: colors.foreground, textAlign: 'left' }]}>{detailTask.description}</Text>

            <Text style={[styles.detailSectionTitle, { color: colors.foreground }]}>Completion Condition</Text>
            <Text style={[ui.caption, { color: colors.mutedForeground }]}>{detailTask.completionCondition}</Text>

            {detailTask.dependencyIds.length > 0 && (
              <View style={[styles.detailDepBox, { backgroundColor: colors.secondary }]}>
                <Text style={[ui.captionStrong, { color: colors.primary }]}>
                  Prerequisites ({detailTask.dependencyIds.length})
                </Text>
                {detailTask.dependencyIds.map((depId) => {
                  const prereq = agent.tasks.find((t) => t.id === depId);
                  const isDone = prereq?.status === 'completed_by_user' || prereq?.status === 'verified';
                  return (
                    <View key={depId} style={styles.detailDepRow}>
                      <Feather name={isDone ? 'check-circle' : 'lock'} size={14} color={isDone ? colors.success : colors.warning} />
                      <Text style={[ui.caption, { color: colors.foreground, flex: 1 }]}>{prereq?.title || depId}</Text>
                    </View>
                  );
                })}
              </View>
            )}

            <View style={styles.detailActions}>
              {detailTask.status === 'ready' && (
                <PrimaryButton
                  label="Start Task"
                  icon="play"
                  onPress={() => {
                    startTask(detailTask.id);
                    setDetailTask(null);
                  }}
                />
              )}
              {detailTask.status === 'in_progress' && (
                <>
                  <PrimaryButton
                    label="Complete & Unblock Next Tasks"
                    icon="check"
                    onPress={() => {
                      completeTask(detailTask.id);
                      setDetailTask(null);
                    }}
                  />
                  {detailTask.evidenceRequired && (
                    <SecondaryButton
                      label="Attach Evidence"
                      icon="paperclip"
                      onPress={() => {
                        const target = detailTask;
                        setDetailTask(null);
                        setEvidenceTask(target);
                      }}
                    />
                  )}
                </>
              )}
              {detailTask.status === 'blocked' && (
                <View style={[styles.blockedNotice, { padding: 12, borderRadius: 10 }]}>
                  <Feather name="alert-triangle" size={16} color={colors.warning} />
                  <Text style={[ui.captionStrong, { color: colors.warning }]}>
                    Blocked: Complete all upstream prerequisites first.
                  </Text>
                </View>
              )}
              <SecondaryButton label="Close" onPress={() => setDetailTask(null)} />
            </View>
          </View>
        )}
      </BottomSheet>

      {/* Four-Part Readiness Audit Modal */}
      <Modal visible={showAuditModal} transparent animationType="slide" onRequestClose={() => setShowAuditModal(false)}>
        <View style={styles.auditModalOverlay}>
          <GlassCard style={styles.auditCard}>
            <View style={styles.auditHeader}>
              <View style={styles.auditHeaderLeft}>
                <Feather name="shield" size={22} color={colors.primary} />
                <Text style={[styles.auditTitle, { color: colors.foreground }]}>
                  Four-Factor Readiness Audit
                </Text>
              </View>
              <Pressable onPress={() => setShowAuditModal(false)} accessibilityLabel="Close audit">
                <Feather name="x" size={22} color={colors.foreground} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.auditContent}>
              {/* Factor 1: Requirements Completion */}
              <View style={[styles.auditFactor, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.factorTop}>
                  <Text style={[styles.factorLabel, { color: colors.foreground }]}>1. Requirements Completion</Text>
                  <Text style={[styles.factorValue, { color: colors.primary }]}>
                    {auditResult?.requirementsCompletionPct}%
                  </Text>
                </View>
                <ProgressBar
                  value={auditResult?.requirementsCompletionPct ?? 0}
                  label={`${auditResult?.readyTasks.length ?? 0} of ${agent.tasks.length} tasks satisfied`}
                />
              </View>

              {/* Factor 2: Evidence Readiness */}
              <View style={[styles.auditFactor, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.factorTop}>
                  <Text style={[styles.factorLabel, { color: colors.foreground }]}>2. Evidence Readiness</Text>
                  <Text style={[styles.factorValue, { color: colors.success }]}>
                    {auditResult?.evidenceReadinessPct}%
                  </Text>
                </View>
                <Text style={[ui.caption, { color: colors.mutedForeground }]}>
                  Compares required evidence items against attached and verified artifacts.
                </Text>
              </View>

              {/* Factor 3: Source Confidence */}
              <View style={[styles.auditFactor, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.factorTop}>
                  <Text style={[styles.factorLabel, { color: colors.foreground }]}>3. Source Confidence</Text>
                  <StatusBadge
                    label={auditResult?.sourceConfidenceLevel ?? 'Medium'}
                    tone={auditResult?.sourceConfidenceLevel === 'High' ? 'success' : 'warning'}
                  />
                </View>
                <Text style={[ui.caption, { color: colors.mutedForeground }]}>
                  {auditResult?.uncertainClaims.length === 0
                    ? 'All extracted claims confirmed against original source material.'
                    : `${auditResult?.uncertainClaims.length} claim(s) still require source excerpt review.`}
                </Text>
              </View>

              {/* Factor 4: Deadline Risk */}
              <View style={[styles.auditFactor, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.factorTop}>
                  <Text style={[styles.factorLabel, { color: colors.foreground }]}>4. Deadline Risk</Text>
                  <StatusBadge
                    label={auditResult?.deadlineRiskLevel ?? 'Medium'}
                    tone={
                      auditResult?.deadlineRiskLevel === 'Low'
                        ? 'success'
                        : auditResult?.deadlineRiskLevel === 'Medium'
                          ? 'warning'
                          : 'risk'
                    }
                  />
                </View>
                {auditResult?.riskReasons.map((reason, index) => (
                  <View key={index} style={styles.reasonRow}>
                    <Feather name="alert-circle" size={13} color={colors.warning} />
                    <Text style={[ui.caption, { color: colors.foreground, flex: 1 }]}>{reason}</Text>
                  </View>
                ))}
              </View>

              {/* Remaining Missing Items */}
              <SectionHeader title="Exact Remaining Items" />
              {auditResult?.remainingMissingItems.length === 0 ? (
                <View style={[styles.completeBanner, { backgroundColor: colors.success + '20' }]}>
                  <Feather name="check-circle" size={16} color={colors.success} />
                  <Text style={[ui.captionStrong, { color: colors.success }]}>
                    All competition requirements and evidence are ready for submission!
                  </Text>
                </View>
              ) : (
                auditResult?.remainingMissingItems.map((item, idx) => (
                  <View key={idx} style={[styles.missingRow, { borderBottomColor: colors.border }]}>
                    <Feather name="circle" size={14} color={colors.mutedForeground} />
                    <Text style={[styles.missingText, { color: colors.foreground }]}>{item}</Text>
                  </View>
                ))
              )}

              <PrimaryButton
                label="Close Audit"
                icon="check"
                onPress={() => setShowAuditModal(false)}
              />
            </ScrollView>
          </GlassCard>
        </View>
      </Modal>
    </View>
  );
}

function OverviewTab({
  agent,
  progress,
  onOpenAudit,
  onNavigateGraph,
  onStartTask,
  onCompleteTask,
}: {
  agent: import('@/context/AppContext').Agent;
  progress: number;
  onOpenAudit: () => void;
  onNavigateGraph: () => void;
  onStartTask: (id: string) => void;
  onCompleteTask: (id: string) => void;
}) {
  const colors = useColors();
  const next = getNextAction(agent);
  const nextIsBlocked = Boolean(next.blockedTask);
  const blockedCount = agent.tasks.filter((t) => t.status === 'blocked').length;
  const uncertainCount = agent.claims.filter(
    (c) => !c.reviewed
  ).length;

  const targetDate = new Date(agent.targetDeadline || new Date().toISOString());
  const isValidDate = !isNaN(targetDate.getTime());
  const formattedDate = isValidDate 
    ? new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(targetDate)
    : 'Unknown Date';
  const formattedTime = isValidDate
    ? new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric' }).format(targetDate)
    : '';
  
  const diffDays = isValidDate ? Math.ceil((targetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0;
  const daysRemaining = Math.max(0, diffDays);

  return (
    <View style={styles.section}>
      {/* Deadline and Countdown Card */}
      <View style={styles.overviewHeader}>
        <View>
          <Text style={[ui.caption, { color: colors.mutedForeground }]}>Target Submission Deadline</Text>
          <Text style={[styles.deadline, { color: colors.foreground }]}>{formattedDate}</Text>
          <Text style={[ui.caption, { color: colors.warning }]}>{formattedTime} · {daysRemaining} days remaining</Text>
        </View>
        <View style={[styles.countdown, { backgroundColor: colors.secondary }]}>
          <Text style={[styles.countdownNumber, { color: colors.primary }]}>{daysRemaining}</Text>
          <Text style={[ui.captionStrong, { color: colors.primary }]}>DAYS</Text>
        </View>
      </View>

      {/* Progress */}
      <ProgressBar value={progress} label="Requirements completion" />

      {/* 3 Overview Indicator Cards */}
      <View style={styles.indicators}>
        <View style={[styles.indicatorCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.indicatorValue, { color: colors.success }]}>
            {Math.round((agent.evidence.length / agent.tasks.filter((t) => t.evidenceRequired).length) * 100)}%
          </Text>
          <Text style={[ui.caption, { color: colors.mutedForeground }]}>Evidence</Text>
        </View>
        <View style={[styles.indicatorCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.indicatorValue, { color: uncertainCount > 0 ? colors.warning : colors.success }]}>
            {uncertainCount > 0 ? 'Review' : 'High'}
          </Text>
          <Text style={[ui.caption, { color: colors.mutedForeground }]}>Source Trust</Text>
        </View>
        <View style={[styles.indicatorCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.indicatorValue, { color: blockedCount > 0 ? colors.warning : colors.success }]}>
            {blockedCount > 0 ? 'Medium' : 'Low'}
          </Text>
          <Text style={[ui.caption, { color: colors.mutedForeground }]}>Risk</Text>
        </View>
      </View>

      {/* Next Action Callout */}
      <View style={[styles.nextActionCallout, { backgroundColor: colors.primary }]}>
        <View style={styles.nextActionTop}>
          <Text style={[ui.captionStrong, { color: colors.primaryForeground, opacity: 0.9 }]}>NEXT RECOMMENDED ACTION</Text>
          <StatusBadge
            label={nextIsBlocked ? 'Prerequisite Required' : 'Ready to Start'}
            tone={nextIsBlocked ? 'warning' : 'info'}
          />
        </View>
        <Text style={[styles.nextActionTitle, { color: colors.primaryForeground }]}>{next.task.title}</Text>
        <Text style={[styles.nextActionDesc, { color: colors.primaryForeground, opacity: 0.85 }]}>
          {nextIsBlocked
            ? `Complete "${next.task.title}" to automatically unblock "${next.blockedTask?.title}".`
            : next.task.description}
        </Text>
        <View style={styles.nextActionButtons}>
          <PrimaryButton
            label={next.task.status === 'in_progress' ? 'Mark Prerequisite Complete' : 'Start Prerequisite'}
            icon="arrow-right"
            onPress={() => {
              if (next.task.status === 'in_progress') {
                onCompleteTask(next.task.id);
              } else {
                onStartTask(next.task.id);
              }
            }}
          />
        </View>
      </View>

      {/* Button to run 4-factor audit */}
      <PrimaryButton
        label="Run Four-Factor Readiness Audit"
        icon="shield"
        onPress={onOpenAudit}
      />

      {/* Blockers summary */}
      <SectionHeader title="Requirement Graph Status" action="View DAG" onAction={onNavigateGraph} />
      <View style={[styles.blockersCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.blockersHeader}>
          <Feather
            name={blockedCount > 0 ? 'alert-triangle' : 'check-circle'}
            size={18}
            color={blockedCount > 0 ? colors.warning : colors.success}
          />
          <Text style={[styles.blockersTitle, { color: colors.foreground }]}>
            {blockedCount > 0
              ? `${blockedCount} task(s) currently blocked by dependencies`
              : 'All prerequisite dependencies satisfied!'}
          </Text>
        </View>
        {blockedCount > 0 && (
          <Text style={[ui.caption, { color: colors.mutedForeground }]}>
            Completing upstream tasks will automatically unblock downstream requirements.
          </Text>
        )}
      </View>
    </View>
  );
}

function GraphTab({
  agent,
  onStart,
  onComplete,
  onEvidence,
  onSelectTask,
  onEdit,
}: {
  agent: import('@/context/AppContext').Agent;
  onStart: (id: string) => void;
  onComplete: (id: string) => void;
  onEvidence: (task: Task) => void;
  onSelectTask: (task: Task) => void;
  onEdit: (task: Task) => void;
}) {
  const colors = useColors();
  const [filter, setFilter] = useState<'all' | 'ready' | 'blocked' | 'in_progress' | 'complete'>('all');
  const next = getNextAction(agent);
  const nextIsBlocked = Boolean(next.blockedTask);

  const milestones = [
    { title: 'Eligibility', category: 'Eligibility' },
    { title: 'Conflicts', category: 'Conflicts' },
    { title: 'Foundation', category: 'Foundation' },
    { title: 'Proposal', category: 'Proposal' },
    { title: 'Build', category: 'Build' },
    { title: 'Presentation', category: 'Presentation' },
    { title: 'Submission', category: 'Submission' },
  ].map((ms) => {
    const tasks = agent.tasks.filter((t) => t.category.toLowerCase() === ms.category.toLowerCase());
    const minSeq = tasks.length > 0 ? Math.min(...tasks.map(t => t.sequenceNumber || 999)) : 999;
    return { ...ms, minSeq };
  }).sort((a, b) => a.minSeq - b.minSeq);

  const filteredTasks = agent.tasks.filter((t) => {
    if (filter === 'all') return true;
    if (filter === 'ready') return t.status === 'ready';
    if (filter === 'blocked') return t.status === 'blocked';
    if (filter === 'in_progress') return t.status === 'in_progress';
    if (filter === 'complete') return t.status === 'completed_by_user' || t.status === 'verified';
    return true;
  });

  return (
    <View style={styles.section}>
      <SectionHeader title={`Requirement Graph (${agent.tasks.length} Tasks)`} />
      <Text style={[ui.caption, { color: colors.mutedForeground }]}>
        Deterministic DAG solver: a task remains strictly blocked until all required prerequisites reach a verified or completed state.
      </Text>

      {/* Filter pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
        {(['all', 'ready', 'blocked', 'in_progress', 'complete'] as const).map((f) => (
          <Pressable
            key={f}
            onPress={() => setFilter(f)}
            style={[
              styles.filterPill,
              {
                backgroundColor: filter === f ? colors.primary : colors.card,
                borderColor: filter === f ? colors.primary : colors.border,
              },
            ]}
          >
            <Text
              style={[
                ui.captionStrong,
                { color: filter === f ? '#FFFFFF' : colors.mutedForeground, textTransform: 'capitalize' },
              ]}
            >
              {f === 'in_progress' ? 'In Progress' : f}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Render tasks grouped by Milestones */}
      {[
        ...milestones,
        { title: 'Other Tasks', category: 'Other' } // Append fallback milestone
      ].map((milestone) => {
        let milestoneTasks;
        
        if (milestone.category === 'Other') {
          // Find tasks that do not match any defined milestone
          milestoneTasks = filteredTasks.filter(
            (t) => !milestones.some((m) => m.category.toLowerCase() === t.category.toLowerCase())
          );
        } else {
          // Standard mapping
          milestoneTasks = filteredTasks.filter(
            (t) => t.category.toLowerCase() === milestone.category.toLowerCase()
          );
        }

        if (milestoneTasks.length === 0) return null;

        return (
          <View key={milestone.category} style={styles.milestoneBlock}>
            <View style={styles.milestoneHeader}>
              <View style={[styles.milestoneDot, { backgroundColor: colors.primary }]} />
              <Text style={[styles.milestoneTitle, { color: colors.foreground }]}>{milestone.title.toUpperCase()}</Text>
            </View>

            {milestoneTasks.map((task, index) => {
              const isCompleted = task.status === 'completed_by_user' || task.status === 'verified';
              const isBlocked = task.status === 'blocked';
              const isInProgress = task.status === 'in_progress';
              const prereqTasks = task.dependencyIds
                .map((id) => agent.tasks.find((t) => t.id === id))
                .filter(Boolean) as Task[];

              return (
                <Pressable
                  key={task.id}
                  onPress={() => onSelectTask(task)}
                  style={[
                    styles.graphCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: isBlocked ? colors.warning : isCompleted ? colors.success : colors.border,
                    },
                  ]}
                >
                  {/* Task header row */}
                  <View style={styles.taskHeader}>
                    <View style={[styles.sequenceBadge, { backgroundColor: isCompleted ? colors.success : colors.secondary }]}>
                      <Text style={[ui.captionStrong, { color: isCompleted ? '#FFFFFF' : colors.primary }]}>
                        {isCompleted ? '✓' : String(task.sequenceNumber ?? index + 1).padStart(2, '0')}
                      </Text>
                    </View>

                    <View style={styles.taskHeaderCopy}>
                      <Text style={[styles.taskTitle, { color: colors.foreground }]}>{task.title}</Text>
                      <Text style={[ui.caption, { color: colors.mutedForeground }]}>
                        {task.category} · {task.estimatedMinutes} min · {task.priority.toUpperCase()} Priority
                      </Text>
                    </View>

                    <StatusBadge
                      label={isBlocked ? 'Blocked' : isCompleted ? 'Completed' : isInProgress ? 'In Progress' : 'Ready'}
                      tone={isBlocked ? 'warning' : isCompleted ? 'success' : isInProgress ? 'info' : 'neutral'}
                    />
                  </View>

                  {/* Description */}
                  <Text style={[styles.taskDesc, { color: colors.foreground }]}>{task.description}</Text>

                  {/* Dependency information */}
                  {task.dependencyIds.length > 0 && (
                    <View style={[styles.prereqBox, { backgroundColor: isBlocked ? colors.warning + '20' : colors.secondary }]}>
                      <Feather
                        name={isBlocked ? 'lock' : 'unlock'}
                        size={14}
                        color={isBlocked ? colors.warning : colors.primary}
                      />
                      <Text style={[ui.caption, { color: colors.foreground, flex: 1 }]}>
                        {isBlocked ? 'Prerequisite required: ' : 'Prerequisites satisfied: '}
                        {prereqTasks.map((p) => `"${p.title}"`).join(', ')}
                      </Text>
                    </View>
                  )}

                  {/* Interactive action buttons */}
                  <View style={[styles.taskActions, { borderTopColor: colors.border }]}>
                    {task.evidenceRequired && (
                      <Pressable onPress={() => onEvidence(task)} style={styles.actionBtn}>
                        <Feather name="paperclip" size={15} color={colors.primary} />
                        <Text style={[ui.captionStrong, { color: colors.primary }]}>
                          {task.evidenceId ? 'Update Evidence' : 'Attach Evidence'}
                        </Text>
                      </Pressable>
                    )}

                    <Pressable onPress={() => onEdit(task)} style={styles.actionBtn}>
                      <Feather name="edit-2" size={15} color={colors.primary} />
                      <Text style={[ui.captionStrong, { color: colors.primary }]}>Edit</Text>
                    </Pressable>

                    {!isCompleted && !isBlocked && (
                      <Pressable
                        onPress={() => (isInProgress ? onComplete(task.id) : onStart(task.id))}
                        style={styles.actionBtn}
                      >
                        <Feather name={isInProgress ? 'check-circle' : 'play'} size={15} color={colors.success} />
                        <Text style={[ui.captionStrong, { color: colors.success }]}>
                          {isInProgress ? 'Mark Complete' : 'Start Task'}
                        </Text>
                      </Pressable>
                    )}

                    {isBlocked && (
                      <View style={styles.blockedNotice}>
                        <Feather name="alert-circle" size={14} color={colors.warning} />
                        <Text style={[ui.caption, { color: colors.warning }]}>Complete upstream task first</Text>
                      </View>
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
        );
      })}

      {/* Persistent Next Action bar below graph */}
      <View style={[styles.nextActionCallout, { backgroundColor: colors.primary, marginTop: 16 }]}>
        <View style={styles.nextActionTop}>
          <Text style={[ui.captionStrong, { color: colors.primaryForeground, opacity: 0.9 }]}>NEXT RECOMMENDED ACTION</Text>
          <StatusBadge
            label={nextIsBlocked ? 'Prerequisite Required' : 'Ready to Start'}
            tone={nextIsBlocked ? 'warning' : 'info'}
          />
        </View>
        <Text style={[styles.nextActionTitle, { color: colors.primaryForeground }]}>{next.task.title}</Text>
        <Text style={[styles.nextActionDesc, { color: colors.primaryForeground, opacity: 0.85 }]}>
          {nextIsBlocked
            ? `Complete "${next.task.title}" to automatically unblock "${next.blockedTask?.title}".`
            : next.task.description}
        </Text>
        <PrimaryButton
          label={next.task.status === 'in_progress' ? 'Mark Complete' : nextIsBlocked ? 'Start Prerequisite' : 'Start Task'}
          icon="arrow-right"
          onPress={() => {
            if (next.task.status === 'in_progress') {
              onComplete(next.task.id);
            } else {
              onStart(next.task.id);
            }
          }}
        />
      </View>
    </View>
  );
}

function EvidenceTab({
  agent,
  onAdd,
}: {
  agent: import('@/context/AppContext').Agent;
  onAdd: (task: Task) => void;
}) {
  const colors = useColors();

  return (
    <View style={styles.section}>
      <SectionHeader title="Attached Evidence & Verifications" />
      <Text style={[ui.caption, { color: colors.mutedForeground }]}>
        All evidence artifacts are stored with explicit verification levels (0 to 3). Level 3 is labeled &quot;AI-assisted assessment&quot; and does not claim institutional certification.
      </Text>

      {agent.tasks.map((task) => {
        const evidenceItem = agent.evidence.find((e) => e.taskId === task.id);
        const verification = evidenceItem?.verification;

        return (
          <View
            key={task.id}
            style={[styles.evidenceCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <View style={styles.evidenceTop}>
              <View style={styles.evidenceTitleWrap}>
                <Text style={[styles.taskTitle, { color: colors.foreground }]}>{task.title}</Text>
                <Text style={[ui.caption, { color: colors.mutedForeground }]}>{task.category}</Text>
              </View>

              {verification ? (
                <StatusBadge
                  label={`Level ${verification.level} · ${verification.method}`}
                  tone="success"
                />
              ) : (
                <StatusBadge label="Missing Evidence" tone="risk" />
              )}
            </View>

            {evidenceItem ? (
              <View style={styles.evidenceBody}>
                <Text style={[styles.evidenceLabel, { color: colors.foreground }]}>
                  {evidenceItem.label}
                </Text>
                <Text style={[ui.caption, { color: colors.mutedForeground }]}>
                  {evidenceItem.explanation}
                </Text>

                {verification && (
                  <View style={[styles.verificationDetails, { backgroundColor: colors.secondary }]}>
                    <Text style={[ui.captionStrong, { color: colors.primary }]}>
                      Method: {verification.method} ({verification.modelVersion})
                    </Text>
                    {verification.requirementsMet.map((met, idx) => (
                      <Text key={idx} style={[ui.caption, { color: colors.success }]}>
                        ✓ {met}
                      </Text>
                    ))}
                    {verification.limitations.map((lim, idx) => (
                      <Text key={idx} style={[ui.caption, { color: colors.mutedForeground }]}>
                        ℹ {lim}
                      </Text>
                    ))}
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.missingEvidenceRow}>
                <Text style={[ui.caption, { color: colors.mutedForeground, flex: 1 }]}>
                  No artifact attached yet for this requirement.
                </Text>
                <Pressable onPress={() => onAdd(task)} style={styles.attachBtn}>
                  <Feather name="upload" size={15} color={colors.primary} />
                  <Text style={[ui.captionStrong, { color: colors.primary }]}>Attach</Text>
                </Pressable>
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

function SourcesTab({
  agent,
  onReview,
}: {
  agent: import('@/context/AppContext').Agent;
  onReview: () => void;
}) {
  const colors = useColors();

  return (
    <View style={styles.section}>
      <SectionHeader title="Preserved Source Document" action="Re-review" onAction={onReview} />
      <View style={[styles.sourceCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.sourceTop}>
          <Feather name="file-text" size={24} color={colors.primary} />
          <StatusBadge label="Preserved Locally" tone="success" />
        </View>
        <Text style={[styles.taskTitle, { color: colors.foreground }]}>{agent.sourceLabel}</Text>
        <Text style={[ui.caption, { color: colors.mutedForeground }]}>
          {agent.sourceType} · Protected local storage · SHA-256 computed
        </Text>
      </View>

      <SectionHeader title="Grounded Claims Citations" />
      {agent.claims.map((claim) => (
        <View key={claim.id} style={[styles.claimRow, { borderBottomColor: colors.border }]}>
          <View style={styles.claimCopy}>
            <Text style={[ui.captionStrong, { color: colors.foreground }]}>{claim.field}</Text>
            <Text style={[styles.claimValText, { color: colors.foreground }]}>{claim.value}</Text>
            <Text style={[ui.caption, { color: colors.mutedForeground }]}>
              Excerpt: &quot;{claim.sourceExcerpt}&quot;
            </Text>
          </View>
          <StatusBadge
            label={`${Math.round(claim.confidence * 100)}%`}
            tone={claim.reviewed ? 'success' : 'warning'}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'transparent' },
  content: { paddingHorizontal: 20, gap: 18 },
  back: { flexDirection: 'row', gap: 8, alignItems: 'center', minHeight: 42 },
  hero: { gap: 10 },
  heroIcon: {
    width: 50,
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  heroBadgeRow: { flexDirection: 'row', gap: 8 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 28, lineHeight: 34, letterSpacing: -0.6, color: '#FFFFFF' },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.12)' },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2 },
  section: { gap: 16 },
  overviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  deadline: { fontFamily: 'Inter_700Bold', fontSize: 22, marginTop: 4, color: '#FFFFFF' },
  countdown: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  countdownNumber: { fontFamily: 'Inter_700Bold', fontSize: 30, lineHeight: 32, color: '#FFFFFF' },
  indicators: { flexDirection: 'row', gap: 8 },
  indicatorCard: {
    flex: 1,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    backgroundColor: 'rgba(16, 20, 28, 0.65)',
    backdropFilter: 'blur(20px)',
    gap: 4,
  } as any,
  indicatorValue: { fontFamily: 'Inter_700Bold', fontSize: 18, color: '#FFFFFF' },
  nextActionCallout: {
    borderRadius: 20,
    padding: 18,
    gap: 12,
    backgroundColor: 'rgba(16, 20, 28, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    backdropFilter: 'blur(24px)',
    boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.18), 0 8px 32px rgba(0, 0, 0, 0.40)',
  } as any,
  nextActionTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  nextActionTitle: { color: '#FFFFFF', fontFamily: 'Inter_700Bold', fontSize: 20, letterSpacing: -0.3 },
  nextActionDesc: { color: 'rgba(255, 255, 255, 0.80)', fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 20 },
  nextActionButtons: { marginTop: 4 },
  blockersCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    gap: 6,
    backgroundColor: 'rgba(16, 20, 28, 0.65)',
    borderColor: 'rgba(255, 255, 255, 0.16)',
    backdropFilter: 'blur(20px)',
  } as any,
  blockersHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  blockersTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: '#FFFFFF' },
  graphCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    gap: 12,
    backgroundColor: 'rgba(16, 20, 28, 0.65)',
    borderColor: 'rgba(255, 255, 255, 0.16)',
    backdropFilter: 'blur(20px)',
    boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.14), 0 8px 30px rgba(0, 0, 0, 0.35)',
  } as any,
  taskHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sequenceBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
  },
  taskHeaderCopy: { flex: 1, gap: 2 },
  taskTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 15, lineHeight: 20, color: '#FFFFFF' },
  taskDesc: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 20, color: 'rgba(255, 255, 255, 0.65)' },
  prereqBox: {
    flexDirection: 'row',
    gap: 8,
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  taskActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 16, borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.08)', paddingTop: 10 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 },
  blockedNotice: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  evidenceCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    gap: 10,
    backgroundColor: 'rgba(16, 20, 28, 0.65)',
    borderColor: 'rgba(255, 255, 255, 0.16)',
    backdropFilter: 'blur(20px)',
  } as any,
  evidenceTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  evidenceTitleWrap: { flex: 1, gap: 2 },
  evidenceBody: { gap: 6 },
  evidenceLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: '#FFFFFF' },
  verificationDetails: {
    padding: 12,
    borderRadius: 12,
    gap: 4,
    marginTop: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  missingEvidenceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 4 },
  attachBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.20)',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  sourceCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    gap: 8,
    backgroundColor: 'rgba(16, 20, 28, 0.65)',
    borderColor: 'rgba(255, 255, 255, 0.16)',
    backdropFilter: 'blur(20px)',
  } as any,
  sourceTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  claimRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.08)', gap: 10 },
  claimCopy: { flex: 1, gap: 4 },
  claimValText: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: '#FFFFFF' },
  fieldLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 13, marginTop: 4, color: '#FFFFFF' },
  levelSelector: { gap: 8 },
  levelOption: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderColor: 'rgba(255, 255, 255, 0.14)',
  },
  levelTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: '#FFFFFF' },
  auditModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backdropFilter: 'blur(12px)',
  } as any,
  auditCard: {
    borderRadius: 22,
    borderWidth: 1,
    maxHeight: '90%',
    width: '100%',
    maxWidth: 500,
    padding: 22,
    gap: 16,
    backgroundColor: 'rgba(16, 20, 28, 0.92)',
    borderColor: 'rgba(255, 255, 255, 0.18)',
    backdropFilter: 'blur(28px)',
  } as any,
  auditHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  auditHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  auditTitle: { fontFamily: 'Inter_700Bold', fontSize: 20, color: '#FFFFFF' },
  auditContent: { gap: 14, paddingBottom: 30 },
  auditFactor: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  factorTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  factorLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: '#FFFFFF' },
  factorValue: { fontFamily: 'Inter_700Bold', fontSize: 18, color: '#FFFFFF' },
  reasonRow: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  completeBanner: {
    padding: 12,
    borderRadius: 12,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.35)',
  },
  missingRow: { flexDirection: 'row', gap: 8, alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.08)' },
  missingText: { fontFamily: 'Inter_500Medium', fontSize: 13, flex: 1, color: 'rgba(255, 255, 255, 0.85)' },
  filterScroll: { flexDirection: 'row', gap: 8, paddingVertical: 4 },
  filterPill: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  milestoneBlock: { gap: 10, marginTop: 10 },
  milestoneHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  milestoneDot: { width: 8, height: 8, borderRadius: 4 },
  milestoneTitle: { fontFamily: 'Inter_700Bold', fontSize: 13, letterSpacing: 0.6, color: '#FFFFFF' },
  detailSheetContent: { gap: 12, paddingBottom: 20 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  detailSectionTitle: { fontFamily: 'Inter_700Bold', fontSize: 14, marginTop: 4, color: '#FFFFFF' },
  detailDepBox: { padding: 12, borderRadius: 12, gap: 8, backgroundColor: 'rgba(255, 255, 255, 0.06)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.12)' },
  detailDepRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailActions: { gap: 10, marginTop: 8 },
  filePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    marginTop: 6,
  },
  uploadBox: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
});