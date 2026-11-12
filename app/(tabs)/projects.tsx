import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  Chip,
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
  unarchiveProject,
} from '../../src/services/projectService';
import type { Project } from '../../src/db/schema';
import { colors } from '../../src/theme/colors';

const PROJECT_COLORS = ['#3B9EFF', '#55C7E8', '#7C9CFF', '#5AD1A5', '#E8A55C'];

export default function ProjectsScreen() {
  const router = useRouter();
  const [rows, setRows] = useState<(Project & { pct: number; total: number })[]>([]);
  const [name, setName] = useState('');
  const [color, setColor] = useState(PROJECT_COLORS[0]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const list = await listProjects(showArchived);
    const visible = showArchived ? list.filter((p) => p.archivedAt != null) : list;
    const withProgress = await Promise.all(
      visible.map(async (p) => {
        const tasks = await listProjectTasks(p.id);
        const prog = projectProgress(tasks);
        return { ...p, pct: prog.pct, total: prog.total };
      }),
    );
    setRows(withProgress);
    setLoading(false);
  }, [showArchived]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  async function onAdd() {
    if (!name.trim()) return;
    setBusy(true);
    try {
      await createProject(name.trim(), color);
      setName('');
      setShowArchived(false);
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

      <View style={styles.filterRow}>
        <Chip label="Active" active={!showArchived} onPress={() => setShowArchived(false)} />
        <Chip label="Archived" active={showArchived} onPress={() => setShowArchived(true)} />
      </View>

      {!showArchived ? (
        <>
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
          <View style={styles.addRow}>
            <View style={{ flex: 1 }}>
              <Field value={name} onChangeText={setName} placeholder="New project name" />
            </View>
            <PrimaryButton label={busy ? '…' : 'Add'} onPress={onAdd} disabled={busy} />
          </View>
        </>
      ) : null}

      {loading ? (
        <LoadingState />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 140, paddingTop: 12 }}
          ListEmptyComponent={
            <EmptyState
              title={showArchived ? 'No archived projects' : 'No projects yet'}
              body={
                showArchived
                  ? 'Archive hides a project without deleting its tasks.'
                  : 'Create one to group tasks.'
              }
            />
          }
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
              {item.archivedAt ? (
                <Text
                  style={styles.restore}
                  onPress={() =>
                    Alert.alert('Unarchive project?', 'It will return to the active list.', [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Unarchive',
                        onPress: async () => {
                          await unarchiveProject(item.id);
                          await load();
                        },
                      },
                    ])
                  }
                >
                  Unarchive
                </Text>
              ) : (
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
              )}
            </Pressable>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  addRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 8 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 4 },
  colorRow: { flexDirection: 'row', gap: 8, marginBottom: 4, marginTop: 4 },
  swatch: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: 'transparent' },
  swatchOn: { borderColor: colors.text },
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
  restore: { color: colors.cyan, fontWeight: '600' },
});
