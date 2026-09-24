import React from 'react';
import { View, Text, StyleSheet, Platform, Pressable, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import { GlassCard, GlassSwitch, PrimaryButton, SectionHeader } from '@/components/actionlayer-ui';

export const PRESET_WALLPAPERS = [
  {
    id: 'default',
    title: 'Mountain Vista',
    subtitle: 'Uploaded Landscape',
    uri: null, // triggers require('../assets/apple_glass_bg.jpg')
    preview: require('../assets/apple_glass_bg.jpg'),
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

export function WallpaperSettings() {
  const { customBg, setCustomBg, bgDim, setBgDim, theme, toggleTheme } = useApp();
  const colors = useColors();

  const handleFileUpload = (e: any) => {
    const file = e.target?.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setCustomBg(event.target.result as string);
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
    <View style={styles.container}>
      <SectionHeader title="Liquid Glass & Wallpaper" action="Reset Default" onAction={() => setCustomBg(null)} />
      <GlassCard style={styles.wallpaperCard}>
        <GlassSwitch
          label="Interface Theme"
          description={theme === 'dark' ? 'Dark mode active (white text)' : 'Light mode active (black text)'}
          value={theme === 'dark'}
          onValueChange={toggleTheme}
        />
        
        <View style={[styles.switchDivider, { backgroundColor: colors.border }]} />

        <View style={styles.wallpaperHeader}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={[styles.subHeading, { color: colors.text }]}>Background Wallpaper</Text>
            <Text style={[styles.subCaption, { color: colors.mutedForeground }]}>
              {customBg ? 'Custom user background active' : 'Default Mountain Vista (User Upload)'}
            </Text>
          </View>
          <PrimaryButton label="Upload Image" icon="image" onPress={triggerUpload} />
        </View>

        <Text style={[styles.subCaption, { marginTop: 12, marginBottom: 8, color: colors.mutedForeground }]}>Curated Glass Presets</Text>
        <View style={styles.presetGrid}>
          {PRESET_WALLPAPERS.map((preset) => {
            const isSelected = (!customBg && preset.id === 'default') || customBg === preset.uri;
            return (
              <Pressable
                key={preset.id}
                onPress={() => setCustomBg(preset.uri)}
                style={[
                  styles.presetItem,
                  { borderColor: isSelected ? colors.text : colors.border },
                  isSelected && styles.presetItemSelected,
                ]}
              >
                <Image source={preset.preview} style={styles.presetThumb} resizeMode="cover" />
                <View style={styles.presetOverlay}>
                  <Text style={styles.presetTitle}>{preset.title}</Text>
                  {isSelected && (
                    <View style={styles.activeCheck}>
                      <Feather name="check" size={12} color="#0A0D14" />
                    </View>
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>

        <View style={[styles.switchDivider, { backgroundColor: colors.border }]} />
        <GlassSwitch
          label="Ambient Contrast Scrim"
          description="Deepen the subtle dark vignette to enhance text sharpness against bright backgrounds"
          value={isDeepDim}
          onValueChange={(val) => setBgDim(val ? 0.42 : 0.20)}
        />
      </GlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
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
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
});
