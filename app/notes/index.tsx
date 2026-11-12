import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  EmptyState,
  Field,
  PrimaryButton,
  Screen,
  Title,
} from '../../src/components/ui';
import { createNote, searchNotes } from '../../src/services/noteService';
import type { Note } from '../../src/db/schema';
import { colors } from '../../src/theme/colors';
import { formatInPhnomPenh } from '../../src/utils/dates';

export default function NotesScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [rows, setRows] = useState<Note[]>([]);
  const [title, setTitle] = useState('');

  const load = useCallback(async (q: string) => {
    setRows(await searchNotes(q));
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load(query);
    }, [load, query]),
  );

  return (
    <Screen>
      <Title>Notes</Title>
      <Field
        value={query}
        onChangeText={(t) => {
          setQuery(t);
          void searchNotes(t).then(setRows);
        }}
        placeholder="Search notes…"
      />
      <View style={styles.addRow}>
        <View style={{ flex: 1 }}>
          <Field value={title} onChangeText={setTitle} placeholder="New note title" />
        </View>
        <PrimaryButton
          label="Add"
          onPress={async () => {
            if (!title.trim()) return;
            const n = await createNote({ title });
            setTitle('');
            router.push(`/notes/${n.id}`);
          }}
        />
      </View>
      <FlatList
        data={rows}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 40, paddingTop: 8 }}
        ListEmptyComponent={<EmptyState title="No notes" body="Capture reference info here." />}
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => router.push(`/notes/${item.id}`)}
            accessibilityRole="button"
          >
            <Text style={styles.noteTitle}>{item.title}</Text>
            <Text style={styles.body} numberOfLines={2}>
              {item.body || 'Empty'}
            </Text>
            <Text style={styles.meta}>{formatInPhnomPenh(item.updatedAt)}</Text>
          </Pressable>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  addRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 10 },
  card: {
    backgroundColor: colors.cards,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  noteTitle: { color: colors.text, fontWeight: '700', fontSize: 16 },
  body: { color: colors.secondary, marginTop: 4 },
  meta: { color: colors.secondary, fontSize: 12, marginTop: 6 },
});
