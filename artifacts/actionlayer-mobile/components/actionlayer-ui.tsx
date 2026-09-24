import { Feather } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';

export function GlassCard({
  children,
  style,
  onPress,
}: {
  children: React.ReactNode;
  style?: any;
  onPress?: () => void;
}) {
  const colors = useColors();
  const { theme } = useApp();
  const isDark = theme === 'dark';

  const cardStyle = [styles.glassCardBase, { borderColor: colors.border }, style];
  
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          cardStyle,
          pressed && { transform: [{ scale: 0.985 }], opacity: 0.9 },
        ]}
      >
        <BlurView tint={isDark ? "dark" : "light"} intensity={70} style={StyleSheet.absoluteFill} />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.card }]} />
        {children}
      </Pressable>
    );
  }
  return (
    <View style={cardStyle}>
      <BlurView tint={isDark ? "dark" : "light"} intensity={70} style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.card }]} />
      {children}
    </View>
  );
}

export function PrimaryButton({
  label,
  onPress,
  icon,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  icon?: keyof typeof Feather.glyphMap;
  disabled?: boolean;
}) {
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      testID={`button-${label}`}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.primaryButton,
        { backgroundColor: colors.primary, borderColor: 'rgba(255, 255, 255, 0.4)' },
        disabled && styles.btnDisabled,
        pressed && styles.btnPressed,
      ]}
    >
      <Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>{label}</Text>
      {icon && <Feather name={icon} size={17} color={colors.primaryForeground} />}
    </Pressable>
  );
}

export function SecondaryButton({
  label,
  onPress,
  icon,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  icon?: keyof typeof Feather.glyphMap;
  disabled?: boolean;
}) {
  const colors = useColors();
  const { theme } = useApp();
  const isDark = theme === 'dark';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.secondaryButtonBase,
        { borderColor: colors.border },
        disabled && styles.btnDisabled,
        pressed && styles.btnPressed,
      ]}
    >
      <BlurView tint={isDark ? "dark" : "light"} intensity={60} style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.secondary }]} />
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 18, minHeight: 46 }}>
        {icon && <Feather name={icon} size={17} color={colors.secondaryForeground} />}
        <Text style={[styles.secondaryButtonText, { color: colors.secondaryForeground }]}>{label}</Text>
      </View>
    </Pressable>
  );
}

export function GlassSwitch({
  value,
  onValueChange,
  label,
  description,
}: {
  value: boolean;
  onValueChange: (val: boolean) => void;
  label?: string;
  description?: string;
}) {
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      onPress={() => onValueChange(!value)}
      style={styles.switchRow}
    >
      {(label || description) && (
        <View style={styles.switchCopy}>
          {label && <Text style={[styles.switchLabel, { color: colors.text }]}>{label}</Text>}
          {description && <Text style={[styles.switchDesc, { color: colors.mutedForeground }]}>{description}</Text>}
        </View>
      )}
      <View style={[styles.switchTrack, { backgroundColor: colors.muted, borderColor: colors.border }, value && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
        <View style={[styles.switchThumb, value && styles.switchThumbActive]} />
      </View>
    </Pressable>
  );
}

export function StatusBadge({
  label,
  tone = 'neutral',
}: {
  label: string;
  tone?: 'success' | 'warning' | 'risk' | 'info' | 'neutral';
}) {
  const colors = useColors();
  const map = {
    success: { dot: colors.success, text: colors.success, border: `${colors.success}55`, bg: `${colors.success}22` },
    warning: { dot: colors.warning, text: colors.warning, border: `${colors.warning}55`, bg: `${colors.warning}22` },
    risk: { dot: colors.risk, text: colors.risk, border: `${colors.risk}55`, bg: `${colors.risk}22` },
    info: { dot: colors.info, text: colors.info, border: `${colors.info}55`, bg: `${colors.info}22` },
    neutral: { dot: colors.mutedForeground, text: colors.text, border: colors.border, bg: colors.muted },
  };
  const theme = map[tone] || map.neutral;
  return (
    <View accessible accessibilityLabel={`${label} status`} style={[styles.badge, { backgroundColor: theme.bg, borderColor: theme.border }]}>
      <View style={[styles.badgeDot, { backgroundColor: theme.dot }]} />
      <Text style={[styles.badgeText, { color: theme.text }]}>{label}</Text>
    </View>
  );
}

export function ProgressBar({ value, label }: { value: number; label: string }) {
  const colors = useColors();
  return (
    <View accessible accessibilityLabel={`${label}, ${value} percent`} style={styles.progressWrap}>
      <View style={styles.progressHeader}>
        <Text style={[styles.caption, { color: colors.mutedForeground }]}>{label}</Text>
        <Text style={[styles.captionStrong, { color: colors.text }]}>{value}%</Text>
      </View>
      <View style={[styles.progressTrack, { backgroundColor: colors.muted }]}>
        <View style={[styles.progressFill, { backgroundColor: colors.text, width: `${Math.min(100, Math.max(0, value))}%` }]} />
      </View>
    </View>
  );
}

export function SectionHeader({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  const colors = useColors();
  return (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      {action && (
        <Pressable accessibilityRole="button" onPress={onAction}>
          <Text style={[styles.sectionAction, { color: colors.mutedForeground }]}>{action}</Text>
        </Pressable>
      )}
    </View>
  );
}

export function EmptyState({
  title,
  detail,
  icon = 'inbox',
}: {
  title: string;
  detail: string;
  icon?: keyof typeof Feather.glyphMap;
}) {
  const colors = useColors();
  return (
    <View style={[styles.emptyState, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Feather name={icon} size={28} color={colors.text} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.body, { color: colors.mutedForeground }]}>{detail}</Text>
    </View>
  );
}

export function ErrorState({
  title,
  detail,
  onRetry,
}: {
  title: string;
  detail: string;
  onRetry: () => void;
}) {
  const colors = useColors();
  return (
    <View style={[styles.emptyState, { backgroundColor: colors.card, borderColor: colors.destructive }]}>
      <Feather name="alert-circle" size={28} color={colors.destructive} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.body, { color: colors.mutedForeground }]}>{detail}</Text>
      <SecondaryButton label="Try again" onPress={onRetry} icon="refresh-cw" />
    </View>
  );
}

