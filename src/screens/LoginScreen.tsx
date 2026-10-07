import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Switch,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuthStore } from '../store/useAuthStore';
import { api } from '../services/api';
import { Theme } from '../constants/theme';
import { biometricService } from '../services/biometricService';
import { 
  CacaoIcon, 
  UserIcon, 
  LockIcon, 
  EyeIcon, 
  EyeOffIcon, 
  ShieldIcon,
  ArrowRightIcon 
} from '../components/Icons';
import { CultivIALogo } from '../components/CultivIALogo';

// Validación con Zod para soportar tanto Email como Teléfono colombiano
const loginSchema = z.object({
  identifier: z.string()
    .min(1, 'Ingrese su correo o teléfono')
    .refine((val) => {
      if (val.includes('@') || isNaN(Number(val.replace('+', '')))) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
      }
      return val.replace('+', '').trim().length >= 7;
    }, {
      message: 'Ingrese un correo electrónico válido o número de teléfono'
    }),
  password: z.string().min(1, 'La contraseña es requerida'),
});

type LoginForm = z.infer<typeof loginSchema>;

export const LoginScreen = ({ navigation }: any) => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);
  const [isBiometricConfigured, setIsBiometricConfigured] = useState(false);
  const setSession = useAuthStore((state) => state.setSession);

  const { control, handleSubmit, setValue, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: '',
      password: '',
    }
  });

  useEffect(() => {
    const checkBiometrics = async () => {
      const available = await biometricService.isBiometricsAvailable();
      const configured = await biometricService.isBiometricsEnabled();
      setIsBiometricAvailable(available);
      setIsBiometricConfigured(configured);

      // Prefill email if there's a saved email from biometrics configuration
      const savedEmail = await biometricService.getSavedEmail();
      if (savedEmail) {
        setValue('identifier', savedEmail);
      }

      // Auto-trigger biometric authentication if enabled
      if (available && configured) {
        setTimeout(() => {
          handleBiometricAuth();
        }, 600);
      }
    };
    checkBiometrics();
  }, []);

  const handleBiometricAuth = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const biometricSession = await biometricService.authenticate();
      if (!biometricSession) return;

      const response = await api.post('/auth/refresh', {
        refreshToken: biometricSession.refreshToken,
      });
      const { accessToken, refreshToken } = response.data;
      await setSession(biometricSession.user, accessToken, refreshToken);
      await biometricService.updateBiometricRefreshToken(biometricSession, refreshToken);
      Alert.alert('¡Bienvenido!', `Hola, ${biometricSession.user.nombre}`);
    } catch (error: any) {
      if (error.error === 'cuenta_bloqueada') {
        const retryAfter = error.retryAfter || 900;
        const minutes = Math.ceil(retryAfter / 60);
        setErrorMessage(`Cuenta bloqueada temporalmente. Intenta en ${minutes} min.`);
      } else if (error.error === 'credenciales_invalidas') {
        setErrorMessage('Credenciales biométricas inválidas. Por favor inicia sesión con tu contraseña.');
        await biometricService.disableBiometrics();
        setIsBiometricConfigured(false);
      } else {
        setErrorMessage(error.mensaje || 'Error al iniciar sesión con huella. Intente más tarde.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricPress = async () => {
    if (biometricService.isRunningInExpoGo()) {
      Alert.alert(
        'Huella no disponible en Expo Go',
        'Para probar el inicio con huella, instala una build de desarrollo de CultivIA. Expo Go no permite acceder a la sesión protegida por biometría.'
      );
      return;
    }

    const available = await biometricService.isBiometricsAvailable();
    if (!available) {
      Alert.alert('Huella dactilar', 'La autenticación biométrica no está disponible o no hay huellas/rostros registrados en el dispositivo.');
      return;
    }

    const configured = await biometricService.isBiometricsEnabled();
    if (!configured) {
      Alert.alert(
        'Huella no configurada',
        'Por favor, inicie sesión con su correo y contraseña primero para activar el inicio con huella.'
      );
      return;
    }

    await handleBiometricAuth();
  };

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const response = await api.post('/auth/login', {
        email: data.identifier, // Mapea a email en backend
        password: data.password,
      });

      const { accessToken, refreshToken, user } = response.data;

      // Check if we should propose enabling biometrics
      const canUseBiometrics = await biometricService.isBiometricsAvailable();
      const isAlreadyEnabled = await biometricService.isBiometricsEnabled();
      const savedEmail = await biometricService.getSavedEmail();
      const hasDifferentBiometricAccount = isAlreadyEnabled && !!savedEmail && savedEmail !== data.identifier;

      if (hasDifferentBiometricAccount) {
        // El dispositivo no debe conservar una sesión biométrica de otra cuenta
        // si el usuario elige no activar la biometría para esta nueva cuenta.
        await biometricService.disableBiometrics();
        setIsBiometricConfigured(false);
      }

      if (canUseBiometrics && (!isAlreadyEnabled || savedEmail !== data.identifier)) {
        const title = savedEmail && savedEmail !== data.identifier
          ? '¿Reemplazar huella guardada?'
          : '¿Activar inicio con huella?';
        
        const message = savedEmail && savedEmail !== data.identifier
          ? `Se detectó otra cuenta configurada (${savedEmail}). ¿Desea reemplazarla con la cuenta actual (${data.identifier}) para el inicio con huella?`
          : '¿Desea utilizar su huella dactilar para iniciar sesión de forma rápida en el futuro?';

        Alert.alert(
          title,
          message,
          [
            {
              text: 'No, gracias',
              onPress: async () => {
                await setSession(user, accessToken, refreshToken);
                Alert.alert('¡Bienvenido!', `Hola, ${user.nombre}`);
              },
              style: 'cancel'
            },
            {
              text: 'Activar',
              onPress: async () => {
                const enabled = await biometricService.enableBiometrics(data.identifier, refreshToken, user);
                await setSession(user, accessToken, refreshToken);
                if (enabled) {
                  Alert.alert('¡Bienvenido!', `Hola, ${user.nombre}\n\nInicio de sesión con huella activado.`);
                } else {
                  Alert.alert('¡Bienvenido!', `Hola, ${user.nombre}`);
                }
              }
            }
          ]
        );
      } else {
        await setSession(user, accessToken, refreshToken);
        Alert.alert('¡Bienvenido!', `Hola, ${user.nombre}`);
      }
    } catch (error: any) {
      if (error.error === 'cuenta_bloqueada') {
        const retryAfter = error.retryAfter || 900;
        const minutes = Math.ceil(retryAfter / 60);
        setErrorMessage(`Cuenta bloqueada temporalmente. Intenta en ${minutes} min.`);
      } else if (error.error === 'credenciales_invalidas') {
        setErrorMessage('Correo o contraseña incorrectos.');
      } else {
        setErrorMessage(error.mensaje || 'Error al iniciar sesión. Intente más tarde.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        {/* Brand Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <CultivIALogo size={92} />
          </View>
          <Text style={styles.title}>CultivIA</Text>
          <Text style={styles.subtitle}>Tecnología inteligente para su cultivo de cacao</Text>
        </View>

        {/* Card Form Container */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Bienvenido de nuevo</Text>

          {errorMessage && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{errorMessage}</Text>
            </View>
          )}

          {/* Identifier Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Número de teléfono o Correo</Text>
            <View style={[styles.inputWrapper, errors.identifier && styles.inputErrorBorder]}>
              <View style={styles.iconContainer}>
                <UserIcon color={Theme.colors.secondary} size={20} />
              </View>
              <Controller
                control={control}
                name="identifier"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={styles.input}
                    placeholder="Ingrese su contacto"
                    placeholderTextColor={Theme.colors.outline}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                )}
              />
            </View>
            {errors.identifier && (
              <Text style={styles.errorText}>{errors.identifier.message}</Text>
            )}
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <View style={styles.passwordLabelRow}>
              <Text style={styles.label}>Contraseña</Text>
              <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                <Text style={styles.forgotText}>¿Olvidó su contraseña?</Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.inputWrapper, errors.password && styles.inputErrorBorder]}>
              <View style={styles.iconContainer}>
                <LockIcon color={Theme.colors.secondary} size={20} />
              </View>
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor={Theme.colors.outline}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                )}
              />
              <TouchableOpacity 
                style={styles.visibilityToggle}
                onPress={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOffIcon color={Theme.colors.outline} size={22} />
                ) : (
                  <EyeIcon color={Theme.colors.outline} size={22} />
                )}
              </TouchableOpacity>
            </View>
            {errors.password && (
              <Text style={styles.errorText}>{errors.password.message}</Text>
            )}
          </View>



          {/* Login Button */}
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSubmit(onSubmit)}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <View style={styles.buttonContent}>
                <Text style={styles.buttonText}>Iniciar Sesión</Text>
                <ArrowRightIcon color="#ffffff" size={18} />
              </View>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>O CONTINUAR CON</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Alt Login Options */}
          <View style={styles.altButtonsRow}>
            <TouchableOpacity style={styles.altButton} onPress={handleBiometricPress}>
              <ShieldIcon color={Theme.colors.secondary} size={20} />
              <Text style={styles.altText}>Huella</Text>
            </TouchableOpacity>
          </View>

        </View>

        {/* Footer Navigation */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            ¿No tienes una cuenta?{' '}
            <Text 
              style={styles.signUpLink}
              onPress={() => navigation.navigate('Register')}
            >
              Crear una cuenta
            </Text>
          </Text>
          <View style={styles.legalRow}>
            <Text style={styles.legalText}>Términos</Text>
            <Text style={styles.legalDot}>•</Text>
            <Text style={styles.legalText}>Privacidad</Text>
            <Text style={styles.legalDot}>•</Text>
            <Text style={styles.legalText}>Soporte</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 40,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 36,
  },
  logoContainer: {
    width: 90,
    height: 90,
    borderRadius: Theme.roundness.full,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#5c403a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 4,
    borderColor: '#ffffff',
    marginBottom: Theme.spacing.stackSm,
  },
  logoEmoji: {
    fontSize: 42,
  },
  title: {
    fontFamily: 'System',
    fontSize: 32,
    fontWeight: '700',
    color: Theme.colors.primary,
  },
  subtitle: {
    fontSize: 14,
    color: Theme.colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: Theme.colors.surfaceContainerLowest,
    padding: 24,
    borderRadius: Theme.roundness.default,
    shadowColor: '#5c403a',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 30,
    elevation: 8,
    marginVertical: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Theme.colors.onSurface,
    marginBottom: Theme.spacing.stackLg,
  },
  errorBanner: {
    backgroundColor: Theme.colors.errorContainer,
    padding: 12,
    borderRadius: 8,
    marginBottom: Theme.spacing.stackMd,
  },
  errorBannerText: {
    color: Theme.colors.error,
    fontSize: 13,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: Theme.spacing.stackMd,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.colors.secondary,
    marginBottom: 8,
  },
  passwordLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  forgotText: {
    fontSize: 12,
    fontWeight: '600',
    color: Theme.colors.primaryContainer,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surfaceContainer,
    borderRadius: Theme.roundness.default,
    height: 56,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  inputErrorBorder: {
    borderColor: Theme.colors.error,
  },
  inputIcon: {
    fontSize: 18,
    marginRight: 10,
    color: Theme.colors.outline,
  },
  input: {
    flex: 1,
    height: '100%',
    color: Theme.colors.onSurface,
    fontSize: 16,
  },
  visibilityToggle: {
    padding: 4,
  },
  visibilityIcon: {
    fontSize: 18,
  },
  errorText: {
    color: Theme.colors.error,
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.stackMd,
  },
  rememberLabel: {
    marginLeft: 8,
    fontSize: 14,
    color: Theme.colors.onSurfaceVariant,
  },
  button: {
    backgroundColor: Theme.colors.primary,
    height: Theme.spacing.touchTargetMin,
    borderRadius: Theme.roundness.full,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: Theme.colors.outline,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
    marginRight: 8,
  },
  buttonArrow: {
    color: '#ffffff',
    fontSize: 16,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Theme.colors.outlineVariant,
  },
  dividerText: {
    paddingHorizontal: 16,
    fontSize: 12,
    color: Theme.colors.outline,
    fontWeight: '600',
  },
  altButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  altButton: {
    flex: 1,
    flexDirection: 'row',
    height: Theme.spacing.touchTargetMin,
    borderWidth: 2,
    borderColor: Theme.colors.outlineVariant,
    borderRadius: Theme.roundness.default,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  altIcon: {
    fontSize: 18,
    marginRight: 6,
  },
  altText: {
    fontSize: 14,
    color: Theme.colors.onSurfaceVariant,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    marginTop: Theme.spacing.stackLg,
  },
  footerText: {
    fontSize: 14,
    color: Theme.colors.onSurfaceVariant,
  },
  signUpLink: {
    color: Theme.colors.primary,
    fontWeight: '700',
  },
  legalRow: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 8,
  },
  legalText: {
    fontSize: 12,
    color: Theme.colors.outline,
  },
  legalDot: {
    fontSize: 12,
    color: Theme.colors.outline,
  },
  iconContainer: {
    marginRight: 10,
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
