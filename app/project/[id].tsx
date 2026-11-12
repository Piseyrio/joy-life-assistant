import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  EmptyState,
  ErrorState,
  Field,
  LoadingState,
  PrimaryButton,
  Screen,
  SecondaryButton,
  Title,
} from '../../src/components/ui';
import { TaskRow } from '../../src/components/TaskRow';
import {
  archiveProject,
  getProject,
  listProjectTasks,
  projectProgress,
  unarchiveProject,
  updateProject,
} from '../../src/services/projectService';
import type { Project, Task } from '../../src/db/schema';
import { colors } from '../../src/theme/colors';
import { useApp } from '../../src/hooks/AppContext';

const PROJECT_COLORS = ['#3B9EFF', '#55C7E8', '#7C9CFF', '#5AD1A5', '#E8A55C'];

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { markDone } = useApp();
  const [project, setProject] = useState<Project | null>(null);
  const [items, setItems] = useState<Task[]>([]);
  const [name, setName] = useState('');
  const [color, setColor] = useState(PROJECT_COLORS[0]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const p = await getProject(id);
    if (!p) {
      setError('Project not found');
      return;
    }
    setProject(p);
    setName(p.name);
    setColor(p.color ?? PROJECT_COLORS[0]);
    setItems(await listProjectTasks(id));
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  if (error) return <ErrorState message={error} />;
  if (!project) return <LoadingState />;

  const prog = projectProgress(items);

  return (
    <Screen>
      <Title>{project.archivedAt ? 'Archived project' : 'Project'}</Title>
      <Field value={name} onChangeText={setName} placeholder="Name" />
      <View style={styles.colorRow}>
        {PROJECT_COLORS.map((c) => (
          <Pressable
            key={c}
            onPress={() => setColor(c)}
            style={[styles.swatch, { backgroundColor: c }, color === c && styles.swatchOn]}
            accessibilityRole="button"
            accessibilityLabel={`Color ${c}`}
          />
        ))}
      </View>
      <PrimaryButton
        label={busy ? 'Saving…' : 'Save'}
        disabled={busy}
        onPress={async () => {
          setBusy(true);
          try {
            await updateProject(id, { name, color });
            await load();
          } finally {
            setBusy(false);
          }
        }}
      />
      <Text style={styles.progress}>
        Progress: {prog.done}/{prog.total} ({prog.pct}%)
      </Text>
      <FlatList
        data={items}
        keyExtractor={(t) => t.id}
        contentContainerStyle={{ paddingBottom: 40 }}
        ListEmptyComponent={
          <EmptyState title="No tasks yet" body="Move tasks here from Inbox or a task’s project picker." />
        }
        renderItem={({ item }) => (
          <TaskRow
            task={item}
            onPress={() => router.push(`/task/${item.id}`)}
            onToggleDone={async () => {
              await markDone(item.id);
              await load();
            }}
          />
        )}
      />
      <SecondaryButton
        label={project.archivedAt ? 'Unarchive' : 'Archive project'}
        onPress={async () => {
          if (project.archivedAt) {
            await unarchiveProject(id);
            router.back();
            return;
          }
          Alert.alert('Archive?', 'The project is hidden, not deleted.', [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Archive',
              onPress: async () => {
                await archiveProject(id);
                router.back();
              },
            },
          ]);
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  progress: { color: colors.cyan, fontWeight: '700', marginVertical: 12 },
  colorRow: { flexDirection: 'row', gap: 8, marginVertical: 10 },
  swatch: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: 'transparent' },
  swatchOn: { borderColor: colors.text },
});
