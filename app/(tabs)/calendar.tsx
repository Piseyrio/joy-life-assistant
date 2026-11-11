import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { EmptyState, LoadingState, Screen, Title } from '../../src/components/ui';
import { TaskRow } from '../../src/components/TaskRow';
import { getDayAgenda, getWeekAgenda, type AgendaDay } from '../../src/services/calendarService';
import { completeTask } from '../../src/services/taskService';
import { cancelTaskReminders } from '../../src/services/reminderService';
import { colors } from '../../src/theme/colors';
import { addDaysUtc, formatInPhnomPenh } from '../../src/utils/dates';
import { useApp } from '../../src/hooks/AppContext';

export default function CalendarScreen() {
  const router = useRouter();
  const { refresh, markDone } = useApp();
  const [mode, setMode] = useState<'day' | 'week'>('day');
  const [anchor, setAnchor] = useState(Date.now());
  const [days, setDays] = useState<AgendaDay[] | null>(null);

  const load = useCallback(async () => {
    if (mode === 'day') {
      setDays([await getDayAgenda(anchor)]);
    } else {
      setDays(await getWeekAgenda(anchor));
    }
  }, [mode, anchor]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  if (!days) return <LoadingState />;

  return (
    <Screen>
      <Title>Calendar</Title>
      <View style={styles.switchRow}>
        <Pressable onPress={() => setMode('day')} style={[styles.seg, mode === 'day' && styles.segOn]}>
          <Text style={styles.segText}>Day</Text>
        </Pressable>
        <Pressable onPress={() => setMode('week')} style={[styles.seg, mode === 'week' && styles.segOn]}>
          <Text style={styles.segText}>Week</Text>
        </Pressable>
      </View>
      <View style={styles.nav}>
        <Pressable onPress={() => setAnchor((a) => addDaysUtc(a, mode === 'week' ? -7 : -1))}>
          <Text style={styles.navText}>← Prev</Text>
        </Pressable>
        <Text style={styles.navCenter}>{formatInPhnomPenh(anchor, 'EEE, MMM d')}</Text>
        <Pressable onPress={() => setAnchor((a) => addDaysUtc(a, mode === 'week' ? 7 : 1))}>
          <Text style={styles.navText}>Next →</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: 140 }}>
        {days.map((d) => (
          <View key={d.dateKey} style={styles.day}>
            <Text style={styles.dayTitle}>{d.dateKey}</Text>
            {d.tasks.length === 0 ? (
              <EmptyState title="Free" body="No due tasks this day." />
            ) : (
              d.tasks.map((t) => (
                <TaskRow
                  key={t.id}
                  task={t}
                  onPress={() => router.push(`/task/${t.id}`)}
                  onToggleDone={async () => {
                    if (markDone) await markDone(t.id);
                    else {
                      await completeTask(t.id);
                      await cancelTaskReminders(t.id);
                      await refresh();
                    }
                    await load();
                  }}
                />
              ))
            )}
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  switchRow: { flexDirection: 'row', gap: 8, marginVertical: 8 },
  seg: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  segOn: { borderColor: colors.blue, backgroundColor: colors.cards },
  segText: { color: colors.text, fontWeight: '700' },
  nav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  navText: { color: colors.cyan, fontWeight: '700' },
  navCenter: { color: colors.text, fontWeight: '600' },
  day: { marginTop: 8 },
  dayTitle: { color: colors.cyan, fontWeight: '700', marginBottom: 6 },
});
