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
import { KeyIcon, EmailIcon, ArrowLeftIcon } from '../components/Icons';

const forgotSchema = z.object({
  email: z.string()
    .min(1, 'El correo electrónico es requerido')
    .email('Ingrese un correo electrónico válido'),
});

type ForgotForm = z.infer<typeof forgotSchema>;

export const ForgotPasswordScreen = ({ navigation }: any) => {
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<ForgotForm>({
    resolver: zodResolver(forgotSchema),
    defaultValues: {
      email: '',
    }
  });

  const onSubmit = async (data: ForgotForm) => {
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', {
        email: data.email,
      });

      // Alerta con redirección automática a la pantalla de ingreso del código
      Alert.alert(
        'Instrucciones Enviadas',
        'Si el correo electrónico está registrado, recibirás un mensaje con las instrucciones de recuperación.',
        [
          {
            text: 'Ir al Restablecimiento',
            onPress: () => navigation.navigate('ResetPassword', { email: data.email }),
          }
        ]
      );
    } catch (error: any) {
      // Por seguridad, incluso si falla o el correo no existe, mostramos el mismo mensaje o manejamos fallas de red
      Alert.alert(
        'Instrucciones Enviadas',
        'Si el correo electrónico está registrado, recibirás un mensaje con las instrucciones de recuperación.',
        [
          {
            text: 'Ir al Restablecimiento',
            onPress: () => navigation.navigate('ResetPassword', { email: data.email }),
          }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {/* Top Header Back Navigation */}
      <View style={styles.topNav}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeftIcon color={Theme.colors.onSurfaceVariant} size={20} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        {/* Logo and Identity */}
        <View style={styles.header}>
          <View style={styles.logoBlurBG}>
            <KeyIcon color={Theme.colors.primary} size={40} />
          </View>
          <Text style={styles.title}>¿Olvidaste tu contraseña?</Text>
          <Text style={styles.instructions}>
            No te preocupes, introduce tu correo electrónico registrado y te enviaremos las instrucciones para restablecerla.
          </Text>
        </View>

        {/* Form Card */}
        <View style={styles.card}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Correo Electrónico</Text>
            <View style={[styles.inputWrapper, errors.email && styles.inputErrorBorder]}>
              <View style={styles.iconContainer}>
                <EmailIcon color={Theme.colors.secondary} size={20} />
              </View>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={styles.input}
                    placeholder="nombre@ejemplo.com"
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
            {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}
          </View>

          {/* Action Button */}
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSubmit(onSubmit)}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <View style={styles.buttonContent}>
                <Text style={styles.buttonText}>Enviar Instrucciones</Text>
                <EmailIcon color="#ffffff" size={18} />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Back Link */}
        <TouchableOpacity 
          style={styles.backLinkButton}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.backLinkText}>Volver al inicio de sesión</Text>
        </TouchableOpacity>
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
  logoBlurBG: {
    width: 100,
    height: 100,
    borderRadius: Theme.roundness.full,
    backgroundColor: 'rgba(21, 66, 18, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Theme.spacing.stackMd,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Theme.colors.primary,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  instructions: {
    fontSize: 15,
    color: Theme.colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 22,
    paddingHorizontal: 16,
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
  inputGroup: {
    marginBottom: Theme.spacing.stackLg,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.colors.onSurfaceVariant,
    marginBottom: 8,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surfaceContainerLowest,
    borderRadius: Theme.roundness.full,
    height: 56,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: Theme.colors.outlineVariant,
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
  errorText: {
    color: Theme.colors.error,
    fontSize: 12,
    marginTop: 4,
    marginLeft: 12,
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
  iconContainer: {
    marginRight: 10,
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backLinkButton: {
    height: 56,
    borderWidth: 2,
    borderColor: Theme.colors.primary,
    borderRadius: Theme.roundness.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Theme.spacing.stackLg,
  },
  backLinkText: {
    color: Theme.colors.primary,
    fontWeight: '700',
    fontSize: 16,
  },
});
