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
  Modal,
  FlatList,
  SafeAreaView,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuthStore } from '../store/useAuthStore';
import { api } from '../services/api';
import { Theme } from '../constants/theme';
import {
  UserIcon,
  MapPinIcon,
  HomeIcon,
  LeafIcon,
  PhoneIcon,
  EmailIcon,
  LockIcon,
  EyeIcon,
  EyeOffIcon,
  ArrowRightIcon,
  CheckIcon,
} from '../components/Icons';
import { CultivIALogo } from '../components/CultivIALogo';

const DEPARTAMENTO_COLOMBIA = 'Norte de Santander';
const MUNICIPIOS_CATATUMBO = [
  'Ocaña',
  'Convención',
  'Teorama',
  'El Tarra',
  'Hacarí',
  'San Calixto',
  'Sardinata',
  'Tibú',
  'El Carmen',
];

const registerSchema = z.object({
  nombre: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  departamento: z.string().min(1, 'El departamento es requerido'),
  municipio: z.string().min(1, 'El municipio es requerido'),
  telefono: z.string()
    .min(10, 'El teléfono colombiano debe tener 10 dígitos')
    .max(10, 'El teléfono debe tener 10 dígitos')
    .regex(/^\d+$/, 'Ingrese solo números (ej: 3101234567)'),
  email: z.string().email('Ingrese un correo electrónico válido').optional().or(z.literal('')),
  password: z.string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Al menos una mayúscula')
    .regex(/\d/, 'Al menos un número'),
  nombreFinca: z.string().optional(),
});

type RegisterForm = z.infer<typeof registerSchema>;

