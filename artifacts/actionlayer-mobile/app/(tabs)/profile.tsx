import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SectionHeader, SecondaryButton, StatusBadge, ui } from '@/components/actionlayer-ui';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isDemoMode, toggleDemoMode, signOut } = useApp();
  return <View style={[styles.root, { backgroundColor: colors.background }]}><ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 18, paddingBottom: 110 }]}><Text style={[ui.eyebrow, { color: colors.primary }]}>PROFILE</Text><View style={styles.profileTop}><View style={[styles.avatar, { backgroundColor: colors.primary }]}><Text style={styles.avatarText}>A</Text></View><View style={styles.profileCopy}><Text style={[styles.name, { color: colors.foreground }]}>Alex Morgan</Text><Text style={[ui.caption, { color: colors.mutedForeground }]}>alex@example.edu</Text></View><StatusBadge label="Demo mode" tone="info" /></View><SectionHeader title="Preferences" /><View style={[styles.settings, { backgroundColor: colors.card, borderColor: colors.border }]}><SettingRow icon="globe" title="Language" value="Simple English" /><SettingRow icon="clock" title="Time zone" value="Asia/Kuala Lumpur" /><SettingRow icon="bell" title="Reminders" value="On · 7d, 3d, 1d" /><SettingRow icon="eye" title="Accessibility" value="Dynamic text on" /><SettingRow icon="wifi-off" title="Offline queue" value="Enabled" /></View><SectionHeader title="Privacy and data" /><View style={[styles.settings, { backgroundColor: colors.card, borderColor: colors.border }]}><SettingRow icon="download" title="Export my data" value="JSON archive" /><SettingRow icon="trash-2" title="Delete uploaded source" value="Manage sources" /><SettingRow icon="shield" title="Security" value="Private by default" /></View><SectionHeader title="Demo controls" /><Text style={[ui.caption, { color: colors.mutedForeground }]}>Fictional demo data is local to this device and never presented as a real opportunity.</Text><SecondaryButton label={isDemoMode ? 'Turn off demo label' : 'Show demo label'} icon="compass" onPress={toggleDemoMode} /><SecondaryButton label="Reset competition demo" icon="rotate-ccw" onPress={() => Alert.alert('Reset demo?', 'This restores the fictional competition to its starting state.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Reset', onPress: () => router.replace('/(tabs)') }])} /><SecondaryButton label="Sign out" icon="log-out" onPress={() => { signOut(); router.push('/auth'); }} /></ScrollView></View>;
}

function SettingRow({ icon, title, value }: { icon: keyof typeof Feather.glyphMap; title: string; value: string }) {
  const colors = useColors();
  return <View style={[styles.setting, { borderBottomColor: colors.border }]}><Feather name={icon} size={18} color={colors.primary} /><View style={styles.settingCopy}><Text style={[styles.settingTitle, { color: colors.foreground }]}>{title}</Text><Text style={[ui.caption, { color: colors.mutedForeground }]}>{value}</Text></View><Feather name="chevron-right" size={17} color={colors.mutedForeground} /></View>;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 16 },
  profileTop: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 5 },
  avatar: { width: 54, height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#FFFFFF', fontFamily: 'Inter_700Bold', fontSize: 24 },
  profileCopy: { flex: 1, gap: 3 },
  name: { fontFamily: 'Inter_700Bold', fontSize: 19 },
  settings: { borderWidth: 1, borderRadius: 16, overflow: 'hidden' },
  setting: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderBottomWidth: 1 },
  settingCopy: { flex: 1, gap: 3 },
  settingTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
});