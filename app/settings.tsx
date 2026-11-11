import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import {
  Field,
  LoadingState,
  PrimaryButton,
  Screen,
  SecondaryButton,
  Title,
} from '../src/components/ui';
import { useApp } from '../src/hooks/AppContext';
import { colors } from '../src/theme/colors';
import type { AppSettings } from '../src/types/models';

export default function SettingsScreen() {
  const { settings, saveSettings, ready } = useApp();
  const router = useRouter();
  const [draft, setDraft] = useState<AppSettings | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (settings) setDraft(settings);
  }, [settings]);

  if (!ready || !draft) return <LoadingState />;

  function set<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
    setDraft((d) => (d ? { ...d, [key]: value } : d));
  }

  async function onSave() {
    if (!draft) return;
    setBusy(true);
    try {
      await saveSettings(draft);
      Alert.alert('Saved', 'Settings updated and reminders reconciled.');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Could not save');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <Title>Settings</Title>
        <Text style={styles.hint}>Timezone: Asia/Phnom_Penh · All data stays on this phone.</Text>

        <Text style={styles.label}>Quiet hours start (HH:mm)</Text>
        <Field value={draft.quietHoursStart} onChangeText={(t) => set('quietHoursStart', t)} />
        <Text style={styles.label}>Quiet hours end (HH:mm)</Text>
        <Field value={draft.quietHoursEnd} onChangeText={(t) => set('quietHoursEnd', t)} />

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Reminder repeats (30m / 2h)</Text>
          <Switch
            value={draft.reminderRepeatsEnabled}
            onValueChange={(v) => set('reminderRepeatsEnabled', v)}
            trackColor={{ true: colors.blue }}
          />
        </View>

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Next-morning reminder</Text>
          <Switch
            value={draft.nextMorningEnabled}
            onValueChange={(v) => set('nextMorningEnabled', v)}
            trackColor={{ true: colors.blue }}
          />
        </View>
        <Text style={styles.label}>Next morning time (HH:mm)</Text>
        <Field value={draft.nextMorningTime} onChangeText={(t) => set('nextMorningTime', t)} />

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Evening review</Text>
          <Switch
            value={draft.eveningReviewEnabled}
            onValueChange={(v) => set('eveningReviewEnabled', v)}
            trackColor={{ true: colors.blue }}
          />
        </View>
        <Text style={styles.label}>Evening review time (HH:mm)</Text>
        <Field value={draft.eveningReviewTime} onChangeText={(t) => set('eveningReviewTime', t)} />

        <View style={{ height: 16 }} />
        <PrimaryButton label={busy ? 'Saving…' : 'Save settings'} onPress={onSave} disabled={busy} />
        <View style={{ height: 10 }} />
        <SecondaryButton
          label="Realme / ColorOS battery guide"
          onPress={() => router.push('/battery-guide')}
        />
        <View style={{ height: 10 }} />
        <SecondaryButton
          label="Notification history"
          onPress={() => router.push('/notification-history')}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hint: { color: colors.secondary, marginBottom: 12 },
  label: { color: colors.cyan, fontWeight: '700', marginTop: 14, marginBottom: 6 },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  switchLabel: { color: colors.text, fontWeight: '600', flex: 1, paddingRight: 12 },
});
