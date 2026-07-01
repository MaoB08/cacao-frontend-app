import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const BIOMETRIC_EMAIL_KEY = 'biometric_email';
const BIOMETRIC_PASSWORD_KEY = 'biometric_password';
const BIOMETRICS_ENABLED_KEY = 'biometrics_enabled';

export const biometricService = {
  /**
   * Verifica si el hardware soporta biometría y si el usuario tiene huellas/rostros registrados.
   */
  isBiometricsAvailable: async (): Promise<boolean> => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      return hasHardware && isEnrolled;
    } catch (error) {
      console.error('Error al verificar disponibilidad de biometría:', error);
      return false;
    }
  },

  /**
   * Verifica si la huella dactilar ha sido activada en la app y si existen credenciales guardadas.
   */
  isBiometricsEnabled: async (): Promise<boolean> => {
    try {
      const enabled = await SecureStore.getItemAsync(BIOMETRICS_ENABLED_KEY);
      const email = await SecureStore.getItemAsync(BIOMETRIC_EMAIL_KEY);
      const password = await SecureStore.getItemAsync(BIOMETRIC_PASSWORD_KEY);
      return enabled === 'true' && !!email && !!password;
    } catch (error) {
      console.error('Error al verificar si la biometría está habilitada:', error);
      return false;
    }
  },

  /**
   * Obtiene el correo guardado para biometría para poder pre-visualizarlo o usarlo.
   */
  getSavedEmail: async (): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(BIOMETRIC_EMAIL_KEY);
    } catch (error) {
      console.error('Error al obtener correo biométrico guardado:', error);
      return null;
    }
  },

  /**
   * Activa el inicio biométrico guardando de forma segura las credenciales tras una autenticación exitosa.
   */
  enableBiometrics: async (email: string, password: string): Promise<boolean> => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Confirme su identidad para activar el acceso con huella',
        fallbackLabel: 'Usar contraseña',
        disableDeviceFallback: false,
      });

      if (result.success) {
        await SecureStore.setItemAsync(BIOMETRIC_EMAIL_KEY, email);
        await SecureStore.setItemAsync(BIOMETRIC_PASSWORD_KEY, password);
        await SecureStore.setItemAsync(BIOMETRICS_ENABLED_KEY, 'true');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error al activar biometría:', error);
      return false;
    }
  },

  /**
   * Desactiva el inicio biométrico eliminando las credenciales guardadas de forma segura.
   */
  disableBiometrics: async (): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(BIOMETRIC_EMAIL_KEY);
      await SecureStore.deleteItemAsync(BIOMETRIC_PASSWORD_KEY);
      await SecureStore.setItemAsync(BIOMETRICS_ENABLED_KEY, 'false');
    } catch (error) {
      console.error('Error al desactivar biometría:', error);
    }
  },

  /**
   * Autentica al usuario usando biometría y retorna las credenciales guardadas.
   */
  authenticate: async (): Promise<{ email: string; password: string } | null> => {
    try {
      const isAvailable = await biometricService.isBiometricsAvailable();
      if (!isAvailable) {
        return null;
      }

      const isEnabled = await biometricService.isBiometricsEnabled();
      if (!isEnabled) {
        return null;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Inicie sesión con su huella dactilar',
        fallbackLabel: 'Usar contraseña',
        disableDeviceFallback: false,
      });

      if (result.success) {
        const email = await SecureStore.getItemAsync(BIOMETRIC_EMAIL_KEY);
        const password = await SecureStore.getItemAsync(BIOMETRIC_PASSWORD_KEY);
        if (email && password) {
          return { email, password };
        }
      }
      return null;
    } catch (error) {
      console.error('Error en autenticación biométrica:', error);
      return null;
    }
  }
};
