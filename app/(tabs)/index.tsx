import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { EmptyState, ErrorState, LoadingState, Muted, Screen, Subtitle, Title } from '../../src/components/ui';
import { TaskRow } from '../../src/components/TaskRow';
import { useApp } from '../../src/hooks/AppContext';
import { colors } from '../../src/theme/colors';

function Section({
  title,
  children,
  empty,
}: {
  title: string;
  children: React.ReactNode;
  empty?: boolean;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {empty ? <Muted>Nothing here — nice work.</Muted> : children}
    </View>
  );
}

export default function TodayScreen() {
  const { ready, error, today, markDone, permissionMessage, refresh } = useApp();
  const router = useRouter();

  if (!ready && !error) return <LoadingState label="Starting Joy…" />;
  if (error) return <ErrorState message={error} onRetry={refresh} />;
  if (!today) return <EmptyState title="Today" body="No dashboard data yet." />;

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <Title>Today</Title>
        <Subtitle>Stay gentle. Stay on it.</Subtitle>
        {permissionMessage ? (
          <View style={styles.banner}>
            <Text style={styles.bannerText}>{permissionMessage}</Text>
          </View>
        ) : null}

        <Section title="Overdue" empty={today.overdue.length === 0}>
          {today.overdue.map((t) => (
            <TaskRow
              key={t.id}
              task={t}
              onPress={() => router.push(`/task/${t.id}`)}
              onToggleDone={() => markDone(t.id)}
            />
          ))}
        </Section>

        <Section title="Due today" empty={today.dueToday.length === 0}>
          {today.dueToday.map((t) => (
            <TaskRow
              key={t.id}
              task={t}
              onPress={() => router.push(`/task/${t.id}`)}
              onToggleDone={() => markDone(t.id)}
            />
          ))}
        </Section>

        <Section title="Top 3 priorities" empty={today.topPriorities.length === 0}>
          {today.topPriorities.map((t) => (
            <TaskRow
              key={t.id}
              task={t}
              onPress={() => router.push(`/task/${t.id}`)}
              onToggleDone={() => markDone(t.id)}
            />
          ))}
        </Section>

        <Section title="Completed today" empty={today.completedToday.length === 0}>
          {today.completedToday.map((t) => (
            <TaskRow key={t.id} task={t} onPress={() => router.push(`/task/${t.id}`)} />
          ))}
        </Section>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 16 },
  sectionTitle: {
    color: colors.cyan,
    fontWeight: '700',
    fontSize: 14,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  banner: {
    backgroundColor: colors.surface,
    borderColor: colors.warning,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginTop: 8,
  },
  bannerText: { color: colors.warning, fontSize: 13 },
});