export function OfflineBanner() {
  const colors = useColors();
  return (
    <View accessible accessibilityRole="alert" style={[styles.offline, { backgroundColor: `${colors.warning}22`, borderColor: `${colors.warning}55` }]}>
      <Feather name="wifi-off" size={15} color={colors.warning} />
      <Text style={[styles.caption, { color: colors.text }]}>Offline mode · changes will sync when you reconnect</Text>
    </View>
  );
}

export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
}) {
  const colors = useColors();
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: colors.text }]}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        style={[
          styles.input,
          multiline && styles.multiline,
          { color: colors.text, borderColor: colors.border, backgroundColor: colors.input }
        ]}
      />
    </View>
  );
}

export function BottomSheet({
  visible,
  title,
  onClose,
  children,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const colors = useColors();
  const { theme } = useApp();
  const isDark = theme === 'dark';

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={[styles.sheetBase, { borderColor: colors.border }]}>
          <BlurView tint={isDark ? "dark" : "light"} intensity={80} style={StyleSheet.absoluteFill} />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.card }]} />
          
          <View style={[styles.sheetHandle, { backgroundColor: colors.mutedForeground }]} />
          <View style={styles.sheetHeader}>
            <Text style={[styles.sheetTitle, { color: colors.text }]}>{title}</Text>
            <Pressable accessibilityLabel="Close" onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.muted }]}>
              <Feather name="x" size={20} color={colors.text} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.sheetContent}>{children}</ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export function LoadingState() {
  const colors = useColors();
  return (
    <View style={styles.loading}>
      <ActivityIndicator color={colors.text} />
      <Text style={[styles.body, { color: colors.text }]}>Preparing your action plan…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  glassCardBase: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    overflow: 'hidden',
    boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.18), 0 8px 32px rgba(0, 0, 0, 0.40)',
  } as any,

  primaryButton: {
    minHeight: 48,
    paddingHorizontal: 20,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    borderWidth: 1,
    boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.65), 0 6px 20px rgba(0, 0, 0, 0.35)',
    cursor: 'pointer',
    userSelect: 'none',
  } as any,
  primaryButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    letterSpacing: -0.2,
  },

  secondaryButtonBase: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.12), 0 2px 8px rgba(0, 0, 0, 0.25)',
    cursor: 'pointer',
    userSelect: 'none',
  } as any,
  secondaryButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    letterSpacing: -0.2,
  },

  btnDisabled: {
    opacity: 0.45,
    cursor: 'not-allowed',
  } as any,
  btnPressed: {
    transform: [{ scale: 0.985 }],
    opacity: 0.9,
  },

  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  switchCopy: {
    flex: 1,
    paddingRight: 16,
  },
  switchLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
  switchDesc: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  switchTrack: {
    width: 48,
    height: 28,
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: 'center',
    paddingHorizontal: 3,
    boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.35)',
    cursor: 'pointer',
  } as any,
  switchThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
    transition: 'transform 180ms cubic-bezier(0.2, 0.8, 0.2, 1)',
  } as any,
  switchThumbActive: {
    transform: [{ translateX: 18 }],
    backgroundColor: '#FFFFFF',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
  } as any,

  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    backdropFilter: 'blur(12px)',
  } as any,
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    letterSpacing: 0.2,
  },

  progressWrap: {
    gap: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressTrack: {
    height: 7,
    borderRadius: 7,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 7,
  },

  caption: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 17,
  },
  captionStrong: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    letterSpacing: -0.2,
  },
  sectionAction: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
  },
  eyebrow: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    letterSpacing: 2,
  },

  emptyState: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 12,
    backdropFilter: 'blur(20px)',
  } as any,
  emptyTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 17,
    textAlign: 'center',
  },
  body: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },

  offline: {
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
  },

  field: {
    gap: 7,
  },
  fieldLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    backdropFilter: 'blur(16px)',
  } as any,
  multiline: {
    minHeight: 100,
    paddingTop: 13,
  },

  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    backdropFilter: 'blur(10px)',
  } as any,
  sheetBase: {
    width: '100%',
    maxWidth: 450,
    maxHeight: '86%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.65)',
  } as any,
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 4,
    alignSelf: 'center',
    marginTop: 10,
  },
  sheetHeader: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sheetTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 21,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 999,
  },
  sheetContent: {
    padding: 20,
    gap: 16,
    paddingBottom: 40,
  },
  loading: {
    paddingVertical: 32,
    alignItems: 'center',
    gap: 10,
  },
});

export const ui = styles;