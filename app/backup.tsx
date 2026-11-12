import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  Field,
  PrimaryButton,
  Screen,
  SecondaryButton,
  Title,
} from '../src/components/ui';
import {
  daysSinceBackup,
  pickBackupFile,
  previewRestore,
  restoreBackup,
  shareBackup,
  type RestorePreview,
} from '../src/services/backupService';
import { useApp } from '../src/hooks/AppContext';
import { colors } from '../src/theme/colors';
import { formatInPhnomPenh } from '../src/utils/dates';

export default function BackupScreen() {
  const { settings, refresh } = useApp();
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<RestorePreview | null>(null);
  const [uri, setUri] = useState<string | null>(null);

  const last = settings?.lastBackupAt ?? null;
  const age = daysSinceBackup(last);

  function requirePassword(): boolean {
    if (!password || password.length < 4) {
      Alert.alert('Password required', 'Use at least 4 characters. Joy cannot recover a forgotten password.');
      return false;
    }
    return true;
  }

  async function onExport() {
    if (!requirePassword()) return;
    setBusy(true);
    try {
      await shareBackup(password);
      await refresh();
      Alert.alert('Backup ready', 'Save the file somewhere besides this phone.');
    } catch (e) {
      Alert.alert('Export failed', e instanceof Error ? e.message : 'Error');
    } finally {
      setBusy(false);
    }
  }

  async function onPick() {
    if (!requirePassword()) return;
    setBusy(true);
    try {
      const file = await pickBackupFile();
      const p = await previewRestore(file, password);
      setUri(file);
      setPreview(p);
    } catch (e) {
      Alert.alert('Could not open backup', e instanceof Error ? e.message : 'Error');
      setPreview(null);
      setUri(null);
    } finally {
      setBusy(false);
    }
  }

  async function runRestore(mode: 'merge' | 'replace_empty') {
    if (!uri) return;
    if (!requirePassword()) return;
    setBusy(true);
    try {
      const result = await restoreBackup(uri, password, mode);
      await refresh();
      Alert.alert(
        'Restore complete',
        `Inserted ${result.inserted}, skipped ${result.skipped} existing IDs.`,
      );
      setPreview(null);
      setUri(null);
    } catch (e) {
      Alert.alert('Restore rejected', e instanceof Error ? e.message : 'Error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <Title>Backup & restore</Title>
        <Text style={styles.hint}>
          Encrypted on this phone (scrypt + AES-256-GCM). Joy never uploads the file. Uninstalling the app
          can erase local data — keep a copy off-device.
        </Text>
        <Text style={styles.meta}>
          Last backup:{' '}
          {last ? `${formatInPhnomPenh(last)} (${age} day(s) ago)` : 'never'}
        </Text>

        <Text style={styles.label}>Password</Text>
        <Field value={password} onChangeText={setPassword} placeholder="Backup password (min 4)" secure />

        <View style={{ height: 12 }} />
        <PrimaryButton
          label={busy ? 'Working…' : 'Export encrypted backup'}
          onPress={onExport}
          disabled={busy}
        />
        <View style={{ height: 10 }} />
        <SecondaryButton label="Choose backup file to restore" onPress={onPick} />

        {preview ? (
          <View style={styles.preview}>
            <Text style={styles.label}>Restore preview</Text>
            <Text style={styles.meta}>App {preview.appVersion}</Text>
            <Text style={styles.meta}>Created {formatInPhnomPenh(preview.createdAt)}</Text>
            <Text style={styles.meta}>Incoming: {JSON.stringify(preview.counts)}</Text>
            <Text style={styles.meta}>On this phone: {JSON.stringify(preview.existingCounts)}</Text>
            <Text style={styles.hint}>Existing IDs are never overwritten.</Text>
            <PrimaryButton
              label="Merge (skip existing IDs)"
              onPress={() => runRestore('merge')}
              disabled={busy}
            />
            <View style={{ height: 8 }} />
            <SecondaryButton
              label="Replace into empty database"
              onPress={() => {
                if (!preview.canReplaceEmpty) {
                  Alert.alert(
                    'Database is not empty',
                    'Replace is only allowed on a fresh install with no records. Use merge instead.',
                  );
                  return;
                }
                runRestore('replace_empty');
              }}
            />
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hint: { color: colors.secondary, lineHeight: 20, marginBottom: 10 },
  meta: { color: colors.secondary, marginBottom: 6 },
  label: { color: colors.cyan, fontWeight: '700', marginTop: 12, marginBottom: 6 },
  preview: {
    marginTop: 16,
    backgroundColor: colors.cards,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
