import { Tabs, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { QuickCapture } from '../../src/components/QuickCapture';
import { useApp } from '../../src/hooks/AppContext';
import { colors } from '../../src/theme/colors';

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  return (
    <Text style={{ color: focused ? colors.blue : colors.secondary, fontSize: 11, fontWeight: '700' }}>
      {label}
    </Text>
  );
}

export default function TabLayout() {
  const { capture } = useApp();
  const [captureOpen, setCaptureOpen] = useState(false);
  const router = useRouter();

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            height: 64,
            paddingBottom: 8,
            paddingTop: 8,
          },
          tabBarActiveTintColor: colors.blue,
          tabBarInactiveTintColor: colors.secondary,
          headerRight: () => (
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/settings')}
              style={{ marginRight: 12 }}
            >
              <Text style={{ color: colors.cyan, fontWeight: '700' }}>Settings</Text>
            </Pressable>
          ),
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Today',
            tabBarIcon: ({ focused }) => <TabIcon label="●" focused={focused} />,
            tabBarLabel: 'Today',
          }}
        />
        <Tabs.Screen
          name="inbox"
          options={{
            title: 'Inbox',
            tabBarIcon: ({ focused }) => <TabIcon label="●" focused={focused} />,
            tabBarLabel: 'Inbox',
          }}
        />
        <Tabs.Screen
          name="projects"
          options={{
            title: 'Projects',
            tabBarIcon: ({ focused }) => <TabIcon label="●" focused={focused} />,
            tabBarLabel: 'Projects',
          }}
        />
        <Tabs.Screen
          name="calendar"
          options={{
            title: 'Calendar',
            tabBarIcon: ({ focused }) => <TabIcon label="●" focused={focused} />,
            tabBarLabel: 'Calendar',
          }}
        />
        <Tabs.Screen
          name="assistant"
          options={{
            title: 'Assistant',
            tabBarIcon: ({ focused }) => <TabIcon label="●" focused={focused} />,
            tabBarLabel: 'Assistant',
          }}
        />
      </Tabs>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Quick capture"
        onPress={() => setCaptureOpen(true)}
        style={styles.fab}
      >
        <Text style={styles.fabText}>＋</Text>
      </Pressable>

      <QuickCapture
        visible={captureOpen}
        onClose={() => setCaptureOpen(false)}
        onSubmit={async (title) => {
          await capture(title);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 18,
    bottom: 84,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  fabText: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '700',
    marginTop: -2,
  },
});
