import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Screen, Subtitle, Title, Muted } from '../../src/components/ui';
import { getAiProvider } from '../../src/ai/provider';
import { useApp } from '../../src/hooks/AppContext';
import { colors } from '../../src/theme/colors';

export default function AssistantScreen() {
  const provider = getAiProvider();
  const { today } = useApp();

  const snapshot = useMemo(() => {
    if (!today) return null;
    return {
      overdue: today.overdue.length,
      dueToday: today.dueToday.length,
      top: today.topPriorities.map((t) => t.title).slice(0, 3),
    };
  }, [today]);

  return (
    <Screen style={styles.center}>
      <Title>Assistant</Title>
      <Subtitle>Coming later, optional</Subtitle>
      <Text style={styles.body}>
        Joy stays fully offline. A future optional AI provider can plug in through a TypeScript
        interface (`AiProvider`) without the reminder core depending on the internet.
      </Text>

      {snapshot ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Local snapshot (stays on device)</Text>
          <Text style={styles.meta}>
            Overdue {snapshot.overdue} · Due today {snapshot.dueToday}
          </Text>
          {snapshot.top.length > 0 ? (
            <Text style={styles.meta}>Top priorities: {snapshot.top.join(' · ')}</Text>
          ) : (
            <Muted>No open priorities right now.</Muted>
          )}
        </View>
      ) : null}

      <View style={styles.badge}>
        <Text style={styles.badgeText}>
          Current provider: {provider.id} · network required: {provider.requiresNetwork ? 'yes' : 'no'}
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { paddingTop: 32 },
  body: { color: colors.secondary, lineHeight: 22, marginTop: 12 },
  card: {
    marginTop: 20,
    backgroundColor: colors.cards,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  cardTitle: { color: colors.text, fontWeight: '700', marginBottom: 4 },
  meta: { color: colors.secondary, lineHeight: 20 },
  badge: {
    marginTop: 16,
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badgeText: { color: colors.cyan },
});
