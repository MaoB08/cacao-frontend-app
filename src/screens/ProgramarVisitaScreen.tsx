import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { agronomoService } from '../services/agronomoService';
import { visitaService } from '../services/visitaService';
import { FincaAgronomo, LoteResumen, CrearVisitaRequest } from '../types/visita';
import { Theme } from '../constants/theme';
import {
  ArrowLeftIcon,
  CalendarIcon,
  ClockIcon,
  SearchIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  AlertTriangleIcon,
} from '../components/Icons';
import { useAccesibilidad } from '../contexts/AccesibilidadContext';

const DURACIONES = [30, 45, 60, 90, 120];

export const ProgramarVisitaScreen = ({ navigation, route }: any) => {
  const { colores, escalaTexto, botonesGrandes } = useAccesibilidad();
  const getScaledFont = (size: number) => size * escalaTexto;

  // Form states
  const [fincas, setFincas] = useState<FincaAgronomo[]>([]);
  const [fincaSeleccionada, setFincaSeleccionada] = useState<FincaAgronomo | null>(null);
  const [lotes, setLotes] = useState<LoteResumen[]>([]);
  const [loteSeleccionado, setLoteSeleccionado] = useState<LoteResumen | null>(null);

  // Fecha y hora: usamos componentes accesibles con inputs para fecha y hora
  const hoy = new Date();
  const manana = new Date(hoy);
  manana.setDate(manana.getDate() + 1);
  manana.setHours(9, 0, 0, 0);

  const [fechaStr, setFechaStr] = useState(
    `${manana.getFullYear()}-${String(manana.getMonth() + 1).padStart(2, '0')}-${String(
      manana.getDate()
    ).padStart(2, '0')}`
  );
  const [horaStr, setHoraStr] = useState('09:00');
  const [duracionMin, setDuracionMin] = useState(60);
  const [motivo, setMotivo] = useState('');
  const [notasPrevias, setNotasPrevias] = useState('');

  // Modales y estados de búsqueda
  const [modalFincasVisible, setModalFincasVisible] = useState(false);
  const [modalLotesVisible, setModalLotesVisible] = useState(false);
  const [searchFinca, setSearchFinca] = useState('');
  const [loadingFincas, setLoadingFincas] = useState(false);
  const [loadingLotes, setLoadingLotes] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [errorGlobal, setErrorGlobal] = useState<string | null>(null);

  // Cargar fincas autorizadas
  const cargarFincas = useCallback(async (query: string = '') => {
    try {
      setLoadingFincas(true);
      const res = await agronomoService.getFincasAsignadas(query, 0, 30);
      setFincas(res.content || []);
    } catch (e: any) {
      Alert.alert('Error', 'No se pudieron cargar las fincas autorizadas');
    } finally {
      setLoadingFincas(false);
    }
  }, []);

  useEffect(() => {
    cargarFincas();
  }, [cargarFincas]);

  // Al seleccionar finca, cargar sus lotes
  const handleSeleccionarFinca = async (finca: FincaAgronomo) => {
    setFincaSeleccionada(finca);
    setLoteSeleccionado(null);
    setModalFincasVisible(false);
    try {
      setLoadingLotes(true);
      const detalle = await agronomoService.getFincaDetalle(finca.id);
      setLotes(detalle.lotes || []);
    } catch {
      setLotes([]);
    } finally {
      setLoadingLotes(false);
    }
  };

  const validarFormulario = (): { valido: boolean; mensaje?: string; fechaIso?: string } => {
    if (!fincaSeleccionada) {
      return { valido: false, mensaje: 'Debes seleccionar una finca para la visita' };
    }
    if (!motivo.trim() || motivo.trim().length < 5) {
      return {
        valido: false,
        mensaje: 'El motivo de la visita debe tener al menos 5 caracteres',
      };
    }

    // Validar formato de fecha (YYYY-MM-DD) y hora (HH:mm)
    const regexFecha = /^\d{4}-\d{2}-\d{2}$/;
    const regexHora = /^\d{2}:\d{2}$/;
    if (!regexFecha.test(fechaStr) || !regexHora.test(horaStr)) {
      return {
        valido: false,
        mensaje: 'Formato inválido. Usa formato AAAA-MM-DD para fecha y HH:mm para hora',
      };
    }

    const fechaCombinada = new Date(`${fechaStr}T${horaStr}:00`);
    if (isNaN(fechaCombinada.getTime())) {
      return { valido: false, mensaje: 'La fecha u hora ingresada no es válida' };
    }

    const ahora = new Date();
    if (fechaCombinada <= ahora) {
      return { valido: false, mensaje: 'La fecha y hora de la visita debe ser en el futuro' };
    }

    // Formatear ISO LocalDateTime: YYYY-MM-DDTHH:mm:ss
    const isoString = `${fechaStr}T${horaStr}:00`;
    return { valido: true, fechaIso: isoString };
  };

  const handleGuardar = () => {
    const validacion = validarFormulario();
    if (!validacion.valido) {
      Alert.alert('Datos incompletos', validacion.mensaje);
      return;
    }

    Alert.alert(
      'Confirmar Programación',
      `¿Deseas programar la visita técnica a la finca "${fincaSeleccionada?.nombre}" para el ${fechaStr} a las ${horaStr}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          style: 'default',
          onPress: async () => {
            try {
              setGuardando(true);
              setErrorGlobal(null);
              const request: CrearVisitaRequest = {
                fincaId: fincaSeleccionada!.id,
                loteId: loteSeleccionado ? loteSeleccionado.id : undefined,
                fechaProgramada: validacion.fechaIso!,
                duracionEstimadaMin: duracionMin,
                motivo: motivo.trim(),
                notasPrevias: notasPrevias.trim() || undefined,
              };

              const nuevaVisita = await visitaService.crearVisita(request);

              Alert.alert(
                '¡Visita Programada!',
                'La visita técnica se ha agendado con éxito.',
                [
                  {
                    text: 'Ver Detalle',
                    onPress: () => {
                      navigation.replace('DetalleVisita', { visitaId: nuevaVisita.id });
                    },
                  },
                ]
              );
            } catch (err: any) {
              const msg =
                err?.response?.data?.mensaje ||
                err?.response?.data?.error ||
                err?.mensaje ||
                err?.message ||
                'No se pudo programar la visita. Verifica la disponibilidad.';
              setErrorGlobal(msg);
              Alert.alert('Error al programar', msg);
            } finally {
              setGuardando(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.container, { backgroundColor: colores.background }]}
    >
      {/* Top Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Volver a la pantalla anterior"
        >
          <ArrowLeftIcon color={colores.primary} size={22} />
        </TouchableOpacity>
        <Text
          style={[
            styles.headerTitle,
            { fontSize: getScaledFont(18), color: colores.primary },
          ]}
        >
          Programar Visita Técnica
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {errorGlobal && (
          <View style={[styles.errorBanner, { backgroundColor: '#fee2e2', borderColor: '#fca5a5' }]}>
            <AlertTriangleIcon color="#b91c1c" size={20} />
            <Text style={[styles.errorBannerText, { fontSize: getScaledFont(13), color: '#991b1b' }]}>
              {errorGlobal}
            </Text>
          </View>
        )}

        {/* 1. Selector de Finca */}
        <View style={styles.formGroup}>
          <Text style={[styles.label, { fontSize: getScaledFont(14), color: colores.onSurface }]}>
            Finca autorizada <Text style={{ color: colores.error }}>*</Text>
          </Text>
          <TouchableOpacity
            style={[
              styles.selectTrigger,
              {
                backgroundColor: colores.surfaceContainerLowest,
                borderColor: fincaSeleccionada ? colores.primary : colores.outlineVariant,
                minHeight: botonesGrandes ? 54 : 48,
              },
            ]}
            onPress={() => {
              setSearchFinca('');
              cargarFincas('');
              setModalFincasVisible(true);
            }}
            accessibilityRole="button"
            accessibilityLabel="Seleccionar finca autorizada"
          >
            <View style={{ flex: 1 }}>
              {fincaSeleccionada ? (
                <>
                  <Text
                    style={[
                      styles.selectValue,
                      { fontSize: getScaledFont(15), color: colores.onSurface },
                    ]}
                  >
                    {fincaSeleccionada.nombre}
                  </Text>
                  <Text
                    style={[
                      styles.selectSubvalue,
                      { fontSize: getScaledFont(12), color: colores.onSurfaceVariant },
                    ]}
                  >
                    📍 {fincaSeleccionada.municipio}, {fincaSeleccionada.departamento}
                  </Text>
                </>
              ) : (
                <Text
                  style={[
                    styles.selectPlaceholder,
                    { fontSize: getScaledFont(14), color: colores.outline },
                  ]}
                >
                  Toca para seleccionar una finca asignada...
                </Text>
              )}
            </View>
            <ChevronDownIcon color={colores.outline} size={20} />
          </TouchableOpacity>
        </View>

        {/* 2. Selector de Lote (opcional) */}
        {fincaSeleccionada && (
          <View style={styles.formGroup}>
            <Text style={[styles.label, { fontSize: getScaledFont(14), color: colores.onSurface }]}>
              Lote específico (opcional)
            </Text>
            {loadingLotes ? (
              <ActivityIndicator size="small" color={colores.primary} />
            ) : lotes.length === 0 ? (
              <View
                style={[
                  styles.selectTrigger,
                  {
                    backgroundColor: colores.surfaceContainerLowest,
                    borderColor: colores.outlineVariant,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.selectSubvalue,
                    { fontSize: getScaledFont(13), color: colores.onSurfaceVariant },
                  ]}
                >
                  Toda la finca (no hay lotes registrados)
                </Text>
              </View>
            ) : (
              <TouchableOpacity
                style={[
                  styles.selectTrigger,
                  {
                    backgroundColor: colores.surfaceContainerLowest,
                    borderColor: colores.outlineVariant,
                    minHeight: botonesGrandes ? 54 : 48,
                  },
                ]}
                onPress={() => setModalLotesVisible(true)}
                accessibilityRole="button"
                accessibilityLabel="Seleccionar lote específico"
              >
                <View style={{ flex: 1 }}>
                  {loteSeleccionado ? (
                    <>
                      <Text
                        style={[
                          styles.selectValue,
                          { fontSize: getScaledFont(15), color: colores.onSurface },
                        ]}
                      >
                        {loteSeleccionado.nombre}
                      </Text>
                      {loteSeleccionado.variedadCacao && (
                        <Text
                          style={[
                            styles.selectSubvalue,
                            { fontSize: getScaledFont(12), color: colores.onSurfaceVariant },
                          ]}
                        >
                          Variedad: {loteSeleccionado.variedadCacao}
                        </Text>
                      )}
                    </>
                  ) : (
                    <Text
                      style={[
                        styles.selectValue,
                        { fontSize: getScaledFont(14), color: colores.onSurfaceVariant },
                      ]}
                    >
                      Toda la finca (sin lote específico)
                    </Text>
                  )}
                </View>
                <ChevronDownIcon color={colores.outline} size={20} />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* 3. Fecha y Hora */}
        <View style={styles.dateTimeRow}>
          <View style={[styles.formGroup, { flex: 1 }]}>
            <Text style={[styles.label, { fontSize: getScaledFont(14), color: colores.onSurface }]}>
              Fecha (AAAA-MM-DD) <Text style={{ color: colores.error }}>*</Text>
            </Text>
            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: colores.surfaceContainerLowest,
                  borderColor: colores.outlineVariant,
                  minHeight: botonesGrandes ? 54 : 48,
                },
              ]}
            >
              <CalendarIcon color={colores.secondary} size={18} />
              <TextInput
                style={[
                  styles.textInput,
                  { fontSize: getScaledFont(14), color: colores.onSurface },
                ]}
                value={fechaStr}
                onChangeText={setFechaStr}
                placeholder="2026-10-15"
                placeholderTextColor={colores.outline}
                accessibilityLabel="Fecha de la visita"
              />
            </View>
          </View>

          <View style={[styles.formGroup, { flex: 1 }]}>
            <Text style={[styles.label, { fontSize: getScaledFont(14), color: colores.onSurface }]}>
              Hora (HH:mm) <Text style={{ color: colores.error }}>*</Text>
            </Text>
            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: colores.surfaceContainerLowest,
                  borderColor: colores.outlineVariant,
                  minHeight: botonesGrandes ? 54 : 48,
                },
              ]}
            >
              <ClockIcon color={colores.secondary} size={18} />
              <TextInput
                style={[
                  styles.textInput,
                  { fontSize: getScaledFont(14), color: colores.onSurface },
                ]}
                value={horaStr}
                onChangeText={setHoraStr}
                placeholder="09:00"
                placeholderTextColor={colores.outline}
                accessibilityLabel="Hora de la visita"
              />
            </View>
          </View>
        </View>

        {/* 4. Duración Estimada */}
        <View style={styles.formGroup}>
          <Text style={[styles.label, { fontSize: getScaledFont(14), color: colores.onSurface }]}>
            Duración estimada (minutos)
          </Text>
          <View style={styles.duracionesRow}>
            {DURACIONES.map((d) => {
              const activo = duracionMin === d;
              return (
                <TouchableOpacity
                  key={d}
                  style={[
                    styles.duracionChip,
                    {
                      backgroundColor: activo ? colores.primary : colores.surfaceContainerLowest,
                      borderColor: activo ? colores.primary : colores.outlineVariant,
                      minHeight: botonesGrandes ? 54 : 48,
                    },
                  ]}
                  onPress={() => setDuracionMin(d)}
                  accessibilityRole="button"
                  accessibilityLabel={`${d} minutos`}
                >
                  <Text
                    style={[
                      styles.duracionChipText,
                      {
                        fontSize: getScaledFont(13),
                        color: activo ? '#ffffff' : colores.onSurface,
                        fontWeight: activo ? '700' : '500',
                      },
                    ]}
                  >
                    {d} min
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 5. Motivo de la visita */}
        <View style={styles.formGroup}>
          <Text style={[styles.label, { fontSize: getScaledFont(14), color: colores.onSurface }]}>
            Motivo técnico de la visita <Text style={{ color: colores.error }}>*</Text>
          </Text>
          <TextInput
            style={[
              styles.textArea,
              {
                backgroundColor: colores.surfaceContainerLowest,
                borderColor: colores.outlineVariant,
                fontSize: getScaledFont(14),
                color: colores.onSurface,
              },
            ]}
            value={motivo}
            onChangeText={setMotivo}
            placeholder="Ej: Evaluación fitosanitaria de mazorcas por sospecha de monilia y asesoría en poda..."
            placeholderTextColor={colores.outline}
            multiline
            numberOfLines={3}
            accessibilityLabel="Motivo de la visita"
          />
        </View>

        {/* 6. Notas previas (opcional) */}
        <View style={styles.formGroup}>
          <Text style={[styles.label, { fontSize: getScaledFont(14), color: colores.onSurface }]}>
            Instrucciones o notas previas para el productor (opcional)
          </Text>
          <TextInput
            style={[
              styles.textArea,
              {
                backgroundColor: colores.surfaceContainerLowest,
                borderColor: colores.outlineVariant,
                fontSize: getScaledFont(14),
                color: colores.onSurface,
              },
            ]}
            value={notasPrevias}
            onChangeText={setNotasPrevias}
            placeholder="Ej: Favor tener a disposición tijeras de podar desinfectadas y registro de lluvia..."
            placeholderTextColor={colores.outline}
            multiline
            numberOfLines={2}
            accessibilityLabel="Notas previas"
          />
        </View>

        {/* Botón Guardar */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            {
              backgroundColor: colores.primary,
              minHeight: botonesGrandes ? 56 : 50,
              opacity: guardando ? 0.7 : 1,
            },
          ]}
          onPress={handleGuardar}
          disabled={guardando}
          accessibilityRole="button"
          accessibilityLabel="Confirmar y programar visita técnica"
        >
          {guardando ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <>
              <CheckIcon color="#ffffff" size={20} />
              <Text style={[styles.submitButtonText, { fontSize: getScaledFont(16) }]}>
                Agendar visita técnica
              </Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* MODAL SELECTOR DE FINCAS */}
      <Modal visible={modalFincasVisible} animationType="slide" transparent>
        <SafeAreaView style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContainer,
              { backgroundColor: colores.surfaceContainerLowest },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text
                style={[
                  styles.modalTitle,
                  { fontSize: getScaledFont(18), color: colores.primary },
                ]}
              >
                Seleccionar Finca Autorizada
              </Text>
              <TouchableOpacity
                onPress={() => setModalFincasVisible(false)}
                style={styles.modalCloseBtn}
              >
                <Text style={{ fontSize: 18, color: colores.outline }}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Buscador de fincas */}
            <View
              style={[
                styles.modalSearchBar,
                {
                  backgroundColor: colores.surfaceContainer,
                  borderColor: colores.outlineVariant,
                },
              ]}
            >
              <SearchIcon color={colores.outline} size={18} />
              <TextInput
                style={[
                  styles.modalSearchInput,
                  { fontSize: getScaledFont(14), color: colores.onSurface },
                ]}
                placeholder="Buscar por nombre o municipio..."
                placeholderTextColor={colores.outline}
                value={searchFinca}
                onChangeText={(t) => {
                  setSearchFinca(t);
                  cargarFincas(t);
                }}
              />
            </View>

            {loadingFincas ? (
              <ActivityIndicator
                size="large"
                color={colores.primary}
                style={{ marginVertical: 30 }}
              />
            ) : fincas.length === 0 ? (
              <View style={styles.modalEmpty}>
                <Text
                  style={[
                    styles.modalEmptyText,
                    { fontSize: getScaledFont(14), color: colores.onSurfaceVariant },
                  ]}
                >
                  No se encontraron fincas asignadas activas.
                </Text>
              </View>
            ) : (
              <ScrollView style={{ flex: 1 }}>
                {fincas.map((f) => (
                  <TouchableOpacity
                    key={f.id}
                    style={[
                      styles.fincaModalItem,
                      { borderBottomColor: colores.outlineVariant },
                    ]}
                    onPress={() => handleSeleccionarFinca(f)}
                  >
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.fincaModalName,
                          { fontSize: getScaledFont(15), color: colores.onSurface },
                        ]}
                      >
                        {f.nombre}
                      </Text>
                      <Text
                        style={[
                          styles.fincaModalMeta,
                          { fontSize: getScaledFont(13), color: colores.onSurfaceVariant },
                        ]}
                      >
                        📍 {f.municipio}, {f.departamento} • {f.totalLotes} lotes
                      </Text>
                    </View>
                    <ChevronRightIcon
                      color={colores.primary}
                      size={18}
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </SafeAreaView>
      </Modal>

      {/* MODAL SELECTOR DE LOTES */}
      <Modal visible={modalLotesVisible} animationType="slide" transparent>
        <SafeAreaView style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContainer,
              { backgroundColor: colores.surfaceContainerLowest },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text
                style={[
                  styles.modalTitle,
                  { fontSize: getScaledFont(18), color: colores.primary },
                ]}
              >
                Seleccionar Lote
              </Text>
              <TouchableOpacity
                onPress={() => setModalLotesVisible(false)}
                style={styles.modalCloseBtn}
              >
                <Text style={{ fontSize: 18, color: colores.outline }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1 }}>
              {/* Opción Toda la finca */}
              <TouchableOpacity
                style={[
                  styles.fincaModalItem,
                  { borderBottomColor: colores.outlineVariant },
                ]}
                onPress={() => {
                  setLoteSeleccionado(null);
                  setModalLotesVisible(false);
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.fincaModalName,
                      { fontSize: getScaledFont(15), color: colores.primary },
                    ]}
                  >
                    Toda la finca (general)
                  </Text>
                  <Text
                    style={[
                      styles.fincaModalMeta,
                      { fontSize: getScaledFont(13), color: colores.onSurfaceVariant },
                    ]}
                  >
                    Inspección sin asignación a lote exclusivo
                  </Text>
                </View>
                {!loteSeleccionado && <CheckIcon color={colores.primary} size={20} />}
              </TouchableOpacity>

              {lotes.map((l) => (
                <TouchableOpacity
                  key={l.id}
                  style={[
                    styles.fincaModalItem,
                    { borderBottomColor: colores.outlineVariant },
                  ]}
                  onPress={() => {
                    setLoteSeleccionado(l);
                    setModalLotesVisible(false);
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.fincaModalName,
                        { fontSize: getScaledFont(15), color: colores.onSurface },
                      ]}
                    >
                      {l.nombre}
                    </Text>
                    <Text
                      style={[
                        styles.fincaModalMeta,
                        { fontSize: getScaledFont(13), color: colores.onSurfaceVariant },
                      ]}
                    >
                      Variedad: {l.variedadCacao || 'No especificada'}
                    </Text>
                  </View>
                  {loteSeleccionado?.id === l.id && (
                    <CheckIcon color={colores.primary} size={20} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontWeight: '800',
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: Theme.roundness.md,
    borderWidth: 1,
    marginBottom: 16,
  },
  errorBannerText: {
    flex: 1,
    fontWeight: '600',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontWeight: '700',
    marginBottom: 8,
  },
  selectTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: Theme.roundness.md,
    borderWidth: 1,
  },
  selectValue: {
    fontWeight: '600',
  },
  selectSubvalue: {
    marginTop: 2,
  },
  selectPlaceholder: {
    fontStyle: 'italic',
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderRadius: Theme.roundness.md,
    borderWidth: 1,
  },
  textInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  duracionesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  duracionChip: {
    paddingHorizontal: 14,
    borderRadius: Theme.roundness.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  duracionChipText: {},
  textArea: {
    padding: 12,
    borderRadius: Theme.roundness.md,
    borderWidth: 1,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: Theme.roundness.md,
    marginTop: 10,
    shadowColor: '#154212',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '80%',
    minHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontWeight: '800',
  },
  modalCloseBtn: {
    padding: 8,
  },
  modalSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Theme.roundness.md,
    borderWidth: 1,
    marginBottom: 16,
    gap: 8,
  },
  modalSearchInput: {
    flex: 1,
  },
  modalEmpty: {
    padding: 30,
    alignItems: 'center',
  },
  modalEmptyText: {
    textAlign: 'center',
  },
  fincaModalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  fincaModalName: {
    fontWeight: '700',
    marginBottom: 2,
  },
  fincaModalMeta: {},
});
