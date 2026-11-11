import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  Chip,
  ErrorState,
  Field,
  LoadingState,
  PrimaryButton,
  Screen,
  SecondaryButton,
  Title,
} from '../../src/components/ui';
import { deleteNote, getNote, updateNote } from '../../src/services/noteService';
import { listProjects } from '../../src/services/projectService';
import { listInboxTasks } from '../../src/services/taskService';
import type { Note, Project, Task } from '../../src/db/schema';
import { colors } from '../../src/theme/colors';

export default function NoteEditorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [note, setNote] = useState<Note | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [projectId, setProjectId] = useState<string | null>(null);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [taskOptions, setTaskOptions] = useState<Task[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const n = await getNote(id);
      if (!n) {
        setError('Note not found');
        return;
      }
      setNote(n);
      setTitle(n.title);
      setBody(n.body);
      setProjectId(n.projectId);
      setTaskId(n.taskId);
      setProjects(await listProjects(false));
      setTaskOptions(await listInboxTasks());
    })();
  }, [id]);

  if (error) return <ErrorState message={error} />;
  if (!note) return <LoadingState />;

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <Title>Note</Title>
        <Field value={title} onChangeText={setTitle} placeholder="Title" />
        <View style={{ height: 10 }} />
        <Field value={body} onChangeText={setBody} placeholder="Write freely…" multiline />

        <Text style={styles.label}>Link to project (optional)</Text>
        <View style={styles.row}>
          <Chip label="None" active={!projectId} onPress={() => setProjectId(null)} />
          {projects.map((p) => (
            <Chip
              key={p.id}
              label={p.name}
              active={projectId === p.id}
              onPress={() => setProjectId(p.id)}
            />
          ))}
        </View>

        <Text style={styles.label}>Link to task (optional)</Text>
        <View style={styles.row}>
          <Chip label="None" active={!taskId} onPress={() => setTaskId(null)} />
          {taskOptions.slice(0, 12).map((t) => (
            <Chip
              key={t.id}
              label={t.title.slice(0, 24)}
              active={taskId === t.id}
              onPress={() => setTaskId(t.id)}
            />
          ))}
        </View>

        <PrimaryButton
          label="Save"
          onPress={async () => {
            await updateNote(id, { title, body, projectId, taskId });
            router.back();
          }}
        />
        <View style={{ height: 10 }} />
        <SecondaryButton
          label="Delete"
          danger
          onPress={() =>
            Alert.alert('Delete note?', 'This cannot be undone.', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                  await deleteNote(id);
                  router.back();
                },
              },
            ])
          }
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: { color: colors.cyan, fontWeight: '700', marginTop: 16, marginBottom: 8 },
  row: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
});
