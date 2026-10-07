import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';
import type { User } from '../store/useAuthStore';

const BIOMETRIC_SESSION_KEY = 'biometric_refresh_session';
const BIOMETRIC_EMAIL_KEY = 'biometric_email';
const BIOMETRICS_ENABLED_KEY = 'biometrics_enabled';
const LEGACY_PASSWORD_KEY = 'biometric_password';
const BIOMETRIC_OPTIONS: SecureStore.SecureStoreOptions = {
  requireAuthentication: true,
  authenticationPrompt: 'Confirma tu identidad para acceder a CultivIA',
};

export interface BiometricSession {
  identifier: string;
  refreshToken: string;
  user: User;
}

async function clearLegacyPassword(): Promise<boolean> {
  try {
    const legacyPassword = await SecureStore.getItemAsync(LEGACY_PASSWORD_KEY);
    if (legacyPassword !== null) {
      await SecureStore.deleteItemAsync(LEGACY_PASSWORD_KEY);
      await SecureStore.deleteItemAsync(BIOMETRICS_ENABLED_KEY);
      return true;
    }
  } catch (error) {
    console.warn('No se pudo retirar la credencial biométrica anterior.', error);
  }
  return false;
}

export const biometricService = {
  isRunningInExpoGo: (): boolean => Constants.executionEnvironment === ExecutionEnvironment.StoreClient,

  isBiometricsAvailable: async (): Promise<boolean> => {
    try {
      if (biometricService.isRunningInExpoGo()) return false;

      const supported = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      return supported && enrolled && SecureStore.canUseBiometricAuthentication();
    } catch (error) {
      console.error('Error al verificar disponibilidad de biometría:', error);
      return false;
    }
  },

  isBiometricsEnabled: async (): Promise<boolean> => {
    await clearLegacyPassword();
    try {
      const [enabled, identifier] = await Promise.all([
        SecureStore.getItemAsync(BIOMETRICS_ENABLED_KEY),
        SecureStore.getItemAsync(BIOMETRIC_EMAIL_KEY),
      ]);
      return enabled === 'true' && !!identifier;
    } catch (error) {
      console.error('Error al verificar si la biometría está habilitada:', error);
      return false;
    }
  },

  getSavedEmail: async (): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(BIOMETRIC_EMAIL_KEY);
    } catch (error) {
      console.error('Error al obtener el identificador biométrico:', error);
      return null;
    }
  },

  enableBiometrics: async (
    identifier: string,
    refreshToken: string,
    user: User,
  ): Promise<boolean> => {
    if (!(await biometricService.isBiometricsAvailable())) return false;

    const session: BiometricSession = { identifier, refreshToken, user };
    try {
      await SecureStore.setItemAsync(BIOMETRIC_SESSION_KEY, JSON.stringify(session), BIOMETRIC_OPTIONS);

      // iOS no solicita biometría al crear una entrada protegida. Leerla aquí
      // confirma que el usuario puede desbloquearla antes de activar la opción.
      if (Platform.OS === 'ios') {
        const stored = await SecureStore.getItemAsync(BIOMETRIC_SESSION_KEY, BIOMETRIC_OPTIONS);
        if (stored !== JSON.stringify(session)) {
          await biometricService.disableBiometrics();
          return false;
        }
      }

      await SecureStore.setItemAsync(BIOMETRIC_EMAIL_KEY, identifier);
      await SecureStore.setItemAsync(BIOMETRICS_ENABLED_KEY, 'true');
      await SecureStore.deleteItemAsync(LEGACY_PASSWORD_KEY);
      return true;
    } catch (error) {
      console.error('Error al proteger la sesión biométrica:', error);
      await biometricService.disableBiometrics();
      return false;
    }
  },

  updateBiometricRefreshToken: async (
    session: BiometricSession,
    refreshToken: string,
  ): Promise<boolean> => {
    try {
      const updated = { ...session, refreshToken };
      await SecureStore.setItemAsync(BIOMETRIC_SESSION_KEY, JSON.stringify(updated), BIOMETRIC_OPTIONS);
      return true;
    } catch (error) {
      console.error('No se pudo renovar la sesión biométrica protegida:', error);
      await biometricService.disableBiometrics();
      return false;
    }
  },

  disableBiometrics: async (): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(BIOMETRIC_SESSION_KEY, BIOMETRIC_OPTIONS);
    } catch {
      // Si cambió la huella o el rostro del dispositivo, elimina la entrada
      // inaccesible sin pedir de nuevo una autenticación que ya no es válida.
      try {
        await SecureStore.deleteItemAsync(BIOMETRIC_SESSION_KEY);
      } catch (error) {
        console.warn('No se pudo eliminar la sesión biométrica protegida.', error);
      }
    }

    await Promise.all([
      SecureStore.deleteItemAsync(BIOMETRIC_EMAIL_KEY).catch(() => undefined),
      SecureStore.deleteItemAsync(LEGACY_PASSWORD_KEY).catch(() => undefined),
      SecureStore.deleteItemAsync(BIOMETRICS_ENABLED_KEY).catch(() => undefined),
    ]);
  },

  authenticate: async (): Promise<BiometricSession | null> => {
    try {
      if (!(await biometricService.isBiometricsAvailable())) return null;
      if (!(await biometricService.isBiometricsEnabled())) return null;

      const stored = await SecureStore.getItemAsync(BIOMETRIC_SESSION_KEY, BIOMETRIC_OPTIONS);
      if (!stored) return null;

      const session = JSON.parse(stored) as BiometricSession;
      if (!session.identifier || !session.refreshToken || !session.user?.id) return null;
      return session;
    } catch (error) {
      console.error('Error al recuperar la sesión biométrica:', error);
      return null;
    }
  },
};
