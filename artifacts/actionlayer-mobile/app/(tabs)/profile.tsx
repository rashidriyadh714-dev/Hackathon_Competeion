import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useRef } from 'react';
import { Image, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassCard, GlassSwitch, PrimaryButton, SecondaryButton, SectionHeader, StatusBadge, ui } from '@/components/actionlayer-ui';
import { WallpaperSettings } from '@/components/WallpaperSettings';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import { Paywall } from '@/components/Paywall';

const PRESET_WALLPAPERS = [
  {
    id: 'default',
    title: 'Mountain Vista',
    subtitle: 'Uploaded Landscape',
    uri: null, // triggers require('../assets/apple_glass_bg.jpg')
    preview: require('../../assets/apple_glass_bg.jpg'),
  },
  {
    id: 'deep_space',
    title: 'Obsidian Space',
    subtitle: 'Cosmic Minimal',
    uri: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1200&q=80',
    preview: { uri: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=300&q=80' },
  },
  {
    id: 'aurora',
    title: 'Liquid Aurora',
    subtitle: 'Prismatic Glow',
    uri: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
    preview: { uri: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=300&q=80' },
  },
  {
    id: 'minimal_dark',
    title: 'Studio Obsidian',
    subtitle: 'Monochrome Glass',
    uri: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
    preview: { uri: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=80' },
  },
];

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { agents, signOut, customBg, setCustomBg, bgDim, setBgDim, theme, toggleTheme } = useApp();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const totalTasks = agents.reduce((acc, a) => acc + a.tasks.length, 0);
  const totalEvidence = agents.reduce((acc, a) => acc + a.evidence.length, 0);

  const handleFileUpload = (event: any) => {
    const file = event?.target?.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) {
          setCustomBg(result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerUpload = () => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = handleFileUpload;
      input.click();
    }
  };

  const isDeepDim = bgDim > 0.30;

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 18, paddingBottom: 110 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[ui.eyebrow, { color: colors.mutedForeground }]}>WORKSPACE & APPEARANCE</Text>

        {/* Profile Card */}
        <GlassCard style={styles.profileTop}>
          <View style={[styles.avatar, { backgroundColor: colors.muted, borderColor: colors.border }]}>
            <Text style={[styles.avatarText, { color: colors.text }]}>AR</Text>
          </View>
          <View style={styles.profileCopy}>
            <Text style={[styles.name, { color: colors.text }]}>Rashid Riyadh</Text>
            <Text style={[styles.email, { color: colors.mutedForeground }]}>developer@actionlayer.ai</Text>
            <Text style={[styles.badgeLabel, { color: colors.mutedForeground }]}>Liquid Glass Architecture</Text>
          </View>
        </GlassCard>

        {/* RevenueCat Paywall */}
        <Paywall />

        {/* Wallpaper & Glass Aesthetic Customizer */}
        <WallpaperSettings />

        {/* Workspace Quick Stats */}
        <View style={styles.statsGrid}>
          <GlassCard style={styles.statBox}>
            <Text style={[styles.statNumber, { color: colors.text }]}>{agents.length}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Active Agents</Text>
          </GlassCard>
          <GlassCard style={styles.statBox}>
            <Text style={[styles.statNumber, { color: colors.text }]}>{totalTasks}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Tasks in DAGs</Text>
          </GlassCard>
          <GlassCard style={styles.statBox}>
            <Text style={[styles.statNumber, { color: colors.success }]}>{totalEvidence}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Evidence Items</Text>
          </GlassCard>
        </View>

        {/* System Architecture */}
        <SectionHeader title="System Architecture & Services" />
        <GlassCard style={{ padding: 0, overflow: 'hidden' }}>
          <SettingRow icon="cpu" title="AI Extraction Engine" value="Google Gemini 3.6 Flash (Connected)" />
          <SettingRow icon="check-circle" title="Schema Verification" value="Strict Zod Runtime Validation" />
          <SettingRow icon="git-branch" title="Dependency Resolution" value="Topological Requirement Graph (DAG)" />
          <SettingRow icon="server" title="Backend Server" value="Node Express 5 (Port 5001)" />
          <SettingRow icon="database" title="Database" value="PostgreSQL 16 via Docker (Port 5432)" />
          <SettingRow icon="hard-drive" title="Evidence Storage" value="Local SHA-256 Grounded Vault" isLast />
        </GlassCard>

        {/* Security & Privacy */}
        <SectionHeader title="Security & Privacy Policy" />
        <GlassCard style={{ padding: 0, overflow: 'hidden' }}>
          <SettingRow icon="lock" title="Source Document Privacy" value="Protected local filesystem only" />
          <SettingRow icon="eye" title="AI Transmission Disclosure" value="Explicit human disclosure before sending" />
          <SettingRow icon="key" title="Credential Security" value="Server-side environment variables only" isLast />
        </GlassCard>

        <SectionHeader title="Workspace Controls" />
        <View style={{ gap: 10 }}>
          <GlassCard>
            <Text style={[styles.subHeading, { color: colors.text, marginBottom: 4 }]}>Liquid Glass Aesthetic</Text>
            <Text style={[styles.subCaption, { color: colors.mutedForeground }]}>
              The application is locked to Light Mode to ensure maximum legibility and contrast against custom backgrounds.
            </Text>
          </GlassCard>
          <SecondaryButton
            label="Sign Out"
            icon="log-out"
            onPress={() => {
              signOut();
              router.push('/auth');
            }}
          />
        </View>
      </ScrollView>
    </View>
  );
}

