import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomSheet, PrimaryButton, SecondaryButton, TextField, ui } from '@/components/actionlayer-ui';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';

export default function CaptureScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { agent, createDemoAgent } = useApp();
  const [sheet, setSheet] = useState<'text' | 'url' | null>(null);
  const [value, setValue] = useState('');
  const [processing, setProcessing] = useState(false);

  const startProcessing = (source: string) => {
    setProcessing(true);
    setTimeout(() => { setProcessing(false); createDemoAgent(); router.push(`/review/${agent.id}`); }, 700);
    Alert.alert('Source preserved', `${source} is queued for structured extraction. Demo mode uses a deterministic provider.`);
  };
  const chooseImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) { Alert.alert('Photo permission needed', 'Allow photo access to capture a poster or screenshot.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.85 });
    if (!result.canceled) startProcessing('Poster image');
  };

  return <View style={[styles.root, { backgroundColor: colors.background }]}><ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 18, paddingBottom: 110 }]}><Text style={[ui.eyebrow, { color: colors.primary }]}>ACTION COMPILER</Text><Text style={[styles.title, { color: colors.foreground }]}>What should become an agent?</Text><Text style={[ui.body, { color: colors.mutedForeground, textAlign: 'left' }]}>Preserve the original source first. We will show what was found, what is uncertain, and what you can correct before anything becomes a task.</Text><View style={[styles.sourceList, { backgroundColor: colors.card, borderColor: colors.border }]}><SourceOption icon="camera" title="Camera or screenshot" detail="Capture a poster or notice" onPress={chooseImage} /><SourceOption icon="image" title="Gallery image" detail="Use a saved screenshot" onPress={chooseImage} /><SourceOption icon="file-text" title="PDF document" detail="Upload a brief or announcement" onPress={() => startProcessing('PDF document')} /><SourceOption icon="edit-3" title="Paste text" detail="Bring in a message or instructions" onPress={() => setSheet('text')} /><SourceOption icon="link" title="Add a URL" detail="Fetch permitted public content" onPress={() => setSheet('url')} /></View><View style={[styles.sourceNotice, { backgroundColor: colors.secondary }]}><Feather name="lock" size={16} color={colors.primary} /><Text style={[ui.caption, { color: colors.foreground, flex: 1 }]}>Sources are private by default. You can delete the original material from Profile.</Text></View>{processing && <View style={styles.processing}><Feather name="loader" size={18} color={colors.primary} /><Text style={[ui.captionStrong, { color: colors.foreground }]}>Reading source · identifying requirements · preparing review</Text></View>}</ScrollView><BottomSheet visible={sheet !== null} title={sheet === 'url' ? 'Add a public URL' : 'Paste source text'} onClose={() => setSheet(null)}>{sheet === 'url' ? <TextField label="Website URL" value={value} onChangeText={setValue} placeholder="https://example.org/opportunity" /> : <TextField label="Source text" value={value} onChangeText={setValue} placeholder="Paste the full announcement here…" multiline />}<PrimaryButton label="Preserve and review" icon="arrow-right" disabled={value.trim().length < 8} onPress={() => { setSheet(null); startProcessing(sheet === 'url' ? 'Public URL' : 'Pasted text'); }} /><SecondaryButton label="Cancel" onPress={() => setSheet(null)} /></BottomSheet></View>;
}

function SourceOption({ icon, title, detail, onPress }: { icon: keyof typeof Feather.glyphMap; title: string; detail: string; onPress: () => void }) {
  const colors = useColors();
  return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.sourceOption, { borderBottomColor: colors.border, opacity: pressed ? 0.65 : 1 }]}><View style={[styles.sourceIcon, { backgroundColor: colors.secondary }]}><Feather name={icon} size={20} color={colors.primary} /></View><View style={styles.sourceCopy}><Text style={[styles.sourceTitle, { color: colors.foreground }]}>{title}</Text><Text style={[ui.caption, { color: colors.mutedForeground }]}>{detail}</Text></View><Feather name="chevron-right" size={18} color={colors.mutedForeground} /></Pressable>;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 16 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 29, letterSpacing: -0.7, lineHeight: 34, marginTop: 4 },
  sourceList: { borderWidth: 1, borderRadius: 18, overflow: 'hidden' },
  sourceOption: { minHeight: 72, padding: 13, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  sourceIcon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  sourceCopy: { flex: 1, gap: 3 },
  sourceTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 15 },
  sourceNotice: { flexDirection: 'row', alignItems: 'center', gap: 9, padding: 13, borderRadius: 12 },
  processing: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingVertical: 10 },
});