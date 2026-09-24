import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomSheet, GlassCard, PrimaryButton, SecondaryButton, SectionHeader, StatusBadge, TextField, ui } from '@/components/actionlayer-ui';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import type { ActivityEvent } from '@/context/AppContext';

export default function ActivityScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { activities, editActivity, removeActivity } = useApp();
  
  const [editingEvent, setEditingEvent] = useState<ActivityEvent | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDetail, setEditDetail] = useState('');

  const handleEditSave = () => {
    if (editingEvent && editTitle.trim()) {
      editActivity(editingEvent.id, editTitle, editDetail);
      setEditingEvent(null);
    }
  };

  const handleDelete = (id: string) => {
    removeActivity(id);
    if (editingEvent?.id === id) setEditingEvent(null);
  };

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 18, paddingBottom: 110 }]}>
        <Text style={[ui.eyebrow, { color: colors.mutedForeground }]}>ACTIVITY & AUDIT LOG</Text>
        <Text style={[styles.title, { color: colors.text }]}>A clear record of progress</Text>
        <Text style={[styles.subTitle, { color: colors.mutedForeground }]}>
          Every important change is recorded with grounded cryptographic confidence.
        </Text>
        <SectionHeader title="Recent Activity" />
        
        {activities.length === 0 ? (
          <GlassCard style={{ alignItems: 'center', padding: 32 }}>
            <Feather name="clock" size={40} color={colors.mutedForeground} style={{ marginBottom: 12 }} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No activity recorded yet.</Text>
          </GlassCard>
        ) : (
          <GlassCard style={styles.timelineCard}>
            {activities.map((event, index) => {
              const dotColor = event.tone === 'success' ? '#34D399' : event.tone === 'warning' ? '#FBBF24' : '#60A5FA';
              return (
                <View key={event.id} style={styles.event}>
                  <View style={styles.rail}>
                    <View style={[styles.dot, { backgroundColor: dotColor, boxShadow: `0 0 10px ${dotColor}` } as any]} />
                    {index < activities.length - 1 && <View style={[styles.line, { backgroundColor: colors.border }]} />}
                  </View>
                  <View style={styles.eventCopy}>
                    <View style={styles.eventTop}>
                      <Text style={[styles.eventTitle, { color: colors.text }]}>{event.title}</Text>
                      <StatusBadge label={event.tone === 'success' ? 'Done' : event.tone === 'warning' ? 'Review' : 'Info'} tone={event.tone} />
                    </View>
                    <Text style={[styles.eventDetail, { color: colors.mutedForeground }]}>{event.detail}</Text>
                    
                    <View style={styles.eventBottom}>
                      <Text style={[styles.time, { color: colors.mutedForeground }]}>{event.time}</Text>
                      <View style={styles.actions}>
                        <Pressable 
                          onPress={() => {
                            setEditingEvent(event);
                            setEditTitle(event.title);
                            setEditDetail(event.detail);
                          }} 
                          style={[styles.actionBtn, { backgroundColor: colors.muted, borderColor: colors.border }]}
                        >
                          <Feather name="edit-2" size={14} color={colors.text} />
                        </Pressable>
                        <Pressable onPress={() => handleDelete(event.id)} style={[styles.actionBtn, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                          <Feather name="trash-2" size={14} color={colors.destructive} />
                        </Pressable>
                      </View>
                    </View>
                  </View>
                </View>
              );
            })}
          </GlassCard>
        )}
      </ScrollView>

      <BottomSheet
        visible={Boolean(editingEvent)}
        title="Edit Activity"
        onClose={() => setEditingEvent(null)}
      >
        {editingEvent && (
          <View style={{ gap: 12 }}>
            <TextField
              label="Activity Title"
              value={editTitle}
              onChangeText={setEditTitle}
            />
            <TextField
              label="Activity Detail"
              value={editDetail}
              onChangeText={setEditDetail}
              multiline
            />
            <PrimaryButton
              label="Save Changes"
              icon="check"
              disabled={!editTitle.trim()}
              onPress={handleEditSave}
            />
            <SecondaryButton
              label="Cancel"
              onPress={() => setEditingEvent(null)}
            />
          </View>
        )}
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'transparent' },
  content: { paddingHorizontal: 20, gap: 16 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 28, letterSpacing: -0.6, marginTop: 4 },
  subTitle: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19 },
  emptyText: { fontFamily: 'Inter_500Medium', fontSize: 14 },

  timelineCard: { padding: 18, gap: 4 },
  event: { flexDirection: 'row', gap: 14, minHeight: 84 },
  rail: { width: 16, alignItems: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5, marginTop: 5 },
  line: { width: 1, flex: 1, marginVertical: 6 },
  eventCopy: { flex: 1, gap: 4, paddingBottom: 16 },
  eventTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  eventTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 15, flex: 1 },
  eventDetail: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 18 },
  eventBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  time: { fontFamily: 'Inter_500Medium', fontSize: 11 },
  actions: { flexDirection: 'row', gap: 10 },
  actionBtn: {
    padding: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
});