export const RegisterScreen = ({ navigation }: any) => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [municipioModalVisible, setMunicipioModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const setSession = useAuthStore((state) => state.setSession);

  const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      nombre: '',
      departamento: DEPARTAMENTO_COLOMBIA,
      municipio: '',
      telefono: '',
      email: '',
      password: '',
      nombreFinca: '',
    }
  });

  const selectedMunicipio = watch('municipio');
  const passwordValue = watch('password') || '';

  // Validaciones visuales en tiempo real para contraseña
  const hasMinLength = passwordValue.length >= 8;
  const hasUppercase = /[A-Z]/.test(passwordValue);
  const hasNumber = /\d/.test(passwordValue);

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const response = await api.post('/auth/register', {
        nombre: data.nombre,
        email: data.email,
        password: data.password,
        telefono: data.telefono,
        departamento: data.departamento,
        municipio: data.municipio,
        nombreFinca: data.nombreFinca || null,
      });

      const { accessToken, refreshToken, user } = response.data;
      await setSession(user, accessToken, refreshToken);
      Alert.alert('Registro Exitoso', 'Bienvenido a CultivIA.');
    } catch (error: any) {
      if (error.error === 'email_ya_registrado') {
        setErrorMessage('El correo electrónico ya está registrado.');
      } else if (error.error === 'validacion') {
        setErrorMessage(error.detalles ? error.detalles.join(', ') : 'Datos de registro inválidos.');
      } else {
        setErrorMessage(error.mensaje || 'Error en el servidor al registrarse.');
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
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <CultivIALogo size={88} />
          </View>
          <Text style={styles.title}>CultivIA</Text>
          <Text style={styles.subtitle}>Únete a la plataforma para la gestión técnica del cacao.</Text>
        </View>

        {/* Card Form */}
        <View style={styles.card}>
          {errorMessage && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{errorMessage}</Text>
            </View>
          )}

          {/* Full Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nombre completo</Text>
            <View style={[styles.inputWrapper, errors.nombre && styles.inputErrorBorder]}>
              <View style={styles.iconContainer}>
                <UserIcon color={Theme.colors.secondary} size={20} />
              </View>
              <Controller
                control={control}
                name="nombre"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={styles.input}
                    placeholder="Escribe tu nombre"
                    placeholderTextColor={Theme.colors.outline}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                  />
                )}
              />
            </View>
            {errors.nombre && <Text style={styles.errorText}>{errors.nombre.message}</Text>}
          </View>

          {/* Departamento (Fijo por contexto del proyecto) */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Departamento</Text>
            <View style={styles.disabledInputWrapper}>
              <View style={styles.iconContainer}>
                <MapPinIcon color={Theme.colors.outline} size={20} />
              </View>
              <TextInput
                style={styles.disabledInput}
                value={DEPARTAMENTO_COLOMBIA}
                editable={false}
              />
            </View>
          </View>

          {/* Municipio Selector */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Municipio del Catatumbo</Text>
            <TouchableOpacity 
              style={[styles.inputWrapper, errors.municipio && styles.inputErrorBorder]}
              onPress={() => setMunicipioModalVisible(true)}
            >
              <View style={styles.iconContainer}>
                <HomeIcon color={Theme.colors.secondary} size={20} />
              </View>
              <Text style={[styles.selectText, !selectedMunicipio && styles.placeholderText]}>
                {selectedMunicipio || 'Selecciona un municipio'}
              </Text>
              <Text style={styles.dropdownArrow}>▼</Text>
            </TouchableOpacity>
            {errors.municipio && <Text style={styles.errorText}>{errors.municipio.message}</Text>}
          </View>

          {/* Nombre de la Finca (Opcional) */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nombre de la Finca (Opcional)</Text>
            <View style={styles.inputWrapper}>
              <View style={styles.iconContainer}>
                <LeafIcon color={Theme.colors.secondary} size={20} />
              </View>
              <Controller
                control={control}
                name="nombreFinca"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={styles.input}
                    placeholder="Ej. Finca La Variante"
                    placeholderTextColor={Theme.colors.outline}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                  />
                )}
              />
            </View>
          </View>

          {/* Telefono */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Número de teléfono</Text>
            <View style={[styles.inputWrapper, errors.telefono && styles.inputErrorBorder]}>
              <View style={styles.iconContainer}>
                <PhoneIcon color={Theme.colors.secondary} size={20} />
              </View>
              <Controller
                control={control}
                name="telefono"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={styles.input}
                    placeholder="310 000 0000"
                    placeholderTextColor={Theme.colors.outline}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    keyboardType="phone-pad"
                    maxLength={10}
                  />
                )}
              />
            </View>
            {errors.telefono && <Text style={styles.errorText}>{errors.telefono.message}</Text>}
          </View>

          {/* Correo Electrónico */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Correo electrónico (Opcional)</Text>
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
                    placeholder="ejemplo@correo.com"
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

          {/* Contraseña */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Contraseña</Text>
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

            {/* Indicador de Fortaleza de Contraseña */}
            <View style={styles.strengthContainer}>
              <Text style={styles.strengthTitle}>Requisitos de seguridad:</Text>
              <View style={styles.requirementRow}>
                <Text style={hasMinLength ? styles.reqMet : styles.reqNotMet}>
                  {hasMinLength ? '✓' : '•'} Mínimo 8 caracteres
                </Text>
              </View>
              <View style={styles.requirementRow}>
                <Text style={hasUppercase ? styles.reqMet : styles.reqNotMet}>
                  {hasUppercase ? '✓' : '•'} Al menos 1 letra mayúscula
                </Text>
              </View>
              <View style={styles.requirementRow}>
                <Text style={hasNumber ? styles.reqMet : styles.reqNotMet}>
                  {hasNumber ? '✓' : '•'} Al menos 1 número
                </Text>
              </View>
            </View>
          </View>

          {/* Submit Button (Stitch: Amber color, dark text) */}
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSubmit(onSubmit)}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#2a1700" />
            ) : (
              <View style={styles.buttonContent}>
                <Text style={styles.buttonText}>Registrarse</Text>
                <ArrowRightIcon color="#2a1700" size={18} />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Footer Link */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            ¿Ya tienes una cuenta?{' '}
            <Text 
              style={styles.loginLink}
              onPress={() => navigation.navigate('Login')}
            >
              Ya tengo una cuenta
            </Text>
          </Text>
          <Text style={styles.footerNote}>© 2026 CultivIA - Impulsando el campo colombiano.</Text>
        </View>

        {/* Modal Selector de Municipio */}
        <Modal
          visible={municipioModalVisible}
          transparent={true}
          animationType="slide"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <SafeAreaView style={styles.modalSafeArea}>
                <Text style={styles.modalTitle}>Municipios del Catatumbo</Text>
                <FlatList
                  data={MUNICIPIOS_CATATUMBO}
                  keyExtractor={(item) => item}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.modalItem}
                      onPress={() => {
                        setValue('municipio', item, { shouldValidate: true });
                        setMunicipioModalVisible(false);
                      }}
                    >
                      <Text style={[styles.modalItemText, selectedMunicipio === item && styles.modalItemSelectedText]}>
                        {item}
                      </Text>
                      {selectedMunicipio === item && <CheckIcon color={Theme.colors.primary} size={20} />}
                    </TouchableOpacity>
                  )}
                  ItemSeparatorComponent={() => <View style={styles.modalSeparator} />}
                />
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setMunicipioModalVisible(false)}
                >
                  <Text style={styles.modalCloseButtonText}>Cancelar</Text>
                </TouchableOpacity>
              </SafeAreaView>
            </View>
          </View>
        </Modal>
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
    marginTop: 20,
  },
  logoContainer: {
    width: 96,
    height: 96,
    borderRadius: Theme.roundness.full,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#5c403a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
    marginBottom: Theme.spacing.stackSm,
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
    paddingHorizontal: 30,
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
    borderRadius: Theme.roundness.full, // Inputs are fully rounded (pill-shaped) in Register
    height: 56,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  disabledInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e9e9d1',
    borderRadius: Theme.roundness.full,
    height: 56,
    paddingHorizontal: 20,
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
  disabledInput: {
    flex: 1,
    height: '100%',
    color: Theme.colors.outline,
    fontSize: 16,
  },
  selectText: {
    flex: 1,
    fontSize: 16,
    color: Theme.colors.onSurface,
  },
  placeholderText: {
    color: Theme.colors.outline,
  },
  dropdownArrow: {
    fontSize: 12,
    color: Theme.colors.secondary,
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
  strengthContainer: {
    backgroundColor: Theme.colors.surfaceContainer,
    padding: 12,
    borderRadius: Theme.roundness.default,
    marginTop: 10,
  },
  strengthTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Theme.colors.onSurfaceVariant,
    marginBottom: 6,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  reqMet: {
    fontSize: 13,
    color: Theme.colors.primary,
    fontWeight: '600',
  },
  reqNotMet: {
    fontSize: 13,
    color: Theme.colors.outline,
  },
  button: {
    backgroundColor: Theme.colors.tertiary, // Vibrant Amber
    height: Theme.spacing.touchTargetMin,
    borderRadius: Theme.roundness.full,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#5c403a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
    marginTop: 16,
  },
  buttonDisabled: {
    backgroundColor: Theme.colors.outlineVariant,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    color: '#2a1700', // Dark Brown text for Amber button
    fontWeight: '700',
    fontSize: 16,
    marginRight: 8,
  },
  buttonArrow: {
    color: '#2a1700',
    fontSize: 16,
    fontWeight: '700',
  },
  footer: {
    alignItems: 'center',
    marginTop: Theme.spacing.stackLg,
  },
  footerText: {
    fontSize: 14,
    color: Theme.colors.onSurfaceVariant,
  },
  loginLink: {
    color: Theme.colors.primary,
    fontWeight: '700',
  },
  footerNote: {
    fontSize: 12,
    color: Theme.colors.outline,
    marginTop: 16,
    opacity: 0.6,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(21, 66, 18, 0.4)', // Overlay with primary-ish backdrop
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: Theme.roundness.md,
    borderTopRightRadius: Theme.roundness.md,
    maxHeight: '60%',
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  modalSafeArea: {
    width: '100%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Theme.colors.primary,
    marginVertical: 20,
    textAlign: 'center',
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    height: 56,
  },
  modalItemText: {
    fontSize: 16,
    color: Theme.colors.onSurfaceVariant,
  },
  modalItemSelectedText: {
    color: Theme.colors.primary,
    fontWeight: '700',
  },
  modalItemCheck: {
    color: Theme.colors.primary,
    fontSize: 18,
    fontWeight: '700',
  },
  modalSeparator: {
    height: 1,
    backgroundColor: Theme.colors.outlineVariant,
  },
  modalCloseButton: {
    backgroundColor: Theme.colors.surfaceContainer,
    borderRadius: Theme.roundness.full,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  modalCloseButtonText: {
    color: Theme.colors.secondary,
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
