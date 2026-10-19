import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { visitaService } from '../services/visitaService';
import {
  VisitaDetalle,
  VisitaImagen,
  FinalizarVisitaRequest,
  BorradorVisita,
} from '../types/visita';
import { Theme } from '../constants/theme';
import {
  ArrowLeftIcon,
  CheckIcon,
  ClockIcon,
  MapPinIcon,
  UserIcon,
  PhoneIcon,
  CameraIcon,
  ImageIcon,
  SparklesIcon,
  AlertTriangleIcon,
  ActivityIcon,
  CloseIcon,
  PlusIcon,
  WhatsAppIcon,
} from '../components/Icons';
import { useAccesibilidad } from '../contexts/AccesibilidadContext';
import { abrirWhatsApp, llamarTelefono } from '../utils/whatsapp';
import { resolveMediaUrl } from '../utils/mediaUtils';

export const VisitaEnCursoScreen = ({ route, navigation }: any) => {
  const { colores, escalaTexto, botonesGrandes } = useAccesibilidad();
  const getScaledFont = (size: number) => size * escalaTexto;

  const visitaId = route?.params?.visitaId;

  // Estado de la visita
  const [visita, setVisita] = useState<VisitaDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Formulario agronómico de campo
  const [observaciones, setObservaciones] = useState('');
  const [recomendaciones, setRecomendaciones] = useState('');
  const [plantasRevisadas, setPlantasRevisadas] = useState('');
  const [plantasEnfermas, setPlantasEnfermas] = useState('');
  const [informeFinal, setInformeFinal] = useState('');

  // Temporizador en vivo
  const [minutosTranscurridos, setMinutosTranscurridos] = useState(0);

  // Evidencias fotográficas
  const [imagenes, setImagenes] = useState<VisitaImagen[]>([]);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [analizandoImgId, setAnalizandoImgId] = useState<string | null>(null);

  // Modal para agregar foto con nota y lote
  const [modalFotoVisible, setModalFotoVisible] = useState(false);
  const [tempFotoUri, setTempFotoUri] = useState<string | null>(null);
  const [fotoNotas, setFotoNotas] = useState('');
  const [fotoLoteId, setFotoLoteId] = useState<string | undefined>(undefined);

  // Modal finalizar visita
  const [modalFinalizarVisible, setModalFinalizarVisible] = useState(false);
  const [finalizando, setFinalizando] = useState(false);

  // Feedback de borrador
  const [borradorFeedback, setBorradorFeedback] = useState<string | null>(null);
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Cargar datos iniciales de la visita y borrador
  const cargarVisita = useCallback(async () => {
    if (!visitaId) {
      setError('Identificador de visita no válido');
      setLoading(false);
      return;
    }

    try {
      setError(null);
      let data = await visitaService.obtenerDetalle(visitaId);

      // Si la visita está en PROGRAMADA, iniciarla automáticamente
      if (data.estado === 'PROGRAMADA' || data.estado === 'REPROGRAMADA') {
        data = await visitaService.iniciarVisita(visitaId);
      }

      setVisita(data);
      setFotoLoteId(data.loteId);

      // Cargar imágenes
      if (data.imagenes) {
        setImagenes(data.imagenes);
      } else {
        const imgs = await visitaService.listarImagenes(visitaId);
        setImagenes(imgs);
      }

      const cleanNumero = (val?: string | number | null): string => {
        if (val == null) return '';
        const s = String(val).trim();
        return (s === 'null' || s === 'undefined' || s === 'NaN') ? '' : s;
      };

      // Cargar borrador local si existe
      const borrador = await visitaService.obtenerBorrador(visitaId);
      if (borrador) {
        if (borrador.observaciones) setObservaciones(borrador.observaciones);
        if (borrador.recomendaciones) setRecomendaciones(borrador.recomendaciones);
        if (borrador.plantasRevisadas != null) setPlantasRevisadas(cleanNumero(borrador.plantasRevisadas));
        if (borrador.plantasEnfermas != null) setPlantasEnfermas(cleanNumero(borrador.plantasEnfermas));
        if (borrador.informeFinal) setInformeFinal(borrador.informeFinal);
        setBorradorFeedback('Borrador previo restaurado');
      } else {
        // Cargar lo que ya tenga la visita en el backend (verificando que no sea null)
        if (data.observaciones) setObservaciones(data.observaciones);
        if (data.recomendaciones) setRecomendaciones(data.recomendaciones);
        if (data.plantasRevisadas != null) setPlantasRevisadas(cleanNumero(data.plantasRevisadas));
        if (data.plantasEnfermas != null) setPlantasEnfermas(cleanNumero(data.plantasEnfermas));
        if (data.informeFinal) setInformeFinal(data.informeFinal);
      }
    } catch (e: any) {
      setError(e?.mensaje || e?.message || 'Error al iniciar o cargar la visita');
    } finally {
      setLoading(false);
    }
  }, [visitaId]);

  useEffect(() => {
    cargarVisita();
  }, [cargarVisita]);

  // Manejar retorno desde CamaraScreen con foto vinculada
  useEffect(() => {
    if (route?.params?.nuevaFotoUri) {
      setTempFotoUri(route.params.nuevaFotoUri);
      setModalFotoVisible(true);
      navigation.setParams({ nuevaFotoUri: undefined });
    }
  }, [route?.params?.nuevaFotoUri]);

  // Cronómetro dinámico
  useEffect(() => {
    if (!visita?.fechaInicioReal) return;
    const inicio = new Date(visita.fechaInicioReal).getTime();

    const actualizarTiempo = () => {
      const ahora = Date.now();
      const difMin = Math.max(0, Math.floor((ahora - inicio) / 60000));
      setMinutosTranscurridos(difMin);
    };

    actualizarTiempo();
    const interval = setInterval(actualizarTiempo, 30000); // cada 30 segundos
    return () => clearInterval(interval);
  }, [visita?.fechaInicioReal]);

  // Autosave del borrador cada vez que el formulario cambia
  useEffect(() => {
    if (!visitaId) return;

    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }

    autosaveTimerRef.current = setTimeout(async () => {
      const borrador: BorradorVisita = {
        visitaId,
        observaciones,
        recomendaciones,
        plantasRevisadas,
        plantasEnfermas,
        informeFinal,
        guardadoEn: new Date().toISOString(),
      };
      await visitaService.guardarBorrador(visitaId, borrador);
      setBorradorFeedback('Guardado local automático');
    }, 2000);

    return () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    };
  }, [visitaId, observaciones, recomendaciones, plantasRevisadas, plantasEnfermas, informeFinal]);

  // Guardar borrador manual
  const handleGuardarBorradorManual = async () => {
    if (!visitaId) return;
    const borrador: BorradorVisita = {
      visitaId,
      observaciones,
      recomendaciones,
      plantasRevisadas,
      plantasEnfermas,
      informeFinal,
      guardadoEn: new Date().toISOString(),
    };
    await visitaService.guardarBorrador(visitaId, borrador);
    Alert.alert('Borrador Guardado', 'Los datos de la atención técnica han sido guardados en la memoria local del dispositivo.');
    setBorradorFeedback('Borrador guardado');
  };

  // Tomar fotografía nativa
  const handleTomarFoto = async () => {
    try {
      const { granted } = await ImagePicker.requestCameraPermissionsAsync();
      if (!granted) {
        Alert.alert('Permiso requerido', 'Se requiere acceso a la cámara para capturar evidencias de campo.');
        return;
      }
      const res = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.85,
        allowsEditing: true,
      });

      if (!res.canceled && res.assets[0]?.uri) {
        setTempFotoUri(res.assets[0].uri);
        setModalFotoVisible(true);
      }
    } catch {
      Alert.alert('Error', 'No se pudo abrir la cámara en el dispositivo.');
    }
  };

  // Seleccionar foto de galería
  const handleSeleccionarGaleria = async () => {
    try {
      const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!granted) {
        Alert.alert('Permiso requerido', 'Se requiere acceso a la galería.');
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.85,
        allowsEditing: true,
      });

      if (!res.canceled && res.assets[0]?.uri) {
        setTempFotoUri(res.assets[0].uri);
        setModalFotoVisible(true);
      }
    } catch {
      Alert.alert('Error', 'No se pudo seleccionar la imagen.');
    }
  };

  // Confirmar y subir foto
  const handleConfirmarSubidaFoto = async () => {
    if (!tempFotoUri || !visitaId) return;

    try {
      setSubiendoFoto(true);
      const nueva = await visitaService.subirImagen(
        visitaId,
        tempFotoUri,
        fotoLoteId,
        fotoNotas.trim() || undefined
      );

      setImagenes((prev) => [{ ...nueva, imagenUrl: tempFotoUri || nueva.imagenUrl }, ...prev]);
      setModalFotoVisible(false);
      setTempFotoUri(null);
      setFotoNotas('');
      Alert.alert('Foto Vinculada', 'La evidencia fotográfica se adjuntó exitosamente a la visita técnica.');
    } catch (err: any) {
      const msg = err?.response?.data?.mensaje || err?.mensaje || 'Error al subir la imagen';
      Alert.alert('Error de subida', msg);
    } finally {
      setSubiendoFoto(false);
    }
  };

  // Solicitar análisis IA de imagen
  const handleAnalizarImagen = async (imgId: string) => {
    if (!visitaId) return;
    try {
      setAnalizandoImgId(imgId);
      const res = await visitaService.analizarImagen(visitaId, imgId);

      if (res.status === 'no_disponible') {
        Alert.alert(
          'Análisis IA No Disponible',
          'El servicio neuronal de CultivIA se encuentra temporalmente fuera de línea. La fotografía ha quedado resguardada como evidencia técnica sin alteración.'
        );
        // Actualizar estado en UI
        setImagenes((prev) =>
          prev.map((img) =>
            img.id === imgId ? { ...img, analisisStatus: 'no_disponible' } : img
          )
        );
      } else if (res.status === 'ok') {
        Alert.alert(
          'Diagnóstico IA Generado',
          `Resultado: ${res.enfermedadDetectada || 'Sin anomalías'}\nConfianza: ${res.confianza || 'N/A'}`
        );
        setImagenes((prev) =>
          prev.map((img) =>
            img.id === imgId
              ? {
                  ...img,
                  analisisId: res.analisisId,
                  enfermedadDetectada: res.enfermedadDetectada,
                  confianza: res.confianza,
                  analisisStatus: 'completado',
                }
              : img
          )
        );
      }
    } catch (err: any) {
      Alert.alert('Error', 'No fue posible completar la solicitud de análisis.');
    } finally {
      setAnalizandoImgId(null);
    }
  };

  // Finalizar visita técnica
  const handleConfirmarFinalizar = async () => {
    if (!visitaId) return;

    try {
      setFinalizando(true);
      const req: FinalizarVisitaRequest = {
        observaciones: observaciones.trim() || undefined,
        recomendaciones: recomendaciones.trim() || undefined,
        plantasRevisadas: plantasRevisadas ? parseInt(plantasRevisadas, 10) : undefined,
        plantasEnfermas: plantasEnfermas ? parseInt(plantasEnfermas, 10) : undefined,
        informeFinal: informeFinal.trim() || undefined,
      };

      const finalizada = await visitaService.finalizarVisita(visitaId, req);
      await visitaService.limpiarBorrador(visitaId);
      setModalFinalizarVisible(false);

      Alert.alert(
        '¡Visita Finalizada con Éxito!',
        `La atención técnica en "${finalizada.fincaNombre}" ha sido completada.\nDuración total: ${finalizada.duracionRealMin ?? minutosTranscurridos} minutos.`,
        [
          {
            text: 'Ver Detalle del Informe',
            onPress: () => navigation.navigate('DetalleVisita', { visitaId }),
          },
        ]
      );
    } catch (err: any) {
      const msg = err?.response?.data?.mensaje || err?.mensaje || 'No se pudo finalizar la visita.';
      Alert.alert('Error', msg);
    } finally {
      setFinalizando(false);
    }
  };

  // Cálculo de porcentaje de incidencia
  const totalRev = parseInt(plantasRevisadas, 10);
  const totalEnf = parseInt(plantasEnfermas, 10);
  const porcentajeIncidencia =
    !isNaN(totalRev) && totalRev > 0 && !isNaN(totalEnf)
      ? Math.min(100, Math.round((totalEnf / totalRev) * 100))
      : null;

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colores.background }]}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colores.primary} />
          <Text style={[styles.centerText, { fontSize: getScaledFont(15), color: colores.onSurfaceVariant }]}>
            Preparando visita en campo...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !visita) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colores.background }]}>
        <View style={styles.centerContainer}>
          <AlertTriangleIcon color={colores.error} size={48} />
          <Text style={[styles.errorText, { fontSize: getScaledFont(15), color: colores.error }]}>
            {error || 'No se pudo cargar la visita activa'}
          </Text>
          <TouchableOpacity
            style={[styles.retryBtn, { backgroundColor: colores.primary }]}
            onPress={cargarVisita}
          >
            <Text style={{ color: '#ffffff', fontWeight: '700' }}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.container, { backgroundColor: colores.background }]}>
      {/* HEADER DE CAMPO */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          onPress={() => {
            Alert.alert(
              'Salir de la Atención',
              'El progreso actual está guardado localmente como borrador. ¿Deseas volver?',
              [
                { text: 'Quedarme', style: 'cancel' },
                { text: 'Salir', onPress: () => navigation.goBack() },
              ]
            );
          }}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Regresar al detalle"
        >
          <ArrowLeftIcon color={colores.primary} size={22} />
        </TouchableOpacity>

        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={[styles.headerTitle, { fontSize: getScaledFont(16), color: colores.primary }]}>
            Atención Técnica en Campo
          </Text>
          <View style={styles.timerChip}>
            <ClockIcon color="#15803d" size={13} />
            <Text style={[styles.timerText, { fontSize: getScaledFont(12) }]}>
              {minutosTranscurridos} min en campo
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={handleGuardarBorradorManual}
          style={styles.saveDraftBtn}
          accessibilityRole="button"
          accessibilityLabel="Guardar borrador"
        >
          <Text style={[styles.saveDraftText, { fontSize: getScaledFont(12), color: colores.primary }]}>
            Guardar
          </Text>
        </TouchableOpacity>
      </View>

      {borradorFeedback && (
        <View style={styles.autosaveBanner}>
          <Text style={[styles.autosaveText, { fontSize: getScaledFont(11) }]}>
            ✓ {borradorFeedback}
          </Text>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* TARJETA DE CONTEXTO DE FINCA */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: colores.surfaceContainerLowest,
              borderColor: colores.outlineVariant,
            },
          ]}
        >
          <View style={styles.contextHeader}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.contextFinca, { fontSize: getScaledFont(16), color: colores.onSurface }]}>
                {visita.fincaNombre}
              </Text>
              <Text style={[styles.contextMunicipio, { fontSize: getScaledFont(13), color: colores.onSurfaceVariant }]}>
                {visita.fincaMunicipio}
                {visita.fincaVereda ? ` • Vereda: ${visita.fincaVereda}` : ''}
              </Text>
            </View>
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>EN VIVO</Text>
            </View>
          </View>

          <View style={styles.producerRow}>
            <UserIcon color={colores.secondary} size={15} />
            <Text style={[styles.producerName, { fontSize: getScaledFont(13), color: colores.onSurface }]}>
              {visita.agricultorNombre}
            </Text>
            {visita.agricultorTelefono && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
                <TouchableOpacity
                  style={[styles.producerPhoneBadge, { backgroundColor: '#e7f9ee', borderColor: '#25D366', borderWidth: 1 }]}
                  onPress={() =>
                    abrirWhatsApp(
                      visita.agricultorTelefono!,
                      `Hola Don/Doña ${visita.agricultorNombre}, me encuentro en su finca ${visita.fincaNombre} realizando la visita técnica fitosanitaria.`
                    )
                  }
                  accessibilityLabel="Contactar al productor por WhatsApp"
                >
                  <WhatsAppIcon color="#25D366" size={13} />
                  <Text style={[styles.producerPhone, { fontSize: getScaledFont(12), color: '#128C7E', fontWeight: '700' }]}>
                    WhatsApp
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.producerPhoneBadge}
                  onPress={() => llamarTelefono(visita.agricultorTelefono!)}
                  accessibilityLabel="Llamar al productor"
                >
                  <PhoneIcon color="#15803d" size={12} />
                  <Text style={[styles.producerPhone, { fontSize: getScaledFont(12) }]}>
                    Llamar
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {visita.loteNombre && (
            <View style={styles.loteBadge}>
              <Text style={[styles.loteBadgeText, { fontSize: getScaledFont(12), color: colores.primary }]}>
                🌱 Lote: {visita.loteNombre}
                {visita.loteVariedadCacao ? ` (${visita.loteVariedadCacao})` : ''}
              </Text>
            </View>
          )}

          {visita.motivo ? (
            <Text style={[styles.contextMotivo, { fontSize: getScaledFont(12), color: colores.onSurfaceVariant }]}>
              Motivo: {visita.motivo}
            </Text>
          ) : null}
        </View>

        {/* SECCIÓN 1: FOTOGRAFÍAS Y EVIDENCIAS EN TIEMPO REAL */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: colores.surfaceContainerLowest,
              borderColor: colores.outlineVariant,
            },
          ]}
        >
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { fontSize: getScaledFont(15), color: colores.primary }]}>
              📷 Evidencias de Campo ({imagenes.length})
            </Text>
          </View>

          {/* Botones de Captura */}
          <View style={styles.photoActionsRow}>
            <TouchableOpacity
              style={[
                styles.photoActionBtn,
                {
                  backgroundColor: colores.primary,
                  minHeight: botonesGrandes ? 54 : 48,
                },
              ]}
              onPress={handleTomarFoto}
              accessibilityRole="button"
              accessibilityLabel="Tomar fotografía con cámara"
            >
              <CameraIcon color="#ffffff" size={18} />
              <Text style={[styles.photoActionText, { fontSize: getScaledFont(13) }]}>
                Cámara
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.photoActionBtnSecondary,
                {
                  backgroundColor: colores.surfaceContainerLowest,
                  borderColor: colores.primary,
                  minHeight: botonesGrandes ? 54 : 48,
                },
              ]}
              onPress={handleSeleccionarGaleria}
              accessibilityRole="button"
              accessibilityLabel="Seleccionar foto de galería"
            >
              <ImageIcon color={colores.primary} size={18} />
              <Text style={[styles.photoActionTextSecondary, { fontSize: getScaledFont(13), color: colores.primary }]}>
                Galería
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.photoActionBtnIa,
                {
                  backgroundColor: '#f3e8ff',
                  borderColor: '#c084fc',
                  minHeight: botonesGrandes ? 54 : 48,
                },
              ]}
              onPress={() => {
                navigation.navigate('Camara', {
                  screen: 'CamaraMain',
                  params: { visitaId, loteId: visita.loteId },
                });
              }}
              accessibilityRole="button"
              accessibilityLabel="Abrir escáner IA de mazorca"
            >
              <SparklesIcon color="#7e22ce" size={16} />
              <Text style={[styles.photoActionTextIa, { fontSize: getScaledFont(12), color: '#7e22ce' }]}>
                Escáner IA
              </Text>
            </TouchableOpacity>
          </View>

          {/* Galería Horizontal de Fotos Tomadas */}
          {imagenes.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photosScroll}>
              {imagenes.map((img) => {
                const fotoUri = resolveMediaUrl(img.imagenUrl || img.url);
                const estaAnalizando = analizandoImgId === img.id;
                const esNoDisponible = img.analisisStatus === 'no_disponible';

                return (
                  <View key={img.id} style={styles.photoCard}>
                    {fotoUri ? (
                      <Image source={{ uri: fotoUri }} style={styles.photoImg} resizeMode="cover" />
                    ) : (
                      <View style={[styles.photoImg, { backgroundColor: colores.surfaceContainer, alignItems: 'center', justifyContent: 'center' }]}>
                        <CameraIcon color={colores.outline} size={24} />
                      </View>
                    )}
                    <View style={styles.photoDetails}>
                      {img.loteNombre ? (
                        <Text style={[styles.photoLote, { fontSize: getScaledFont(11) }]} numberOfLines={1}>
                          Lote: {img.loteNombre}
                        </Text>
                      ) : null}
                      {img.notas ? (
                        <Text style={[styles.photoNota, { fontSize: getScaledFont(11) }]} numberOfLines={2}>
                          {img.notas}
                        </Text>
                      ) : null}

                      {/* Estado IA */}
                      {img.enfermedadDetectada ? (
                        <View style={styles.diagBadge}>
                          <Text style={[styles.diagText, { fontSize: getScaledFont(10) }]}>
                            {img.enfermedadDetectada} ({img.confianza || '✓'})
                          </Text>
                        </View>
                      ) : esNoDisponible ? (
                        <View style={styles.noDispBadge}>
                          <Text style={[styles.noDispText, { fontSize: getScaledFont(10) }]}>
                            IA no disponible
                          </Text>
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={styles.analizarBtn}
                          onPress={() => handleAnalizarImagen(img.id)}
                          disabled={estaAnalizando}
                          accessibilityRole="button"
                          accessibilityLabel="Analizar foto con IA"
                        >
                          {estaAnalizando ? (
                            <ActivityIndicator size="small" color="#7e22ce" />
                          ) : (
                            <>
                              <SparklesIcon color="#7e22ce" size={12} />
                              <Text style={[styles.analizarBtnText, { fontSize: getScaledFont(10) }]}>
                                Analizar
                              </Text>
                            </>
                          )}
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          ) : (
            <View style={styles.emptyPhotosBox}>
              <ImageIcon color={colores.outline} size={28} />
              <Text style={[styles.emptyPhotosText, { fontSize: getScaledFont(12), color: colores.onSurfaceVariant }]}>
                Aún no has registrado fotos en esta visita. Toma fotos de mazorcas, hojas o suelo para documentar el hallazgo.
              </Text>
            </View>
          )}
        </View>

        {/* SECCIÓN 2: CENSO FITOSANITARIO / CONTEO DE PLANTAS */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: colores.surfaceContainerLowest,
              borderColor: colores.outlineVariant,
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { fontSize: getScaledFont(15), color: colores.primary }]}>
            🌱 Censo Fitosanitario de Plantas
          </Text>

          <View style={styles.censoRow}>
            <View style={styles.censoInputContainer}>
              <Text style={[styles.inputLabel, { fontSize: getScaledFont(12), color: colores.onSurfaceVariant }]}>
                Plantas revisadas
              </Text>
              <TextInput
                style={[
                  styles.numInput,
                  {
                    backgroundColor: colores.surfaceContainer,
                    borderColor: colores.outlineVariant,
                    fontSize: getScaledFont(16),
                    color: colores.onSurface,
                  },
                ]}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={colores.outline}
                value={plantasRevisadas}
                onChangeText={setPlantasRevisadas}
                accessibilityLabel="Número de plantas revisadas"
              />
            </View>

            <View style={styles.censoInputContainer}>
              <Text style={[styles.inputLabel, { fontSize: getScaledFont(12), color: '#b91c1c' }]}>
                Plantas enfermas
              </Text>
              <TextInput
                style={[
                  styles.numInput,
                  {
                    backgroundColor: colores.surfaceContainer,
                    borderColor: '#fca5a5',
                    fontSize: getScaledFont(16),
                    color: '#b91c1c',
                  },
                ]}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="#fca5a5"
                value={plantasEnfermas}
                onChangeText={setPlantasEnfermas}
                accessibilityLabel="Número de plantas con síntomas o enfermas"
              />
            </View>
          </View>

          {porcentajeIncidencia !== null && (
            <View style={styles.incidenciaBar}>
              <View style={styles.incidenciaBarLeft}>
                <Text style={[styles.incidenciaLabel, { fontSize: getScaledFont(12) }]}>
                  Incidencia en el lote:
                </Text>
                <Text
                  style={[
                    styles.incidenciaValue,
                    {
                      fontSize: getScaledFont(14),
                      color: porcentajeIncidencia > 20 ? '#b91c1c' : '#b45309',
                    },
                  ]}
                >
                  {porcentajeIncidencia}% de plantas afectadas
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* SECCIÓN 3: OBSERVACIONES Y HALLAZGOS DE CAMPO */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: colores.surfaceContainerLowest,
              borderColor: colores.outlineVariant,
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { fontSize: getScaledFont(15), color: colores.primary }]}>
            🔍 Observaciones de Campo
          </Text>
          <Text style={[styles.inputHint, { fontSize: getScaledFont(12), color: colores.onSurfaceVariant }]}>
            Registra el estado del cultivo, malezas, podas, presencia de moniliasis, fitófagos o humedad:
          </Text>
          <TextInput
            style={[
              styles.textArea,
              {
                backgroundColor: colores.surfaceContainer,
                borderColor: colores.outlineVariant,
                fontSize: getScaledFont(14),
                color: colores.onSurface,
              },
            ]}
            multiline
            numberOfLines={4}
            placeholder="Ej: Se observa floración abundante. Presencia focalizada de manchas aceitosas compatibles con monilia inicial en lote 1..."
            placeholderTextColor={colores.outline}
            value={observaciones}
            onChangeText={setObservaciones}
            accessibilityLabel="Observaciones técnicas de campo"
          />
        </View>

        {/* SECCIÓN 4: RECOMENDACIONES TÉCNICAS */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: colores.surfaceContainerLowest,
              borderColor: colores.outlineVariant,
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { fontSize: getScaledFont(15), color: colores.primary }]}>
            📋 Recomendaciones para el Productor
          </Text>
          <Text style={[styles.inputHint, { fontSize: getScaledFont(12), color: colores.onSurfaceVariant }]}>
            Indicaciones prácticas que el agricultor debe realizar (manejo agronómico, sanitarias, fertilización):
          </Text>
          <TextInput
            style={[
              styles.textArea,
              {
                backgroundColor: colores.surfaceContainer,
                borderColor: colores.outlineVariant,
                fontSize: getScaledFont(14),
                color: colores.onSurface,
              },
            ]}
            multiline
            numberOfLines={4}
            placeholder="Ej: 1. Remover y enterrar frutos enfermos semanalmente. 2. Realizar poda de mantenimiento para aireación del dosel..."
            placeholderTextColor={colores.outline}
            value={recomendaciones}
            onChangeText={setRecomendaciones}
            accessibilityLabel="Recomendaciones para el agricultor"
          />
        </View>

        {/* SECCIÓN 5: INFORME / CONCLUSIÓN FINAL */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: colores.surfaceContainerLowest,
              borderColor: colores.outlineVariant,
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { fontSize: getScaledFont(15), color: colores.primary }]}>
            📝 Síntesis o Informe General
          </Text>
          <TextInput
            style={[
              styles.textAreaShort,
              {
                backgroundColor: colores.surfaceContainer,
                borderColor: colores.outlineVariant,
                fontSize: getScaledFont(14),
                color: colores.onSurface,
              },
            ]}
            multiline
            numberOfLines={3}
            placeholder="Resumen ejecutivo del estado del predio y próxima visita sugerida..."
            placeholderTextColor={colores.outline}
            value={informeFinal}
            onChangeText={setInformeFinal}
            accessibilityLabel="Informe de síntesis"
          />
        </View>

        {/* BOTÓN PRINCIPAL: FINALIZAR VISITA TÉCNICA */}
        <View style={styles.finishContainer}>
          <TouchableOpacity
            style={[
              styles.finishBtn,
              {
                backgroundColor: '#15803d',
                minHeight: botonesGrandes ? 56 : 50,
              },
            ]}
            onPress={() => setModalFinalizarVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="Finalizar visita técnica"
          >
            <CheckIcon color="#ffffff" size={20} />
            <Text style={[styles.finishBtnText, { fontSize: getScaledFont(16) }]}>
              Finalizar Visita Técnica
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* MODAL DETALLE DE FOTO ANTES DE SUBIR */}
      <Modal visible={modalFotoVisible} animationType="slide" transparent>
        <SafeAreaView style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colores.surfaceContainerLowest }]}>
            <Text style={[styles.modalTitle, { fontSize: getScaledFont(17), color: colores.primary }]}>
              Adjuntar Evidencia Fotográfica
            </Text>

            {tempFotoUri && (
              <Image source={{ uri: tempFotoUri }} style={styles.modalPreviewImg} resizeMode="cover" />
            )}

            <Text style={[styles.modalLabel, { fontSize: getScaledFont(13), color: colores.onSurfaceVariant }]}>
              Notas u observaciones de la foto:
            </Text>
            <TextInput
              style={[
                styles.modalInput,
                {
                  backgroundColor: colores.surfaceContainer,
                  borderColor: colores.outlineVariant,
                  fontSize: getScaledFont(14),
                  color: colores.onSurface,
                },
              ]}
              placeholder="Ej: Mazorca de tercio medio con mancha necrosada"
              placeholderTextColor={colores.outline}
              value={fotoNotas}
              onChangeText={setFotoNotas}
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { borderColor: colores.outline }]}
                onPress={() => {
                  setModalFotoVisible(false);
                  setTempFotoUri(null);
                }}
                disabled={subiendoFoto}
              >
                <Text style={[styles.modalCancelBtnText, { color: colores.onSurfaceVariant }]}>
                  Cancelar
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalSubmitBtn, { backgroundColor: colores.primary }]}
                onPress={handleConfirmarSubidaFoto}
                disabled={subiendoFoto}
              >
                {subiendoFoto ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.modalSubmitBtnText}>Subir Foto</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      {/* MODAL CONFIRMAR FINALIZAR VISITA */}
      <Modal visible={modalFinalizarVisible} animationType="fade" transparent>
        <SafeAreaView style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colores.surfaceContainerLowest }]}>
            <Text style={[styles.modalTitle, { fontSize: getScaledFont(18), color: '#15803d' }]}>
              Finalizar Atención en Campo
            </Text>
            <Text style={[styles.modalSubtitle, { fontSize: getScaledFont(13), color: colores.onSurfaceVariant }]}>
              Confirma los datos recolectados antes de consolidar el informe técnico:
            </Text>

            <View style={styles.summaryBox}>
              <Text style={[styles.summaryItem, { fontSize: getScaledFont(13) }]}>
                ⏱️ Tiempo en campo: <Text style={{ fontWeight: '700' }}>{minutosTranscurridos} minutos</Text>
              </Text>
              <Text style={[styles.summaryItem, { fontSize: getScaledFont(13) }]}>
                📷 Evidencias adjuntas: <Text style={{ fontWeight: '700' }}>{imagenes.length} fotografías</Text>
              </Text>
              <Text style={[styles.summaryItem, { fontSize: getScaledFont(13) }]}>
                🌱 Plantas evaluadas:{' '}
                <Text style={{ fontWeight: '700' }}>
                  {plantasRevisadas || '0'} (Enfermas: {plantasEnfermas || '0'})
                </Text>
              </Text>
              <Text style={[styles.summaryItem, { fontSize: getScaledFont(13) }]}>
                📋 Recomendaciones:{' '}
                <Text style={{ fontWeight: '700' }}>
                  {recomendaciones ? 'Completadas' : 'No registradas'}
                </Text>
              </Text>
            </View>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { borderColor: colores.outline }]}
                onPress={() => setModalFinalizarVisible(false)}
                disabled={finalizando}
              >
                <Text style={[styles.modalCancelBtnText, { color: colores.onSurfaceVariant }]}>
                  Revisar más
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalSubmitBtn, { backgroundColor: '#15803d' }]}
                onPress={handleConfirmarFinalizar}
                disabled={finalizando}
              >
                {finalizando ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.modalSubmitBtnText}>Confirmar y Cerrar</Text>
                )}
              </TouchableOpacity>
            </View>
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  centerText: {
    marginTop: 12,
  },
  errorText: {
    marginTop: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
  retryBtn: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontWeight: '700',
  },
  timerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginTop: 2,
    gap: 4,
  },
  timerText: {
    color: '#15803d',
    fontWeight: '600',
  },
  saveDraftBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#f3f4f6',
  },
  saveDraftText: {
    fontWeight: '600',
  },
  autosaveBanner: {
    backgroundColor: '#f0fdf4',
    paddingVertical: 3,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#bbf7d0',
  },
  autosaveText: {
    color: '#16a34a',
    fontWeight: '500',
  },
  scroll: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  contextHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  contextFinca: {
    fontWeight: '700',
  },
  contextMunicipio: {
    marginTop: 2,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ef4444',
  },
  liveText: {
    color: '#b91c1c',
    fontSize: 10,
    fontWeight: '700',
  },
  producerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
  },
  producerName: {
    fontWeight: '500',
  },
  producerPhoneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 6,
    gap: 4,
  },
  producerPhone: {
    color: '#15803d',
    fontWeight: '600',
  },
  loteBadge: {
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  loteBadgeText: {
    fontWeight: '600',
  },
  contextMotivo: {
    marginTop: 8,
    fontStyle: 'italic',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontWeight: '700',
    marginBottom: 8,
  },
  photoActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  photoActionBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 8,
    gap: 6,
  },
  photoActionText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  photoActionBtnSecondary: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    gap: 6,
  },
  photoActionTextSecondary: {
    fontWeight: '700',
  },
  photoActionBtnIa: {
    flex: 1.1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 6,
    gap: 4,
  },
  photoActionTextIa: {
    fontWeight: '700',
  },
  photosScroll: {
    marginTop: 4,
  },
  photoCard: {
    width: 140,
    marginRight: 10,
    borderRadius: 10,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  photoImg: {
    width: '100%',
    height: 100,
  },
  photoDetails: {
    padding: 6,
  },
  photoLote: {
    fontWeight: '600',
    color: '#374151',
  },
  photoNota: {
    color: '#6b7280',
    marginTop: 2,
  },
  diagBadge: {
    backgroundColor: '#fef2f2',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  diagText: {
    color: '#b91c1c',
    fontWeight: '600',
  },
  noDispBadge: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  noDispText: {
    color: '#6b7280',
    fontStyle: 'italic',
  },
  analizarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3e8ff',
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 4,
    gap: 4,
  },
  analizarBtnText: {
    color: '#7e22ce',
    fontWeight: '700',
  },
  emptyPhotosBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  emptyPhotosText: {
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 18,
  },
  censoRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  censoInputContainer: {
    flex: 1,
  },
  inputLabel: {
    fontWeight: '600',
    marginBottom: 4,
  },
  numInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontWeight: '700',
    textAlign: 'center',
  },
  incidenciaBar: {
    marginTop: 10,
    padding: 8,
    backgroundColor: '#fef3c7',
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  incidenciaBarLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  incidenciaLabel: {
    color: '#92400e',
    fontWeight: '600',
  },
  incidenciaValue: {
    fontWeight: '700',
  },
  inputHint: {
    marginBottom: 6,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    minHeight: 85,
    textAlignVertical: 'top',
  },
  textAreaShort: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    minHeight: 65,
    textAlignVertical: 'top',
  },
  finishContainer: {
    marginTop: 8,
    marginBottom: 20,
  },
  finishBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  finishBtnText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontWeight: '700',
    marginBottom: 8,
  },
  modalSubtitle: {
    marginBottom: 14,
    lineHeight: 18,
  },
  modalPreviewImg: {
    width: '100%',
    height: 180,
    borderRadius: 10,
    marginBottom: 12,
  },
  modalLabel: {
    fontWeight: '600',
    marginBottom: 4,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 14,
  },
  summaryBox: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    gap: 6,
  },
  summaryItem: {
    color: '#374151',
  },
  modalBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  modalCancelBtn: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  modalCancelBtnText: {
    fontWeight: '600',
  },
  modalSubmitBtn: {
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minWidth: 100,
    alignItems: 'center',
  },
  modalSubmitBtnText: {
    color: '#ffffff',
    fontWeight: '700',
  },
});