function SettingRow({ icon, title, value, isLast = false }: { icon: keyof typeof Feather.glyphMap; title: string; value: string; isLast?: boolean }) {
  const colors = useColors();
  return (
    <View style={[styles.setting, !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
      <View style={[styles.iconCircle, { backgroundColor: colors.muted, borderColor: colors.border }]}>
        <Feather name={icon} size={16} color={colors.text} />
      </View>
      <View style={styles.settingCopy}>
        <Text style={[styles.settingTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.settingVal, { color: colors.mutedForeground }]}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'transparent' },
  content: { paddingHorizontal: 20, gap: 16 },
  profileTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  avatarText: { fontFamily: 'Inter_700Bold', fontSize: 20 },
  profileCopy: { flex: 1, gap: 2 },
  name: { fontFamily: 'Inter_700Bold', fontSize: 18 },
  email: { fontFamily: 'Inter_400Regular', fontSize: 13 },
  badgeLabel: { fontFamily: 'Inter_500Medium', fontSize: 12 },

  wallpaperCard: {
    padding: 18,
  },
  wallpaperHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  subHeading: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
  },
  subCaption: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    marginTop: 2,
  },
  presetRow: {
    gap: 12,
    paddingVertical: 6,
  },
  presetItem: {
    width: 100,
    height: 70,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1.5,
    position: 'relative',
  },
  presetItemSelected: {
    boxShadow: '0 0 12px rgba(255, 255, 255, 0.45)',
  } as any,
  presetThumb: {
    width: '100%',
    height: '100%',
  },
  presetOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  presetTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    color: '#FFFFFF',
  },
  activeCheck: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  switchDivider: {
    height: 1,
    marginVertical: 14,
  },

  statsGrid: { flexDirection: 'row', gap: 10 },
  statBox: { flex: 1, padding: 14, alignItems: 'center', gap: 4 },
  statNumber: { fontFamily: 'Inter_700Bold', fontSize: 22 },
  statLabel: { fontFamily: 'Inter_400Regular', fontSize: 12 },

  setting: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14 },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingCopy: { flex: 1, gap: 2 },
  settingTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  settingVal: { fontFamily: 'Inter_400Regular', fontSize: 12 },
});