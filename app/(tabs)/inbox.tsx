import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import {
  EmptyState,
  ErrorState,
  Field,
  LoadingState,
  PrimaryButton,
  Screen,
  Title,
} from '../../src/components/ui';
import { TaskRow } from '../../src/components/TaskRow';
import { useApp } from '../../src/hooks/AppContext';
import { colors } from '../../src/theme/colors';

export default function InboxScreen() {
  const { ready, error, inbox, addTask, markDone, removeTask, refresh } = useApp();
  const [title, setTitle] = useState('');
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  if (!ready && !error) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={refresh} />;

  async function onAdd() {
    if (!title.trim()) return;
    setBusy(true);
    try {
      await addTask({ title: title.trim() });
      setTitle('');
    } finally {
      setBusy(false);
    }
  }

  function confirmDelete(id: string, name: string) {
    Alert.alert('Delete task?', `"${name}" will be removed permanently.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => removeTask(id),
      },
    ]);
  }

  return (
    <Screen>
      <Title>Inbox</Title>
      <View style={styles.addRow}>
        <View style={{ flex: 1 }}>
          <Field value={title} onChangeText={setTitle} placeholder="Add a task…" />
        </View>
        <PrimaryButton label={busy ? '…' : 'Add'} onPress={onAdd} disabled={busy} />
      </View>

      <FlatList
        data={inbox}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 140, paddingTop: 12 }}
        ListEmptyComponent={
          <EmptyState title="Inbox is clear" body="Capture anything with ＋ or the field above." />
        }
        renderItem={({ item }) => (
          <View>
            <TaskRow
              task={item}
              onPress={() => router.push(`/task/${item.id}`)}
              onToggleDone={() => markDone(item.id)}
            />
            <Text
              style={styles.delete}
              onPress={() => confirmDelete(item.id, item.title)}
              accessibilityRole="button"
            >
              Delete
            </Text>
          </View>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  addRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  delete: {
    color: colors.danger,
    alignSelf: 'flex-end',
    marginBottom: 10,
    marginTop: -4,
    fontWeight: '600',
  },
});
