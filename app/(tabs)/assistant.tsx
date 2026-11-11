import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Screen, Subtitle, Title } from '../../src/components/ui';
import { getAiProvider } from '../../src/ai/provider';
import { colors } from '../../src/theme/colors';

export default function AssistantScreen() {
  const provider = getAiProvider();

  return (
    <Screen style={styles.center}>
      <Title>Assistant</Title>
      <Subtitle>Coming later, optional</Subtitle>
      <Text style={styles.body}>
        Joy stays fully offline. A future optional AI provider can plug in through a TypeScript
        interface (`AiProvider`) without the reminder core depending on the internet.
      </Text>
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
  badge: {
    marginTop: 20,
    backgroundColor: colors.cards,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badgeText: { color: colors.cyan },
});
