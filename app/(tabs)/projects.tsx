import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  EmptyState,
  Field,
  LoadingState,
  PrimaryButton,
  Screen,
  Title,
} from '../../src/components/ui';
import {
  archiveProject,
  createProject,
  listProjectTasks,
  listProjects,
  projectProgress,
} from '../../src/services/projectService';
import type { Project } from '../../src/db/schema';
import { colors } from '../../src/theme/colors';

export default function ProjectsScreen() {
  const router = useRouter();
  const [rows, setRows] = useState<Array<Project & { pct: number; total: number }>>([]);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const list = await listProjects(false);
    const withProgress = await Promise.all(
      list.map(async (p) => {
        const tasks = await listProjectTasks(p.id);
        const prog = projectProgress(tasks);
        return { ...p, pct: prog.pct, total: prog.total };
      }),
    );
    setRows(withProgress);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  async function onAdd() {
    if (!name.trim()) return;
    setBusy(true);
    try {
      await createProject(name.trim());
      setName('');
      await load();
    } catch (e) {
      Alert.alert('Could not create', e instanceof Error ? e.message : 'Error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <Title>Projects</Title>
      <Pressable onPress={() => router.push('/notes')} style={styles.notesLink}>
        <Text style={styles.notesLinkText}>Notes & search →</Text>
      </Pressable>
      <View style={styles.addRow}>
        <View style={{ flex: 1 }}>
          <Field value={name} onChangeText={setName} placeholder="New project name" />
        </View>
        <PrimaryButton label={busy ? '…' : 'Add'} onPress={onAdd} disabled={busy} />
      </View>
      {loading ? (
        <LoadingState />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 140, paddingTop: 12 }}
          ListEmptyComponent={<EmptyState title="No projects yet" body="Create one to group tasks." />}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push(`/project/${item.id}`)}
              style={styles.card}
              accessibilityRole="button"
            >
              <View style={[styles.dot, { backgroundColor: item.color ?? colors.blue }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.meta}>
                  {item.total} tasks · {item.pct}% done
                </Text>
              </View>
              <Text
                style={styles.archive}
                onPress={() =>
                  Alert.alert('Archive project?', 'Tasks stay. You can unarchive later.', [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Archive',
                      onPress: async () => {
                        await archiveProject(item.id);
                        await load();
                      },
                    },
                  ])
                }
              >
                Archive
              </Text>
            </Pressable>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  addRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 8 },
  notesLink: { marginBottom: 8 },
  notesLinkText: { color: colors.cyan, fontWeight: '700' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cards,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  dot: { width: 12, height: 12, borderRadius: 6 },
  name: { color: colors.text, fontWeight: '700', fontSize: 16 },
  meta: { color: colors.secondary, marginTop: 2 },
  archive: { color: colors.warning, fontWeight: '600' },
});
