import { Feather } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useColors } from '@/hooks/useColors';

export function PrimaryButton({ label, onPress, icon, disabled = false }: { label: string; onPress: () => void; icon?: keyof typeof Feather.glyphMap; disabled?: boolean }) {
  const colors = useColors();
  return <Pressable accessibilityRole="button" accessibilityLabel={label} testID={`button-${label}`} onPress={onPress} disabled={disabled} style={({ pressed }) => [styles.primaryButton, { backgroundColor: colors.primary, opacity: disabled ? 0.45 : pressed ? 0.82 : 1 }]}><Text style={[styles.buttonText, { color: colors.primaryForeground }]}>{label}</Text>{icon && <Feather name={icon} size={17} color={colors.primaryForeground} />}</Pressable>;
}

export function SecondaryButton({ label, onPress, icon, disabled = false }: { label: string; onPress: () => void; icon?: keyof typeof Feather.glyphMap; disabled?: boolean }) {
  const colors = useColors();
  return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} disabled={disabled} style={({ pressed }) => [styles.secondaryButton, { borderColor: colors.border, backgroundColor: pressed ? colors.secondary : colors.card, opacity: disabled ? 0.45 : 1 }]}>{icon && <Feather name={icon} size={17} color={colors.foreground} />}<Text style={[styles.secondaryButtonText, { color: colors.foreground }]}>{label}</Text></Pressable>;
}

export function StatusBadge({ label, tone = 'neutral' }: { label: string; tone?: 'success' | 'warning' | 'risk' | 'info' | 'neutral' }) {
  const colors = useColors();
  const map = { success: [colors.success, '#E2F1E9'], warning: [colors.warning, '#F7ECD8'], risk: [colors.risk, '#F7E1DF'], info: [colors.info, '#E5EBFD'], neutral: [colors.mutedForeground, colors.muted] } as const;
  const [foreground, background] = map[tone];
  return <View accessible accessibilityLabel={`${label} status`} style={[styles.badge, { backgroundColor: background }]}><View style={[styles.badgeDot, { backgroundColor: foreground }]} /><Text style={[styles.badgeText, { color: foreground }]}>{label}</Text></View>;
}

export function ProgressBar({ value, label }: { value: number; label: string }) {
  const colors = useColors();
  return <View accessible accessibilityLabel={`${label}, ${value} percent`} style={styles.progressWrap}><View style={styles.progressHeader}><Text style={[styles.caption, { color: colors.mutedForeground }]}>{label}</Text><Text style={[styles.captionStrong, { color: colors.foreground }]}>{value}%</Text></View><View style={[styles.progressTrack, { backgroundColor: colors.muted }]}><View style={[styles.progressFill, { width: `${Math.min(100, Math.max(0, value))}%`, backgroundColor: colors.primary }]} /></View></View>;
}

export function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  const colors = useColors();
  return <View style={styles.sectionHeader}><Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text>{action && <Pressable accessibilityRole="button" onPress={onAction}><Text style={[styles.sectionAction, { color: colors.primary }]}>{action}</Text></Pressable>}</View>;
}

export function EmptyState({ title, detail, icon = 'inbox' }: { title: string; detail: string; icon?: keyof typeof Feather.glyphMap }) {
  const colors = useColors();
  return <View style={[styles.emptyState, { borderColor: colors.border, backgroundColor: colors.card }]}><Feather name={icon} size={28} color={colors.primary} /><Text style={[styles.emptyTitle, { color: colors.foreground }]}>{title}</Text><Text style={[styles.body, { color: colors.mutedForeground }]}>{detail}</Text></View>;
}

export function ErrorState({ title, detail, onRetry }: { title: string; detail: string; onRetry: () => void }) {
  const colors = useColors();
  return <View style={[styles.emptyState, { borderColor: colors.risk, backgroundColor: colors.card }]}><Feather name="alert-circle" size={28} color={colors.risk} /><Text style={[styles.emptyTitle, { color: colors.foreground }]}>{title}</Text><Text style={[styles.body, { color: colors.mutedForeground }]}>{detail}</Text><SecondaryButton label="Try again" onPress={onRetry} icon="refresh-cw" /></View>;
}

