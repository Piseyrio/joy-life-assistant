import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Task } from '../db/schema';
import { colors } from '../theme/colors';
import { formatInPhnomPenh } from '../utils/dates';

const priorityColor: Record<string, string> = {
  LOW: colors.secondary,
  MEDIUM: colors.blue,
  HIGH: colors.warning,
  URGENT: colors.danger,
};

type Props = {
  task: Task;
  onPress: () => void;
  onToggleDone?: () => void;
};

export function TaskRow({ task, onPress, onToggleDone }: Props) {
  const done = task.status === 'DONE';

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.92 }]}
    >
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: done }}
        onPress={onToggleDone}
        style={[styles.check, done && styles.checkDone]}
        hitSlop={8}
      >
        {done ? <Text style={styles.checkMark}>✓</Text> : null}
      </Pressable>
      <View style={styles.body}>
        <Text style={[styles.title, done && styles.doneTitle]} numberOfLines={2}>
          {task.title}
        </Text>
        <View style={styles.meta}>
          <Text style={[styles.priority, { color: priorityColor[task.priority] ?? colors.secondary }]}>
            {task.priority}
          </Text>
          {task.dueAt ? (
            <Text style={styles.due}>{formatInPhnomPenh(task.dueAt)}</Text>
          ) : (
            <Text style={styles.due}>No due date</Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.cards,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  check: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkDone: {
    backgroundColor: colors.blue,
  },
  checkMark: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 14,
  },
  body: { flex: 1 },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  doneTitle: {
    textDecorationLine: 'line-through',
    color: colors.secondary,
  },
  meta: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
    alignItems: 'center',
  },
  priority: {
    fontSize: 12,
    fontWeight: '700',
  },
  due: {
    color: colors.secondary,
    fontSize: 12,
  },
});
