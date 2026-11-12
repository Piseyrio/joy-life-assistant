import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { authenticateUnlock, isLockEnabled } from '../services/lockService';
import { PrimaryButton, Muted } from './ui';

export function LockGate({ children }: { children: React.ReactNode }) {
  const [locked, setLocked] = useState(false);
  const [checking, setChecking] = useState(true);
  const prompting = useRef(false);

  const unlock = useCallback(async () => {
    if (prompting.current) return;
    prompting.current = true;
    try {
      const ok = await authenticateUnlock();
      if (ok) setLocked(false);
    } finally {
      prompting.current = false;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    // Async SecureStore / settings lookup on mount and AppState changes.
    void (async () => {
      try {
        const on = await isLockEnabled();
        if (!cancelled) setLocked(on);
      } catch {
        if (!cancelled) setLocked(false);
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background' || state === 'inactive') {
        void isLockEnabled().then((on) => {
          if (!cancelled && on) setLocked(true);
        });
      }
    });
    return () => {
      cancelled = true;
      sub.remove();
    };
  }, []);

  useEffect(() => {
    if (!checking && locked) {
      void unlock();
    }
  }, [checking, locked, unlock]);

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
    ...StyleSheet.absoluteFill,
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
