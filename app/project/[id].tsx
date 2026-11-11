import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import {
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
import { completeTask } from '../../src/services/taskService';
import { cancelTaskReminders } from '../../src/services/reminderService';
import type { Project, Task } from '../../src/db/schema';
import { colors } from '../../src/theme/colors';
import { useApp } from '../../src/hooks/AppContext';

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { refresh } = useApp();
  const [project, setProject] = useState<Project | null>(null);
  const [items, setItems] = useState<Task[]>([]);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const p = await getProject(id);
    if (!p) {
      setError('Project not found');
      return;
    }
    setProject(p);
    setName(p.name);
    setItems(await listProjectTasks(id));
  }

  useEffect(() => {
    void load();
  }, [id]);

  if (error) return <ErrorState message={error} />;
  if (!project) return <LoadingState />;

  const prog = projectProgress(items);

  return (
    <Screen>
      <Title>{project.archivedAt ? 'Archived project' : 'Project'}</Title>
      <Field value={name} onChangeText={setName} placeholder="Name" />
      <View style={{ height: 8 }} />
      <PrimaryButton
        label="Save name"
        onPress={async () => {
          await updateProject(id, { name });
          await load();
        }}
      />
      <Text style={styles.progress}>
        Progress: {prog.done}/{prog.total} ({prog.pct}%)
      </Text>
      <FlatList
        data={items}
        keyExtractor={(t) => t.id}
        contentContainerStyle={{ paddingBottom: 40 }}
        renderItem={({ item }) => (
          <TaskRow
            task={item}
            onPress={() => router.push(`/task/${item.id}`)}
            onToggleDone={async () => {
              await completeTask(item.id);
              await cancelTaskReminders(item.id);
              await refresh();
              await load();
            }}
          />
        )}
      />
      <SecondaryButton
        label={project.archivedAt ? 'Unarchive' : 'Archive project'}
        onPress={async () => {
          if (project.archivedAt) await unarchiveProject(id);
          else {
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
            return;
          }
          router.back();
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  progress: { color: colors.cyan, fontWeight: '700', marginVertical: 12 },
});