export function OfflineBanner() {
  const colors = useColors();
  return <View accessible accessibilityRole="alert" style={[styles.offline, { backgroundColor: colors.secondary }]}><Feather name="wifi-off" size={15} color={colors.warning} /><Text style={[styles.caption, { color: colors.foreground }]}>Offline mode · changes will sync when you reconnect</Text></View>;
}

export function TextField({ label, value, onChangeText, placeholder, multiline = false }: { label: string; value: string; onChangeText: (value: string) => void; placeholder?: string; multiline?: boolean }) {
  const colors = useColors();
  return <View style={styles.field}><Text style={[styles.fieldLabel, { color: colors.foreground }]}>{label}</Text><TextInput accessibilityLabel={label} value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={colors.mutedForeground} multiline={multiline} textAlignVertical={multiline ? 'top' : 'center'} style={[styles.input, { color: colors.foreground, borderColor: colors.input, backgroundColor: colors.card }, multiline && styles.multiline]} /></View>;
}

export function BottomSheet({ visible, title, onClose, children }: { visible: boolean; title: string; onClose: () => void; children: React.ReactNode }) {
  const colors = useColors();
  return <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}><View style={styles.modalBackdrop}><View style={[styles.sheet, { backgroundColor: colors.background }]}><View style={styles.sheetHandle} /><View style={styles.sheetHeader}><Text style={[styles.sheetTitle, { color: colors.foreground }]}>{title}</Text><Pressable accessibilityLabel="Close" onPress={onClose}><Feather name="x" size={22} color={colors.foreground} /></Pressable></View><ScrollView contentContainerStyle={styles.sheetContent}>{children}</ScrollView></View></View></Modal>;
}

export function LoadingState() {
  const colors = useColors();
  return <View style={styles.loading}><ActivityIndicator color={colors.primary} /><Text style={[styles.body, { color: colors.mutedForeground }]}>Preparing your action plan…</Text></View>;
}

const styles = StyleSheet.create({
  primaryButton: { minHeight: 48, paddingHorizontal: 18, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  secondaryButton: { minHeight: 46, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  buttonText: { fontFamily: 'Inter_600SemiBold', fontSize: 15 },
  secondaryButtonText: { fontFamily: 'Inter_600SemiBold', fontSize: 15 },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999, flexDirection: 'row', alignItems: 'center', gap: 6 },
  badgeDot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontFamily: 'Inter_600SemiBold', fontSize: 11, letterSpacing: 0.2 },
  progressWrap: { gap: 8 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  progressTrack: { height: 7, borderRadius: 7, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 7 },
  caption: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 17 },
  captionStrong: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle: { fontFamily: 'Inter_700Bold', fontSize: 18, letterSpacing: -0.2 },
  sectionAction: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  eyebrow: { fontFamily: 'Inter_700Bold', fontSize: 12, letterSpacing: 2 },
  emptyState: { borderWidth: 1, borderRadius: 16, padding: 24, alignItems: 'center', gap: 10 },
  emptyTitle: { fontFamily: 'Inter_700Bold', fontSize: 17, textAlign: 'center' },
  body: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 21, textAlign: 'center' },
  offline: { paddingVertical: 9, paddingHorizontal: 12, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 8 },
  field: { gap: 7 },
  fieldLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  input: { minHeight: 48, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, fontFamily: 'Inter_400Regular', fontSize: 15 },
  multiline: { minHeight: 100, paddingTop: 13 },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(20,23,27,0.35)' },
  sheet: { maxHeight: '86%', borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  sheetHandle: { width: 40, height: 4, borderRadius: 4, backgroundColor: '#A9AAA7', alignSelf: 'center', marginTop: 10 },
  sheetHeader: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sheetTitle: { fontFamily: 'Inter_700Bold', fontSize: 21 },
  sheetContent: { padding: 20, gap: 16, paddingBottom: 40 },
  loading: { paddingVertical: 32, alignItems: 'center', gap: 10 },
});

export const ui = styles;