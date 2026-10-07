import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { biometricService } from '../services/biometricService';
import type { User } from '../store/useAuthStore';

jest.mock('expo-local-authentication', () => ({
  hasHardwareAsync: jest.fn().mockResolvedValue(true),
  isEnrolledAsync: jest.fn().mockResolvedValue(true),
}));

jest.mock('expo-secure-store', () => ({
  canUseBiometricAuthentication: jest.fn().mockReturnValue(true),
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

describe('biometricService', () => {
  const storage = new Map<string, string>();

  beforeEach(() => {
    jest.clearAllMocks();
    storage.clear();
    (SecureStore.getItemAsync as jest.Mock).mockImplementation(async (key: string) => storage.get(key) ?? null);
    (SecureStore.setItemAsync as jest.Mock).mockImplementation(async (key: string, value: string) => {
      storage.set(key, value);
    });
    (SecureStore.deleteItemAsync as jest.Mock).mockImplementation(async (key: string) => {
      storage.delete(key);
    });
  });

  it('stores a biometric-protected refresh session without retaining the password', async () => {
    const user = { id: 'user-1', nombre: 'Productor' } as User;

    const enabled = await biometricService.enableBiometrics('user@example.com', 'refresh-token', user);

    expect(enabled).toBe(true);
    const savedSession = JSON.parse(storage.get('biometric_refresh_session')!);
    expect(savedSession).toEqual({
      identifier: 'user@example.com',
      refreshToken: 'refresh-token',
      user,
    });
    expect(savedSession).not.toHaveProperty('password');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      'biometric_refresh_session',
      expect.any(String),
      expect.objectContaining({ requireAuthentication: true }),
    );
  });

  it('removes an older stored password and disables that legacy biometric setup', async () => {
    storage.set('biometric_password', 'old-password');
    storage.set('biometrics_enabled', 'true');
    storage.set('biometric_email', 'user@example.com');

    await expect(biometricService.isBiometricsEnabled()).resolves.toBe(false);

    expect(storage.has('biometric_password')).toBe(false);
    expect(storage.has('biometrics_enabled')).toBe(false);
  });
});
