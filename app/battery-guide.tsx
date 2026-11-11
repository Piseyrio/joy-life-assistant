import * as IntentLauncher from 'expo-intent-launcher';
import React from 'react';
import { Linking, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PrimaryButton, Screen, SecondaryButton, Subtitle, Title } from '../src/components/ui';
import { colors } from '../src/theme/colors';

async function openAppSettings() {
  await Linking.openSettings();
}

async function openBatterySettings() {
  if (Platform.OS !== 'android') return;
  try {
    await IntentLauncher.startActivityAsync(
      IntentLauncher.ActivityAction.IGNORE_BATTERY_OPTIMIZATION_SETTINGS,
    );
  } catch {
    try {
      await IntentLauncher.startActivityAsync(IntentLauncher.ActivityAction.APPLICATION_DETAILS_SETTINGS, {
        data: 'package:com.joylife.assistant',
      });
    } catch {
      await openAppSettings();
    }
  }
}

export default function BatteryGuideScreen() {
  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <Title>Realme / ColorOS</Title>
        <Subtitle>Keep reminders reliable</Subtitle>
        <Text style={styles.p}>
          ColorOS can pause apps to save battery. For JOY LIFE ASSISTANT reminders to fire after you swipe
          the app away, lock the phone, or reboot, please allow the app to run in the background.
        </Text>

        <View style={styles.card}>
          <Text style={styles.step}>1. Allow auto-start</Text>
          <Text style={styles.p}>
            Settings → App management → JOY LIFE ASSISTANT → Auto-start / Autolaunch → On.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.step}>2. Disable battery restriction</Text>
          <Text style={styles.p}>
            Settings → Battery → More battery settings / App battery management → JOY LIFE ASSISTANT →
            Unrestricted / Don&apos;t optimize.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.step}>3. Lock in Recents</Text>
          <Text style={styles.p}>
            Open Recents, find JOY LIFE ASSISTANT, tap the lock icon so ColorOS does not kill it.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.step}>4. Exact alarms (Android 12+)</Text>
          <Text style={styles.p}>
            Settings → Apps → Special app access → Alarms &amp; reminders → allow JOY LIFE ASSISTANT.
          </Text>
        </View>

        <PrimaryButton label="Open battery optimization settings" onPress={openBatterySettings} />
        <View style={{ height: 10 }} />
        <SecondaryButton label="Open app settings" onPress={openAppSettings} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  p: { color: colors.secondary, lineHeight: 20, marginBottom: 8 },
  card: {
    backgroundColor: colors.cards,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  step: { color: colors.text, fontWeight: '700', marginBottom: 4 },
});
