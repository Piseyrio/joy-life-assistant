import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
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
import { getTask, getTaskActivity } from '../../src/services/taskService';
import { listProjects } from '../../src/services/projectService';
import type { Project, Task } from '../../src/db/schema';
import { useApp } from '../../src/hooks/AppContext';
import { colors } from '../../src/theme/colors';
import type { TaskPriority, TaskStatus } from '../../src/types/models';
import { formatInPhnomPenh } from '../../src/utils/dates';

const PRIORITIES: TaskPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
const STATUSES: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED'];

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { editTask, removeTask } = useApp();
  const router = useRouter();
  const [task, setTask] = useState<Task | null>(null);
  const [activity, setActivity] = useState<Awaited<ReturnType<typeof getTaskActivity>>>([]);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [status, setStatus] = useState<TaskStatus>('TODO');
  const [due, setDue] = useState<Date | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [busy, setBusy] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const t = await getTask(id);
        if (!t) {
          setError('Task not found');
          return;
        }
        setTask(t);
        setTitle(t.title);
        setNotes(t.notes ?? '');
        setPriority(t.priority as TaskPriority);
        setStatus(t.status as TaskStatus);
        setDue(t.dueAt ? new Date(t.dueAt) : null);
        setProjectId(t.projectId);
        setActivity(await getTaskActivity(id));
        setProjects(await listProjects(false));
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load');
      }
    })();
  }, [id]);

  if (error) return <ErrorState message={error} />;
  if (!task) return <LoadingState />;

  async function onSave() {
    setBusy(true);
    try {
      await editTask(id, {
        title,
        notes,
        priority,
        status,
        dueAt: due ? due.getTime() : null,
        projectId,
      });
      router.back();
    } catch (e) {
      Alert.alert('Could not save', e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setBusy(false);
    }
  }

  function onDelete() {
    Alert.alert('Delete task?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await removeTask(id);
          router.back();
        },
      },
    ]);
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <Title>Edit task</Title>
        <Field value={title} onChangeText={setTitle} placeholder="Title" />
        <View style={{ height: 10 }} />
        <Field value={notes} onChangeText={setNotes} placeholder="Notes" multiline />

        <Text style={styles.label}>Priority</Text>
        <View style={styles.row}>
          {PRIORITIES.map((p) => (
            <Chip key={p} label={p} active={priority === p} onPress={() => setPriority(p)} />
          ))}
        </View>

        <Text style={styles.label}>Status</Text>
        <View style={styles.row}>
          {STATUSES.map((s) => (
            <Chip key={s} label={s} active={status === s} onPress={() => setStatus(s)} />
          ))}
        </View>

        <Text style={styles.label}>Move to project</Text>
        <View style={styles.row}>
          <Chip label="Inbox" active={!projectId} onPress={() => setProjectId(null)} />
          {projects.map((p) => (
            <Chip
              key={p.id}
              label={p.name}
              active={projectId === p.id}
              onPress={() => setProjectId(p.id)}
            />
          ))}
        </View>

        <Text style={styles.label}>Due (Asia/Phnom_Penh)</Text>
        <SecondaryButton
          label={due ? formatInPhnomPenh(due.getTime()) : 'Set due date & time'}
          onPress={() => setShowPicker(true)}
        />
        {due ? (
          <View style={{ marginTop: 8 }}>
            <SecondaryButton label="Clear due date" onPress={() => setDue(null)} />
          </View>
        ) : null}
        {showPicker ? (
          <DateTimePicker
            value={due ?? new Date()}
            mode="datetime"
            display={Platform.OS === 'android' ? 'default' : 'spinner'}
            onChange={(_, date) => {
              setShowPicker(Platform.OS === 'ios');
              if (date) setDue(date);
            }}
          />
        ) : null}

        <View style={{ height: 16 }} />
        <PrimaryButton label={busy ? 'Saving…' : 'Save'} onPress={onSave} disabled={busy} />
        <View style={{ height: 10 }} />
        <SecondaryButton label="Delete" onPress={onDelete} danger />

        <Text style={[styles.label, { marginTop: 24 }]}>Activity</Text>
        {activity.length === 0 ? (
          <Text style={styles.meta}>No activity yet</Text>
        ) : (
          activity.map((a) => (
            <View key={a.id} style={styles.activity}>
              <Text style={styles.meta}>{a.action}</Text>
              <Text style={styles.meta}>{formatInPhnomPenh(a.createdAt)}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: {
    color: colors.cyan,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  row: { flexDirection: 'row', flexWrap: 'wrap' },
  meta: { color: colors.secondary, fontSize: 13 },
  activity: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
});
