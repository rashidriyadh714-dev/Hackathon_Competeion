import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomSheet, PrimaryButton, SecondaryButton, StatusBadge, TextField, ui } from '@/components/actionlayer-ui';
import { useApp, type Claim } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';

export default function ReviewScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { agent, confirmClaim, editClaim, removeClaim, markClaimUnknown } = useApp();

  const [editing, setEditing] = useState<Claim | null>(null);
  const [value, setValue] = useState('');
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  if (!agent) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: 24 }]}>
        <Text style={{ color: colors.foreground, fontFamily: 'Inter_600SemiBold', fontSize: 16, marginBottom: 12 }}>Agent not found</Text>
        <Pressable onPress={() => router.replace('/(tabs)/capture')} style={[styles.back, { marginTop: 8 }]}>
          <Feather name="arrow-left" size={18} color={colors.primary} />
          <Text style={[ui.captionStrong, { color: colors.primary }]}>Return to Capture</Text>
        </Pressable>
      </View>
    );
  }

  const uncertain = agent.claims.filter(
    (claim) => !claim.reviewed
  );
  const confirmedCount = agent.claims.filter((c) => c.reviewed && c.status !== 'inferred_needs_review' && c.status !== 'missing').length;

  const handleEditOpen = (claim: Claim) => {
    setEditing(claim);
    setValue(claim.value);
  };

  const handleSaveEdit = () => {
    if (editing && value.trim()) {
      editClaim(editing.id, value);
      setEditing(null);
    }
  };

  const handleConfirmAll = () => {
    uncertain.forEach((claim) => {
      confirmClaim(claim.id);
    });
  };

  const handleOpenPreview = () => {
    setShowPreviewModal(true);
  };

  const handleConfirmActivation = () => {
    setShowPreviewModal(false);
    router.replace(`/agent/${agent.id}`);
  };

  const getStatusBadge = (claim: Claim) => {
    switch (claim.status) {
      case 'confirmed_from_source':
        return <StatusBadge label="Confirmed from source" tone="success" />;
      case 'supplied_by_user':
        return <StatusBadge label="Supplied by you" tone="success" />;
      case 'inferred_needs_review':
        return <StatusBadge label="Needs review" tone="warning" />;
      case 'missing':
        return <StatusBadge label="Missing from source" tone="risk" />;
      case 'conflicting':
        return <StatusBadge label="Conflicting" tone="risk" />;
      default:
        return <StatusBadge label="Review" tone="warning" />;
    }
  };

  // Group claims into standard categories
  const categories = [
    { title: 'Competition Overview', filter: (c: Claim) => c.field.toLowerCase().includes('title') || c.field.toLowerCase().includes('organizer') },
    { title: 'Important Dates & Timezone', filter: (c: Claim) => c.field.toLowerCase().includes('deadline') || c.field.toLowerCase().includes('date') },
    { title: 'Eligibility & Rules', filter: (c: Claim) => c.field.toLowerCase().includes('eligibility') || c.field.toLowerCase().includes('rule') },
    { title: 'Required Deliverables', filter: (c: Claim) => c.field.toLowerCase().includes('deliverable') || c.field.toLowerCase().includes('repo') || c.field.toLowerCase().includes('video') },
  ];

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/capture');
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 12, paddingBottom: 110 }]}>
        <Pressable accessibilityLabel="Back to Capture" onPress={handleBack} style={styles.back}>
          <Feather name="arrow-left" size={21} color={colors.foreground} />
          <Text style={[ui.captionStrong, { color: colors.foreground }]}>Capture</Text>
        </Pressable>

        <Text style={[ui.eyebrow, { color: colors.primary }]}>STEP 2: EXTRACTION REVIEW</Text>
        <Text style={[styles.title, { color: colors.foreground }]}>Review Grounded Claims</Text>
        <Text style={[ui.body, { color: colors.mutedForeground, textAlign: 'left' }]}>
          Every claim remains grounded in the original source document. Correct any uncertain items, confirm trusted facts, or mark details as unknown before activating your agent.
        </Text>

        {/* Source document preview card */}
        <View style={[styles.sourcePreview, { backgroundColor: colors.secondary }]}>
          <Feather name="file-text" size={22} color={colors.primary} />
          <View style={styles.sourceCopy}>
            <Text style={[ui.captionStrong, { color: colors.foreground }]}>{agent.sourceLabel}</Text>
            <Text style={[ui.caption, { color: colors.mutedForeground }]}>
              {agent.sourceType} · Protected local storage
            </Text>
          </View>
          <StatusBadge label="Preserved" tone="info" />
        </View>

        {/* Summary metrics card */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.summaryNum, { color: colors.success }]}>{confirmedCount}</Text>
            <Text style={[ui.caption, { color: colors.mutedForeground }]}>Confirmed</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.summaryNum, { color: uncertain.length > 0 ? colors.warning : colors.success }]}>{uncertain.length}</Text>
            <Text style={[ui.caption, { color: colors.mutedForeground }]}>Need Review</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.summaryNum, { color: colors.primary }]}>{agent.tasks.length}</Text>
            <Text style={[ui.caption, { color: colors.mutedForeground }]}>DAG Tasks</Text>
          </View>
        </View>

        {/* Warning or Success banner */}
        {uncertain.length > 0 ? (
          <View style={[styles.warningBanner, { backgroundColor: colors.warning + '20', borderColor: colors.warning }]}>
            <Feather name="alert-triangle" size={18} color={colors.warning} />
            <View style={{ flex: 1, gap: 6 }}>
              <Text style={[ui.captionStrong, { color: colors.foreground }]}>
                {uncertain.length} item{uncertain.length === 1 ? '' : 's'} require human review
              </Text>
              <Text style={[ui.caption, { color: colors.foreground }]}>
                Human review is required before compilation into the Requirement Graph. Confirm or correct each item below.
              </Text>
              <Pressable onPress={handleConfirmAll} style={styles.confirmAllBtn}>
                <Feather name="check-circle" size={14} color={colors.primary} />
                <Text style={[ui.captionStrong, { color: colors.primary }]}>Confirm all remaining items</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={[styles.warningBanner, { backgroundColor: colors.success + '20', borderColor: colors.success }]}>
            <Feather name="check-circle" size={18} color={colors.success} />
            <View style={{ flex: 1 }}>
              <Text style={[ui.captionStrong, { color: colors.success }]}>All claims verified</Text>
              <Text style={[ui.caption, { color: colors.foreground }]}>
                All grounded facts confirmed. Ready to preview and activate your Agent!
              </Text>
            </View>
          </View>
        )}

        <View style={styles.claimsHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Extracted Claims ({agent.claims.length})
          </Text>
          <Text style={[ui.caption, { color: colors.mutedForeground }]}>
            Model: {agent.claims[0]?.modelVersion || 'gemini-3.6-flash'}
          </Text>
        </View>

        {(() => {
          const grouped: Record<string, Claim[]> = {};
          
          categories.forEach(c => { grouped[c.title] = []; });
          grouped['Other Claims'] = [];

          agent.claims.forEach(claim => {
            let placed = false;
            for (const cat of categories) {
              if (cat.filter(claim)) {
                grouped[cat.title].push(claim);
                placed = true;
                break;
              }
            }
            if (!placed) {
              grouped['Other Claims'].push(claim);
            }
          });

          return [...categories, { title: 'Other Claims' }].map((cat, catIdx) => {
            const catClaims = grouped[cat.title];
            if (!catClaims || catClaims.length === 0) return null;
            return (
              <View key={catIdx} style={styles.categorySection}>
                <Text style={[styles.catTitle, { color: colors.mutedForeground }]}>{cat.title.toUpperCase()}</Text>
                {catClaims.map((claim) => (
                  <View
                    key={claim.id}
                    style={[
                      styles.claimCard,
                      {
                        backgroundColor: colors.card,
                        borderColor: !claim.reviewed || claim.status === 'inferred_needs_review' ? colors.warning : colors.border,
                      },
                    ]}
                  >
                    <View style={styles.claimTop}>
                      <Text style={[styles.claimField, { color: colors.foreground }]}>{claim.field}</Text>
                      {getStatusBadge(claim)}
                    </View>

                    <Text style={[styles.claimValue, { color: colors.foreground }]}>{claim.value}</Text>

                    {/* Supporting excerpt */}
                    <View style={[styles.excerptBox, { backgroundColor: colors.secondary }]}>
                      <Feather name="file-text" size={13} color={colors.mutedForeground} />
                      <Text style={[styles.excerptText, { color: colors.mutedForeground }]}>
                        &quot;{claim.sourceExcerpt}&quot;
                      </Text>
                    </View>

                    <View style={styles.claimFooter}>
                      <Text style={[ui.caption, { color: colors.mutedForeground }]}>
                        Page {claim.sourcePage ?? 1} · Confidence: {Math.round(claim.confidence * 100)}%
                      </Text>
                    </View>

                    <View style={[styles.claimActions, { borderTopColor: colors.border }]}>
                      <Pressable
                        accessibilityLabel={`Edit ${claim.field}`}
                        onPress={() => handleEditOpen(claim)}
                        style={styles.actionBtn}
                      >
                        <Feather name="edit-2" size={14} color={colors.primary} />
                        <Text style={[ui.captionStrong, { color: colors.primary }]}>Edit</Text>
                      </Pressable>

                      {!claim.reviewed && (
                        <Pressable
                          accessibilityLabel={`Confirm ${claim.field}`}
                          onPress={() => confirmClaim(claim.id)}
                          style={styles.actionBtn}
                        >
                          <Feather name="check" size={14} color={colors.success} />
                          <Text style={[ui.captionStrong, { color: colors.success }]}>Confirm</Text>
                        </Pressable>
                      )}

                      <Pressable
                        accessibilityLabel={`Mark ${claim.field} as unknown`}
                        onPress={() => markClaimUnknown(claim.id)}
                        style={styles.actionBtn}
                      >
                        <Feather name="help-circle" size={14} color={colors.warning} />
                        <Text style={[ui.captionStrong, { color: colors.warning }]}>Unknown</Text>
                      </Pressable>

                      <Pressable
                        accessibilityLabel={`Remove ${claim.field}`}
                        onPress={() => removeClaim(claim.id)}
                        style={styles.actionBtn}
                      >
                        <Feather name="trash-2" size={14} color={colors.risk} />
                        <Text style={[ui.captionStrong, { color: colors.risk }]}>Remove</Text>
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            );
          });
        })()}

        {/* Primary Activation Button */}
        <View style={styles.activateArea}>
          {uncertain.length > 0 && (
            <Text style={[styles.disabledExplanation, { color: colors.warning }]}>
              Please confirm or review the remaining {uncertain.length} claim(s) before activating your agent.
            </Text>
          )}
          <PrimaryButton
            label={uncertain.length > 0 ? "Review Required Before Activation" : "Preview & Activate Agent"}
            icon="zap"
            disabled={uncertain.length > 0}
            onPress={handleOpenPreview}
          />
        </View>
      </ScrollView>

      {/* Claim Editing BottomSheet */}
      <BottomSheet
        visible={Boolean(editing)}
        title={`Edit ${editing?.field ?? 'Claim'}`}
        onClose={() => setEditing(null)}
      >
        <Text style={[ui.caption, { color: colors.mutedForeground, marginBottom: 8 }]}>
          Original source excerpt: &quot;{editing?.sourceExcerpt}&quot;
        </Text>
        <TextField
          label="Corrected Claim Value"
          value={value}
          onChangeText={setValue}
          placeholder="Enter verified factual value…"
          multiline
        />
        <PrimaryButton
          label="Save & Confirm Correction"
          icon="check"
          disabled={value.trim().length < 1}
          onPress={handleSaveEdit}
        />
        <SecondaryButton label="Cancel" onPress={() => setEditing(null)} />
      </BottomSheet>

      {/* Directive Step 13: Agent Preview Modal */}
      <BottomSheet
        visible={showPreviewModal}
        title="Agent Preview"
        onClose={() => setShowPreviewModal(false)}
      >
        <View style={styles.previewCard}>
          <View style={styles.previewRow}>
            <Text style={[ui.caption, { color: colors.mutedForeground }]}>Agent Type</Text>
            <StatusBadge label={agent.type ? agent.type + ' Agent' : 'Agent'} tone="info" />
          </View>
          <View style={styles.previewRow}>
            <Text style={[ui.caption, { color: colors.mutedForeground }]}>Opportunity Title</Text>
            <Text style={[ui.captionStrong, { color: colors.foreground, flexShrink: 1 }]}>{agent.title}</Text>
          </View>
          <View style={styles.previewRow}>
            <Text style={[ui.caption, { color: colors.mutedForeground }]}>Organizer</Text>
            <Text style={[ui.captionStrong, { color: colors.foreground }]}>{agent.organizer}</Text>
          </View>
          <View style={styles.previewRow}>
            <Text style={[ui.caption, { color: colors.mutedForeground }]}>Target Deadline</Text>
            <Text style={[ui.captionStrong, { color: colors.foreground }]}>{agent.deadlineNote}</Text>
          </View>
          <View style={styles.previewRow}>
            <Text style={[ui.caption, { color: colors.mutedForeground }]}>Tasks in DAG</Text>
            <Text style={[ui.captionStrong, { color: colors.foreground }]}>{agent.tasks.length} tasks</Text>
          </View>
          <View style={styles.previewRow}>
            <Text style={[ui.caption, { color: colors.mutedForeground }]}>Task Dependencies</Text>
            <Text style={[ui.captionStrong, { color: colors.foreground }]}>{agent.tasks.reduce((acc, t) => acc + (t.dependencyIds?.length || 0), 0)} dependency links</Text>
          </View>
          <View style={styles.previewRow}>
            <Text style={[ui.caption, { color: colors.mutedForeground }]}>Confirmed Claims</Text>
            <Text style={[ui.captionStrong, { color: colors.success }]}>{confirmedCount} of {agent.claims.length} verified</Text>
          </View>
          <View style={styles.previewRow}>
            <Text style={[ui.caption, { color: colors.mutedForeground }]}>First Action</Text>
            <Text style={[ui.captionStrong, { color: colors.primary }]} numberOfLines={1}>{agent.tasks[0]?.title || 'None'}</Text>
          </View>
        </View>

        <PrimaryButton
          label={agent.type ? 'Activate ' + agent.type + ' Agent' : 'Activate Agent'}
          icon="zap"
          onPress={handleConfirmActivation}
        />
        <SecondaryButton
          label="Return to Review"
          onPress={() => setShowPreviewModal(false)}
        />
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'transparent' },
  content: { paddingHorizontal: 20, gap: 16 },
  back: { flexDirection: 'row', gap: 8, alignItems: 'center', minHeight: 42 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 29, lineHeight: 35, letterSpacing: -0.6, color: '#FFFFFF' },
  sourcePreview: {
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(16, 20, 28, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    backdropFilter: 'blur(20px)',
  } as any,
  sourceCopy: { flex: 1, gap: 3 },
  summaryRow: { flexDirection: 'row', gap: 10 },
  summaryCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(16, 20, 28, 0.65)',
    borderColor: 'rgba(255, 255, 255, 0.16)',
    backdropFilter: 'blur(20px)',
  } as any,
  summaryNum: { fontFamily: 'Inter_700Bold', fontSize: 20, color: '#FFFFFF' },
  warningBanner: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    gap: 9,
    alignItems: 'flex-start',
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
    borderColor: 'rgba(251, 191, 36, 0.35)',
  },
  confirmAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, alignSelf: 'flex-start' },
  claimsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  sectionTitle: { fontFamily: 'Inter_700Bold', fontSize: 18, color: '#FFFFFF' },
  categorySection: { gap: 10 },
  catTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 12, letterSpacing: 0.8, color: 'rgba(255, 255, 255, 0.70)' },
  claimCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    gap: 10,
    backgroundColor: 'rgba(16, 20, 28, 0.65)',
    borderColor: 'rgba(255, 255, 255, 0.16)',
    backdropFilter: 'blur(20px)',
  } as any,
  claimTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, alignItems: 'center' },
  claimField: { fontFamily: 'Inter_600SemiBold', fontSize: 14, flex: 1, color: '#FFFFFF' },
  claimValue: { fontFamily: 'Inter_700Bold', fontSize: 17, lineHeight: 23, color: '#FFFFFF' },
  excerptBox: {
    flexDirection: 'row',
    gap: 8,
    padding: 10,
    borderRadius: 10,
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  excerptText: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 17, flex: 1, color: 'rgba(255, 255, 255, 0.75)' },
  claimFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  claimActions: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.08)', paddingTop: 12, marginTop: 4 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 4, paddingHorizontal: 8 },
  activateArea: { gap: 8, marginTop: 8 },
  disabledExplanation: { fontFamily: 'Inter_500Medium', fontSize: 13, textAlign: 'center', color: '#FBBF24' },
  previewCard: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    borderRadius: 16,
    padding: 16,
    gap: 10,
    marginBottom: 12,
    backgroundColor: 'rgba(16, 20, 28, 0.65)',
  },
  previewRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
});