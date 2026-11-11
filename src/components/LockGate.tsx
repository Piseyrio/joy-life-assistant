import React, { useCallback, useEffect, useState } from 'react';
import { AppState, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { authenticateUnlock, isLockEnabled } from '../services/lockService';
import { PrimaryButton, Muted } from './ui';

export function LockGate({ children }: { children: React.ReactNode }) {
  const [locked, setLocked] = useState(false);
  const [checking, setChecking] = useState(true);

  const arm = useCallback(async () => {
    try {
      const on = await isLockEnabled();
      setLocked(on);
    } catch {
      setLocked(false);
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    void arm();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background' || state === 'inactive') {
        void isLockEnabled().then((on) => {
          if (on) setLocked(true);
        });
      }
    });
    return () => sub.remove();
  }, [arm]);

  async function unlock() {
    const ok = await authenticateUnlock();
    if (ok) setLocked(false);
  }

  if (checking) {
    return <View style={styles.fill} />;
  }

  return (
    <View style={styles.fill}>
      {children}
      {locked ? (
        <View style={styles.overlay} accessibilityViewIsModal>
          <Text style={styles.title}>Joy is locked</Text>
          <Muted>Reminders still fire. Unlock to open the app.</Muted>
          <View style={{ height: 16 }} />
          <PrimaryButton label="Unlock" onPress={unlock} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    zIndex: 50,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
});
