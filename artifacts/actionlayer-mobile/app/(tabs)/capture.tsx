import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomSheet, GlassCard, PrimaryButton, SecondaryButton, StatusBadge, TextField, ui } from '@/components/actionlayer-ui';
import { useColors } from '@/hooks/useColors';
import { useApp, type Claim, type Task, type TaskStatus } from '@/context/AppContext';

export default function CaptureScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { agent, switchAgent, createAgent, setExtractedAgent } = useApp();
  const [sheet, setSheet] = useState<'text' | 'manual' | null>(null);
  const [textValue, setTextValue] = useState('');
  const [manualTitle, setManualTitle] = useState('');
  const [manualDeadline, setManualDeadline] = useState('');
  const [processing, setProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState(1);
  const [processingStageLabel, setProcessingStageLabel] = useState('Securing source');
  const [pendingSource, setPendingSource] = useState<string | null>(null);
  const [pendingSourceType, setPendingSourceType] = useState<'image' | 'text' | 'pdf'>('text');
  const [pendingImageUri, setPendingImageUri] = useState<string | null>(null);
  const [pendingBlob, setPendingBlob] = useState<Blob | null>(null);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [extractionError, setExtractionError] = useState<string | null>(null);

  const requestIntakeWithDisclosure = (sourceTypeLabel: string, type: 'image' | 'text' | 'pdf', imageUri?: string, blob?: Blob) => {
    setPendingSource(sourceTypeLabel);
    setPendingSourceType(type);
    if (imageUri) setPendingImageUri(imageUri);
    if (blob) setPendingBlob(blob);
    setExtractionError(null);
    setShowPrivacyModal(true);
  };

  const executeRealExtraction = async (sourceText: string, filename: string) => {
    setShowPrivacyModal(false);
    setProcessing(true);
    setExtractionError(null);

    const stages = [
      '1. Securing source in protected storage',
      '2. Reading content and structure',
      '3. Identifying competition details with Gemini',
      '4. Grounding claims with exact excerpts',
      '5. Building deterministic draft plan',
      '6. Preparing human claim review',
    ];

    let currentStage = 0;
    const interval = setInterval(() => {
      if (currentStage < stages.length - 1) {
        currentStage++;
        setProcessingStage(currentStage + 1);
        setProcessingStageLabel(stages[currentStage]);
      }
    }, 3000);

    try {
      const formData = new FormData();
      formData.append('title', filename || 'Competition Announcement');

      if (pendingSourceType === 'text') {
        formData.append('text', sourceText || 'Competition poster text');
      } else if (pendingBlob) {
        formData.append('file', pendingBlob, (filename || 'poster') + '.jpg');
      } else if (pendingImageUri) {
        try {
          const res = await fetch(pendingImageUri);
          const blob = await res.blob();
          formData.append('file', blob, (filename || 'poster') + '.jpg');
        } catch (e) {
          console.warn('[ActionLayer] Could not fetch image URI, falling back to text payload:', e);
          formData.append('text', filename || 'Competition Poster Document');
        }
      } else {
        formData.append('text', filename || 'Competition Announcement Intake');
      }

      console.log('[ActionLayer] Posting source to http://localhost:5001/api/v1/sources...');
      const response = await fetch('http://localhost:5001/api/v1/sources', {
        method: 'POST',
        body: formData,
      });

      clearInterval(interval);

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        console.error('[ActionLayer] API extraction error:', errJson);
        throw new Error(errJson?.error?.message || 'ActionLayer couldn’t analyze this source. Your file is safe.');
      }

      const data = await response.json();
      const ext = data.extraction;

      const mappedClaims: Claim[] = (ext.claims || []).map((c: any, i: number) => ({
        id: `claim-${i + 1}`,
        field: c.fieldName,
        value: c.value,
        status: c.status,
        confidence: c.confidence,
        sourceExcerpt: c.sourceExcerpt || c.value,
        sourcePage: c.sourcePage || 1,
        reviewed: c.status === 'confirmed_from_source' && !c.requiresReview,
        modelVersion: data.job?.modelVersion || 'gemini-3.6-flash',
      }));

      // Extract real deadline from Gemini output or source claims
      const deadlineClaim = (ext.claims || []).find((c: any) => {
        const f = (c.fieldName || '').toLowerCase();
        return f.includes('deadline') || f.includes('due date') || f.includes('submission date');
      });

      let realTargetDeadline = ext.targetDeadline;
      let realDeadlineNote = ext.deadlineNote;

      if (!realDeadlineNote && deadlineClaim?.value) {
        realDeadlineNote = deadlineClaim.value;
      }

      if (!realTargetDeadline && deadlineClaim?.value) {
        const parsed = Date.parse(deadlineClaim.value);
        if (!isNaN(parsed)) {
          realTargetDeadline = new Date(parsed).toISOString();
        }
      }

      // If still not parsed, verify if ext.targetDeadline was valid
      if (realTargetDeadline) {
        const checkValid = Date.parse(realTargetDeadline);
        if (isNaN(checkValid)) {
          realTargetDeadline = undefined;
        }
      }

      // Fallback only if source has zero dates whatsoever
      if (!realTargetDeadline) {
        realTargetDeadline = new Date(Date.now() + 86400000 * 30).toISOString();
      }
      if (!realDeadlineNote) {
        realDeadlineNote = 'Not specified in source';
      }

      // Map DAG dependencies based on Gemini's dependencyTitles
      const taskTitleToId: Record<string, string> = {};
      (ext.tasks || []).forEach((t: any, i: number) => {
        taskTitleToId[t.title] = `task-${i + 1}`;
      });

      const mappedTasks: Task[] = (ext.tasks || []).map((t: any, i: number) => {
        const taskId = `task-${i + 1}`;
        let depIds: string[] = [];
        if (Array.isArray(t.dependencyTitles) && t.dependencyTitles.length > 0) {
          depIds = t.dependencyTitles
            .map((depTitle: string) => taskTitleToId[depTitle])
            .filter(Boolean);
        }
        const isRoot = depIds.length === 0;
        return {
          id: taskId,
          title: t.title,
          description: t.description,
          category: t.category || 'General',
          priority: t.priority || 'medium',
          status: isRoot ? ('ready' as TaskStatus) : ('blocked' as TaskStatus),
          estimatedMinutes: t.estimatedMinutes || 30,
          dependencyIds: depIds,
          completionCondition: t.completionCondition || 'Satisfy requirements',
          evidenceRequired: t.evidenceRequired ?? true,
          sequenceNumber: i + 1,
        };
      });

      const newAgentId = data.source?.id || `agent-${Date.now()}`;
      setExtractedAgent({
        id: newAgentId,
        title: ext.title || (ext.documentType ? `${ext.documentType} Agent` : 'Custom Agent'),
        organizer: ext.organizer || 'Organizing Body',
        type: 'competition',
        targetDeadline: realTargetDeadline,
        deadlineNote: realDeadlineNote,
        sourceLabel: filename || 'Source Document',
        sourceType: pendingSourceType.toUpperCase(),
        claims: mappedClaims,
        tasks: mappedTasks,
      });

      setProcessing(false);
      router.push(`/review/${newAgentId}`);
    } catch (err: any) {
      clearInterval(interval);
      setProcessing(false);
      setExtractionError(err?.message || 'Could not analyze document with Gemini. Your source file is preserved safely.');
    }
  };

  const handleConfirmedProcessing = (filename: string) => {
    executeRealExtraction(textValue, filename);
  };

  const chooseImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.9,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const filename = asset.fileName || 'Poster Image';
      requestIntakeWithDisclosure(filename, 'image', asset.uri);
    }
  };

  const chooseDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf'],
      copyToCacheDirectory: true,
    });
    if (!result.canceled && result.assets && result.assets[0]) {
      const doc = result.assets[0];
      requestIntakeWithDisclosure(doc.name, 'pdf', doc.uri);
    }
  };

  const handleManualEntrySubmit = () => {
    setSheet(null);
    const title = manualTitle || 'Custom Agent';
    const newAgentId = createAgent({
      title,
      organizer: 'Independent Builder',
      targetDeadline: manualDeadline || '2026-11-15T23:59:00Z',
      deadlineNote: manualDeadline || 'November 2026',
      sourceLabel: 'Manual Entry',
      sourceType: 'Custom Entry',
    });
    Alert.alert('Agent Created', `Created agent "${title}".`);
    router.push(`/agent/${newAgentId}`);
  };

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 18, paddingBottom: 110 }]}>
        <Text style={[ui.eyebrow, { color: colors.mutedForeground }]}>SOURCE INTAKE & COMPILER</Text>
        <Text style={[styles.title, { color: colors.text }]}>What should become an agent?</Text>
        <Text style={[styles.subTitle, { color: colors.mutedForeground }]}>
          Upload a competition poster, PDF rulebook, or paste text. ActionLayer AI will extract requirements, plan tasks, and generate your agent's roadmap.
        </Text>

        {/* Error Recovery Card */}
        {extractionError && (
          <GlassCard style={styles.errorCard}>
            <View style={styles.errorTop}>
              <Feather name="alert-circle" size={20} color={colors.risk} />
              <Text style={[styles.errorText, { color: colors.risk }]}>
                {extractionError}
              </Text>
            </View>
            <Text style={[styles.errorSub, { color: colors.mutedForeground }]}>
              Your original file remains safe in local storage. You can retry with Gemini or enter details manually.
            </Text>
            <View style={styles.errorButtons}>
              <PrimaryButton
                label="Retry with Gemini"
                icon="refresh-cw"
                onPress={() => handleConfirmedProcessing(pendingSource || 'Uploaded source')}
              />
              <SecondaryButton
                label="Enter Information Manually"
                icon="edit-2"
                onPress={() => setSheet('manual')}
              />
            </View>
          </GlassCard>
        )}

        {/* Processing Stages Card */}
        {processing && (
          <GlassCard style={styles.processingCard}>
            <View style={styles.processingHeader}>
              <Feather name="loader" size={20} color={colors.text} />
              <Text style={[styles.processingTitle, { color: colors.text }]}>
                Compiling ActionLayer Agent
              </Text>
            </View>
            <Text style={[styles.processingStageText, { color: colors.text }]}>
              {processingStageLabel}
            </Text>
            <View style={styles.stagesList}>
              {[
                'Securing source',
                'Reading content',
                'Identifying competition details',
                'Grounding claims',
                'Building draft plan',
                'Preparing human review',
              ].map((label, idx) => {
                const isCurrent = idx + 1 === processingStage;
                const isPast = idx + 1 < processingStage;
                return (
                  <View key={idx} style={styles.stageRow}>
                    <Feather
                      name={isPast ? 'check-circle' : isCurrent ? 'disc' : 'circle'}
                      size={14}
                      color={isPast ? colors.success : isCurrent ? colors.text : colors.mutedForeground}
                    />
                    <Text
                      style={[
                        styles.stageLabel,
                        {
                          color: isPast ? colors.text : isCurrent ? colors.text : colors.mutedForeground,
                          fontFamily: isCurrent ? 'Inter_600SemiBold' : 'Inter_400Regular',
                        },
                      ]}
                    >
                      {label}
                    </Text>
                  </View>
                );
              })}
            </View>
            <Text style={[styles.processingNotice, { color: colors.mutedForeground }]}>
              Note: Complex documents may take 15-30 seconds for ActionLayer AI to fully extract the DAG and claims.
            </Text>
          </GlassCard>
        )}

        <Text style={[styles.sectionHeading, { color: colors.text }]}>Intake a real source</Text>

        <GlassCard style={{ padding: 0, overflow: 'hidden' }}>
          <SourceOption
            icon="camera"
            title="Camera or screenshot"
            detail="Capture a competition poster or notice"
            onPress={chooseImage}
            colors={colors}
          />
          <SourceOption
            icon="image"
            title="Gallery image"
            detail="Select a saved competition poster (JPEG, PNG, WebP)"
            onPress={chooseImage}
            colors={colors}
          />
          <SourceOption
            icon="file-text"
            title="PDF document"
            detail="Upload rulebook, syllabus, or call for proposals"
            onPress={chooseDocument}
            colors={colors}
          />
          <SourceOption
            icon="edit-3"
            title="Paste announcement text"
            detail="Bring in email, message, or website text"
            onPress={() => setSheet('text')}
            colors={colors}
          />
          <SourceOption
            icon="user-check"
            title="Manual entry (No AI)"
            detail="Type opportunity requirements manually"
            onPress={() => setSheet('manual')}
            isLast
            colors={colors}
          />
        </GlassCard>

        <GlassCard style={styles.sourceNotice}>
          <Feather name="shield" size={16} color={colors.info} />
          <Text style={[styles.sourceNoticeText, { color: colors.mutedForeground }]}>
            Sources are private by default in this single-user local MVP.
          </Text>
        </GlassCard>
      </ScrollView>

      {/* Mandatory Gemini Privacy Disclosure Modal */}
      <Modal visible={showPrivacyModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <GlassCard style={styles.disclosureBox}>
            <View style={styles.disclosureHeader}>
              <Feather name="alert-triangle" size={22} color={colors.warning} />
              <Text style={[styles.disclosureTitle, { color: colors.text }]}>
                Privacy Disclosure
              </Text>
            </View>
            <Text style={[styles.disclosureBody, { color: colors.text }]}>
              ActionLayer will send this source to Google Gemini for analysis. Do not upload identity documents, financial records, medical records, confidential research, private university materials, or company-confidential files.
            </Text>
            <Text style={[styles.disclosureFoot, { color: colors.mutedForeground }]}>
              By continuing, you confirm this document contains only public competition guidelines or academic opportunity material.
            </Text>
            <View style={styles.disclosureButtons}>
              <PrimaryButton
                label="Continue with Gemini"
                icon="check"
                onPress={() => handleConfirmedProcessing(pendingSource || 'Uploaded source')}
              />
              <SecondaryButton
                label="Enter Information Manually"
                icon="edit-2"
                onPress={() => {
                  setShowPrivacyModal(false);
                  setSheet('manual');
                }}
              />
              <SecondaryButton
                label="Cancel"
                onPress={() => setShowPrivacyModal(false)}
              />
            </View>
          </GlassCard>
        </View>
      </Modal>

      {/* Text Intake & Manual Entry Sheet */}
      <BottomSheet
        visible={sheet !== null}
        title={sheet === 'manual' ? 'Manual Opportunity Entry' : 'Paste Announcement Text'}
        onClose={() => setSheet(null)}
      >
        {sheet === 'text' ? (
          <>
            <TextField
              label="Source Text"
              value={textValue}
              onChangeText={setTextValue}
              placeholder="Paste competition announcement or guidelines here…"
              multiline
            />
            <PrimaryButton
              label="Analyze with Gemini"
              icon="arrow-right"
              disabled={textValue.trim().length < 10}
              onPress={() => {
                setSheet(null);
                requestIntakeWithDisclosure('Pasted announcement text', 'text');
              }}
            />
          </>
        ) : (
          <>
            <TextField
              label="Opportunity Title"
              value={manualTitle}
              onChangeText={setManualTitle}
              placeholder="e.g. Hackathon 2026"
            />
            <TextField
              label="Deadline (Date & Time)"
              value={manualDeadline}
              onChangeText={setManualDeadline}
              placeholder="e.g. 18 Oct 2026, 11:59 PM"
            />
            <PrimaryButton
              label="Create Agent Manually"
              icon="check"
              disabled={manualTitle.trim().length < 3}
              onPress={handleManualEntrySubmit}
            />
          </>
        )}
        <SecondaryButton label="Cancel" onPress={() => setSheet(null)} />
      </BottomSheet>
    </View>
  );
}

