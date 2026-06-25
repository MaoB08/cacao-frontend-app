import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { api } from '../services/api';
import { Theme } from '../constants/theme';
import { KeyIcon, LockIcon, EyeIcon, EyeOffIcon, ArrowLeftIcon } from '../components/Icons';

const resetSchema = z.object({
  token: z.string().min(1, 'El código/token es requerido'),
  password: z.string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Al menos una letra mayúscula')
    .regex(/\d/, 'Al menos un número'),
  confirmPassword: z.string().min(1, 'Confirma tu contraseña'),
}).refine((data) => data.password === data.confirmPassword, {
  path: ['confirmPassword'],
  message: 'Las contraseñas no coinciden',
});

type ResetForm = z.infer<typeof resetSchema>;

export const ResetPasswordScreen = ({ route, navigation }: any) => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const emailParam = route.params?.email || '';

  const { control, handleSubmit, watch, formState: { errors } } = useForm<ResetForm>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      token: '',
      password: '',
      confirmPassword: '',
    }
  });

  const passwordValue = watch('password') || '';
  const confirmPasswordValue = watch('confirmPassword') || '';

  // Validaciones en tiempo real
  const hasMinLength = passwordValue.length >= 8;
  const hasUppercase = /[A-Z]/.test(passwordValue);
  const hasNumber = /\d/.test(passwordValue);
  const passwordsMatch = passwordValue.length > 0 && passwordValue === confirmPasswordValue;

  const onSubmit = async (data: ResetForm) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      await api.post('/auth/reset-password', {
        token: data.token.trim(),
        nuevaPassword: data.password,
      });

      Alert.alert(
        'Contraseña Actualizada',
        'Tu contraseña ha sido restablecida exitosamente. Por favor, inicia sesión con tus nuevas credenciales.',
        [
          {
            text: 'Ir al Login',
            onPress: () => navigation.navigate('Login'),
          }
        ]
      );
    } catch (error: any) {
      if (error.error === 'token_invalido_o_expirado') {
        setErrorMessage('El token de recuperación es inválido o ha expirado.');
      } else {
        setErrorMessage(error.mensaje || 'Error al restablecer la contraseña.');
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
      <View style={styles.topNav}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeftIcon color={Theme.colors.onSurfaceVariant} size={20} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>Nueva Contraseña</Text>
          {emailParam ? (
            <Text style={styles.subtitle}>
              Ingresa el código enviado a <Text style={styles.emailHighlight}>{emailParam}</Text> y tu nueva contraseña.
            </Text>
          ) : (
            <Text style={styles.subtitle}>
              Ingresa el código de recuperación recibido y tu nueva contraseña.
            </Text>
          )}
        </View>

        <View style={styles.card}>
          {errorMessage && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{errorMessage}</Text>
            </View>
          )}

          {/* Token de Recuperación */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Código de Recuperación</Text>
            <View style={[styles.inputWrapper, errors.token && styles.inputErrorBorder]}>
              <View style={styles.iconContainer}>
                <KeyIcon color={Theme.colors.secondary} size={20} />
              </View>
              <Controller
                control={control}
                name="token"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={styles.input}
                    placeholder="Pega el código de correo"
                    placeholderTextColor={Theme.colors.outline}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    autoCapitalize="none"
                  />
                )}
              />
            </View>
            {errors.token && <Text style={styles.errorText}>{errors.token.message}</Text>}
          </View>

          {/* Nueva Contraseña */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nueva Contraseña</Text>
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
            {errors.password && <Text style={styles.errorText}>{errors.password.message}</Text>}
          </View>

          {/* Confirmar Contraseña */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirmar Contraseña</Text>
            <View style={[styles.inputWrapper, errors.confirmPassword && styles.inputErrorBorder]}>
              <View style={styles.iconContainer}>
                <LockIcon color={Theme.colors.secondary} size={20} />
              </View>
              <Controller
                control={control}
                name="confirmPassword"
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
            </View>
            {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword.message}</Text>}
          </View>

          {/* Validaciones Visuales */}
          <View style={styles.validationsCard}>
            <View style={styles.validationRow}>
              <Text style={hasMinLength ? styles.validText : styles.invalidText}>
                {hasMinLength ? '✓' : '•'} Contraseña de al menos 8 caracteres
              </Text>
            </View>
            <View style={styles.validationRow}>
              <Text style={hasUppercase ? styles.validText : styles.invalidText}>
                {hasUppercase ? '✓' : '•'} Al menos 1 mayúscula y 1 número
              </Text>
            </View>
            <View style={styles.validationRow}>
              <Text style={passwordsMatch ? styles.validText : styles.invalidText}>
                {passwordsMatch ? '✓' : '•'} Ambas contraseñas coinciden
              </Text>
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.button, (loading || !passwordsMatch || !hasMinLength || !hasUppercase || !hasNumber) && styles.buttonDisabled]}
            onPress={handleSubmit(onSubmit)}
            disabled={loading || !passwordsMatch || !hasMinLength || !hasUppercase || !hasNumber}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.buttonText}>Restablecer Contraseña</Text>
            )}
          </TouchableOpacity>
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
  topNav: {
    height: 60,
    justifyContent: 'center',
    paddingHorizontal: Theme.spacing.marginMobile,
    marginTop: Platform.OS === 'android' ? 24 : 0,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: Theme.roundness.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.colors.surfaceContainer,
  },
  backArrow: {
    fontSize: 20,
    color: Theme.colors.onSurfaceVariant,
    fontWeight: '700',
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
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Theme.colors.primary,
  },
  subtitle: {
    fontSize: 14,
    color: Theme.colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  emailHighlight: {
    fontWeight: '700',
    color: Theme.colors.primary,
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
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surfaceContainer,
    borderRadius: Theme.roundness.full,
    height: 56,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  inputErrorBorder: {
    borderColor: Theme.colors.error,
  },
  inputIcon: {
    fontSize: 18,
    marginRight: 10,
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
    marginLeft: 12,
  },
  validationsCard: {
    backgroundColor: Theme.colors.surfaceContainer,
    padding: 16,
    borderRadius: Theme.roundness.default,
    marginVertical: 16,
  },
  validationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  validText: {
    fontSize: 13,
    color: Theme.colors.primary,
    fontWeight: '600',
  },
  invalidText: {
    fontSize: 13,
    color: Theme.colors.outline,
  },
  button: {
    backgroundColor: Theme.colors.primary,
    height: 56,
    borderRadius: Theme.roundness.full,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  buttonDisabled: {
    backgroundColor: Theme.colors.outline,
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
  },
  iconContainer: {
    marginRight: 10,
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
