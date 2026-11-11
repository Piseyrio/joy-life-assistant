import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { Field, PrimaryButton } from './ui';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (title: string) => Promise<void>;
};

export function QuickCapture({ visible, onClose, onSubmit }: Props) {
  const [title, setTitle] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!title.trim()) {
      setError('Type a quick task');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onSubmit(title.trim());
      setTitle('');
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.heading}>Quick capture</Text>
          <Text style={styles.hint}>Inbox in 5 seconds</Text>
          <Field
            value={title}
            onChangeText={setTitle}
            placeholder="What should Joy remember?"
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <View style={styles.row}>
            <PrimaryButton label={busy ? 'Saving…' : 'Add to Inbox'} onPress={handleSave} disabled={busy} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    gap: 10,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  heading: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  hint: {
    color: colors.secondary,
    marginBottom: 4,
  },
  row: { marginTop: 4 },
  error: { color: colors.danger },
});
