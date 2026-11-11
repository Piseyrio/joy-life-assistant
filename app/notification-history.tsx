import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { EmptyState, ErrorState, LoadingState, Screen, Title } from '../src/components/ui';
import { useApp } from '../src/hooks/AppContext';
import { colors } from '../src/theme/colors';
import { formatInPhnomPenh } from '../src/utils/dates';
import type { NotificationHistory } from '../src/db/schema';

export default function NotificationHistoryScreen() {
  const { loadHistory } = useApp();
  const [rows, setRows] = useState<NotificationHistory[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setRows(await loadHistory());
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load');
      }
    })();
  }, [loadHistory]);

  if (error) return <ErrorState message={error} />;
  if (!rows) return <LoadingState />;

  return (
    <Screen>
      <Title>Notification history</Title>
      <FlatList
        data={rows}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 40, paddingTop: 8 }}
        ListEmptyComponent={<EmptyState title="No history yet" body="Scheduled reminders will appear here." />}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.event}>{item.event}</Text>
            <Text style={styles.title}>{item.title}</Text>
            {item.body ? <Text style={styles.body}>{item.body}</Text> : null}
            <Text style={styles.time}>{formatInPhnomPenh(item.createdAt)}</Text>
          </View>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    backgroundColor: colors.cards,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  event: { color: colors.cyan, fontWeight: '700', fontSize: 12 },
  title: { color: colors.text, fontWeight: '600', marginTop: 4 },
  body: { color: colors.secondary, marginTop: 2 },
  time: { color: colors.secondary, fontSize: 12, marginTop: 6 },
});
