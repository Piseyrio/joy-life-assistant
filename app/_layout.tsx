import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AppProvider } from '../src/hooks/AppContext';
import { LockGate } from '../src/components/LockGate';
import { colors } from '../src/theme/colors';

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
    primary: colors.blue,
  },
};

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppProvider>
        <LockGate>
          <ThemeProvider value={navTheme}>
            <StatusBar style="light" />
            <Stack screenOptions={{ headerStyle: { backgroundColor: colors.surface }, headerTintColor: colors.text }}>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="task/[id]" options={{ title: 'Task' }} />
              <Stack.Screen name="project/[id]" options={{ title: 'Project' }} />
              <Stack.Screen name="notes/index" options={{ title: 'Notes' }} />
              <Stack.Screen name="notes/[id]" options={{ title: 'Note' }} />
              <Stack.Screen name="settings" options={{ title: 'Settings' }} />
              <Stack.Screen name="backup" options={{ title: 'Backup & restore' }} />
              <Stack.Screen name="battery-guide" options={{ title: 'Battery & Autostart' }} />
              <Stack.Screen name="notification-history" options={{ title: 'Notification history' }} />
            </Stack>
          </ThemeProvider>
        </LockGate>
      </AppProvider>
    </GestureHandlerRootView>
  );
}
