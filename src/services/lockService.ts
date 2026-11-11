import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { getSettings, updateSettings } from './settingsService';

const LOCK_FLAG_KEY = 'joy.lock.enabled';

export async function isLockEnabled(): Promise<boolean> {
  try {
    const flag = await SecureStore.getItemAsync(LOCK_FLAG_KEY);
    if (flag === '1') return true;
    if (flag === '0') return false;
  } catch {
    // fall through to settings
  }
  const s = await getSettings();
  return s.lockEnabled;
}

export async function setLockEnabled(enabled: boolean): Promise<void> {
  await SecureStore.setItemAsync(LOCK_FLAG_KEY, enabled ? '1' : '0');
  await updateSettings({ lockEnabled: enabled });
}

export async function getHardware(): Promise<{
  hasHardware: boolean;
  enrolled: boolean;
}> {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const enrolled = hasHardware ? await LocalAuthentication.isEnrolledAsync() : false;
  return { hasHardware, enrolled };
}

export async function authenticateUnlock(): Promise<boolean> {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Unlock JOY LIFE ASSISTANT',
    fallbackLabel: 'Use device PIN',
    disableDeviceFallback: false,
    cancelLabel: 'Cancel',
  });
  return result.success;
}