function SourceOption({
  icon,
  title,
  detail,
  onPress,
  isLast = false,
  colors,
}: {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  detail: string;
  onPress: () => void;
  isLast?: boolean;
  colors: any;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.sourceOption,
        !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border },
        pressed && { backgroundColor: colors.muted },
      ]}
    >
      <View style={[styles.sourceIcon, { backgroundColor: colors.muted, borderColor: colors.border }]}>
        <Feather name={icon} size={19} color={colors.text} />
      </View>
      <View style={styles.sourceCopy}>
        <Text style={[styles.sourceTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.sourceDetail, { color: colors.mutedForeground }]}>{detail}</Text>
      </View>
      <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'transparent' },
  content: { paddingHorizontal: 20, gap: 16 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 28, letterSpacing: -0.6, lineHeight: 34, marginTop: 4 },
  subTitle: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19 },
  sectionHeading: { fontFamily: 'Inter_700Bold', fontSize: 16, marginTop: 8 },

  sourceOption: { minHeight: 70, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  sourceIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  sourceCopy: { flex: 1, gap: 2 },
  sourceTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 15 },
  sourceDetail: { fontFamily: 'Inter_400Regular', fontSize: 12 },

  sourceNotice: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14 },
  sourceNoticeText: { fontFamily: 'Inter_400Regular', fontSize: 12, flex: 1 },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backdropFilter: 'blur(12px)',
  } as any,
  disclosureBox: { width: '100%', maxWidth: 440, padding: 22, gap: 12 },
  disclosureHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  disclosureTitle: { fontFamily: 'Inter_700Bold', fontSize: 18 },
  disclosureBody: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 21 },
  disclosureFoot: { fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 4 },
  disclosureButtons: { gap: 10, marginTop: 8 },

  processingCard: { padding: 18, gap: 10 },
  processingHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  processingTitle: { fontFamily: 'Inter_700Bold', fontSize: 16 },
  processingStageText: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  stagesList: { gap: 8, marginTop: 6 },
  stageRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stageLabel: { fontSize: 13 },
  processingNotice: { fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 10 },

  errorCard: {
    padding: 18,
    gap: 10,
    borderWidth: 1,
  },
  errorTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  errorText: { fontFamily: 'Inter_600SemiBold', fontSize: 13, flex: 1 },
  errorSub: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  errorButtons: { gap: 8, marginTop: 6 },
});