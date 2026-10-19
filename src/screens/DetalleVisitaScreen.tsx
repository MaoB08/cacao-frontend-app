import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { visitaService } from '../services/visitaService';
import { VisitaDetalle, EstadoVisita, ReprogramarVisitaRequest, FinalizarVisitaRequest } from '../types/visita';
import { Theme } from '../constants/theme';
import {
  ArrowLeftIcon,
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  UserIcon,
  PhoneIcon,
  CheckIcon,
  AlertTriangleIcon,
  ActivityIcon,
  CloseIcon,
  ImageIcon,
  WhatsAppIcon,
} from '../components/Icons';
import { useAccesibilidad } from '../contexts/AccesibilidadContext';
import { abrirWhatsApp, llamarTelefono } from '../utils/whatsapp';
import { resolveMediaUrl } from '../utils/mediaUtils';

const getEstadoBadgeStyle = (estado: EstadoVisita) => {
  switch (estado) {
    case 'PROGRAMADA':
      return { bg: '#e0f2fe', text: '#0369a1', label: 'Programada' };
    case 'EN_CURSO':
      return { bg: '#fef3c7', text: '#b45309', label: 'En curso' };
    case 'COMPLETADA':
      return { bg: '#dcfce7', text: '#15803d', label: 'Completada' };
    case 'CANCELADA':
      return { bg: '#fee2e2', text: '#b91c1c', label: 'Cancelada' };
    case 'REPROGRAMADA':
      return { bg: '#f3e8ff', text: '#7e22ce', label: 'Reprogramada' };
    default:
      return { bg: '#f3f4f6', text: '#4b5563', label: estado };
  }
};

const formatFechaCompleta = (fechaIso?: string) => {
  if (!fechaIso) return 'No especificada';
  try {
    const d = new Date(fechaIso);
    return d.toLocaleDateString('es-CO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return fechaIso;
  }
};

export const DetalleVisitaScreen = ({ route, navigation }: any) => {
  const { colores, escalaTexto, botonesGrandes } = useAccesibilidad();
  const getScaledFont = (size: number) => size * escalaTexto;

  const visitaId = route?.params?.visitaId;

  const [visita, setVisita] = useState<VisitaDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accionEnProgreso, setAccionEnProgreso] = useState(false);

  // Modal Cancelar
  const [modalCancelarVisible, setModalCancelarVisible] = useState(false);
  const [motivoCancelacion, setMotivoCancelacion] = useState('');

  // Modal Reprogramar
  const [modalReprogramarVisible, setModalReprogramarVisible] = useState(false);
  const [nuevaFecha, setNuevaFecha] = useState('');
  const [nuevaHora, setNuevaHora] = useState('');

  // Modal Finalizar
  const [modalFinalizarVisible, setModalFinalizarVisible] = useState(false);
  const [observaciones, setObservaciones] = useState('');
  const [recomendaciones, setRecomendaciones] = useState('');
  const [plantasRevisadas, setPlantasRevisadas] = useState('');
  const [plantasEnfermas, setPlantasEnfermas] = useState('');
  const [informeFinal, setInformeFinal] = useState('');

  const cargarDetalle = useCallback(async () => {
    if (!visitaId) {
      setError('Identificador de visita no proporcionado');
      setLoading(false);
      return;
    }
    try {
      setError(null);
      const res = await visitaService.obtenerDetalle(visitaId);
      setVisita(res);
    } catch (e: any) {
      setError(e?.mensaje || e?.message || 'Error al cargar el detalle de la visita');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [visitaId]);

  useFocusEffect(
    useCallback(() => {
      cargarDetalle();
    }, [cargarDetalle])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    cargarDetalle();
  }, [cargarDetalle]);

  // Acción: Iniciar Visita
  const handleIniciarVisita = () => {
    Alert.alert(
      'Iniciar Visita Técnica',
      '¿Deseas iniciar la atención en campo ahora? El estado cambiará a "EN CURSO".',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Iniciar en Campo',
          onPress: async () => {
            try {
              setAccionEnProgreso(true);
              const actualizada = await visitaService.iniciarVisita(visitaId);
              setVisita(actualizada);
              navigation.navigate('VisitaEnCurso', { visitaId });
            } catch (err: any) {
              const msg = err?.response?.data?.mensaje || err?.mensaje || 'No se pudo iniciar la visita.';
              Alert.alert('Error', msg);
            } finally {
              setAccionEnProgreso(false);
            }
          },
        },
      ]
    );
  };

  // Acción: Confirmar Cancelación
  const handleConfirmarCancelar = async () => {
    if (!motivoCancelacion.trim() || motivoCancelacion.trim().length < 5) {
      Alert.alert('Validación', 'El motivo de cancelación debe tener al menos 5 caracteres.');
      return;
    }
    try {
      setAccionEnProgreso(true);
      const actualizada = await visitaService.cancelarVisita(visitaId, motivoCancelacion.trim());
      setVisita(actualizada);
      setModalCancelarVisible(false);
      setMotivoCancelacion('');
      Alert.alert('Visita Cancelada', 'La visita ha sido cancelada correctamente.');
    } catch (err: any) {
      const msg = err?.response?.data?.mensaje || err?.mensaje || 'No se pudo cancelar la visita.';
      Alert.alert('Error', msg);
    } finally {
      setAccionEnProgreso(false);
    }
  };

  // Acción: Confirmar Reprogramación
  const handleConfirmarReprogramar = async () => {
    const regexFecha = /^\d{4}-\d{2}-\d{2}$/;
    const regexHora = /^\d{2}:\d{2}$/;
    if (!regexFecha.test(nuevaFecha) || !regexHora.test(nuevaHora)) {
      Alert.alert('Formato inválido', 'Fecha en formato AAAA-MM-DD y hora en HH:mm.');
      return;
    }
    const fechaObj = new Date(`${nuevaFecha}T${nuevaHora}:00`);
    if (fechaObj <= new Date()) {
      Alert.alert('Fecha inválida', 'La nueva fecha y hora debe ser futura.');
      return;
    }

    try {
      setAccionEnProgreso(true);
      const req: ReprogramarVisitaRequest = {
        fechaProgramada: `${nuevaFecha}T${nuevaHora}:00`,
      };
      const actualizada = await visitaService.reprogramarVisita(visitaId, req);
      setVisita(actualizada);
      setModalReprogramarVisible(false);
      Alert.alert('Visita Reprogramada', 'La nueva fecha se ha actualizado.');
    } catch (err: any) {
      const msg = err?.response?.data?.mensaje || err?.mensaje || 'No se pudo reprogramar la visita.';
      Alert.alert('Error', msg);
    } finally {
      setAccionEnProgreso(false);
    }
  };

  // Acción: Confirmar Finalización
  const handleConfirmarFinalizar = async () => {
    try {
      setAccionEnProgreso(true);
      const req: FinalizarVisitaRequest = {
        observaciones: observaciones.trim() || undefined,
        recomendaciones: recomendaciones.trim() || undefined,
        plantasRevisadas: plantasRevisadas ? parseInt(plantasRevisadas, 10) : undefined,
        plantasEnfermas: plantasEnfermas ? parseInt(plantasEnfermas, 10) : undefined,
        informeFinal: informeFinal.trim() || undefined,
      };
      const actualizada = await visitaService.finalizarVisita(visitaId, req);
      setVisita(actualizada);
      setModalFinalizarVisible(false);
      Alert.alert('¡Visita Completada!', 'El informe técnico de la visita ha quedado registrado.');
    } catch (err: any) {
      const msg = err?.response?.data?.mensaje || err?.mensaje || 'No se pudo finalizar la visita.';
      Alert.alert('Error', msg);
    } finally {
      setAccionEnProgreso(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colores.background }]}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colores.primary} />
          <Text style={[styles.centerText, { fontSize: getScaledFont(15), color: colores.onSurfaceVariant }]}>
            Cargando detalles de la visita...
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
            {error || 'No se encontró la visita'}
          </Text>
          <TouchableOpacity
            style={[styles.retryBtn, { backgroundColor: colores.primary }]}
            onPress={cargarDetalle}
          >
            <Text style={{ color: '#ffffff', fontWeight: '700' }}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const badge = getEstadoBadgeStyle(visita.estado);
  const esProgramada = visita.estado === 'PROGRAMADA' || visita.estado === 'REPROGRAMADA';
  const esEnCurso = visita.estado === 'EN_CURSO';
  const esCompletada = visita.estado === 'COMPLETADA';
  const esCancelada = visita.estado === 'CANCELADA';

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
          accessibilityLabel="Volver al listado"
        >
          <ArrowLeftIcon color={colores.primary} size={22} />
        </TouchableOpacity>
        <Text
          style={[
            styles.headerTitle,
            { fontSize: getScaledFont(18), color: colores.primary },
          ]}
        >
          Detalle de Visita
        </Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colores.primary}
          />
        }
      >
        {/* Banner de Estado Prominente */}
        <View
          style={[
            styles.statusBanner,
            { backgroundColor: badge.bg, borderColor: badge.text },
          ]}
        >
          <View style={styles.statusBannerLeft}>
            <Text style={[styles.statusBannerTitle, { fontSize: getScaledFont(17), color: badge.text }]}>
              {badge.label}
            </Text>
            <Text style={[styles.statusBannerSubtitle, { fontSize: getScaledFont(13), color: badge.text }]}>
              {esProgramada && 'Pendiente de inicio en campo'}
              {esEnCurso && 'Atención activa en el predio'}
              {esCompletada && 'Visita finalizada con informe'}
              {esCancelada && 'Esta visita fue cancelada'}
            </Text>
          </View>
        </View>

        {/* Sección 1: Agenda */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: colores.surfaceContainerLowest,
              borderColor: colores.outlineVariant,
            },
          ]}
        >
          <Text
            style={[
              styles.cardSectionTitle,
              { fontSize: getScaledFont(15), color: colores.primary },
            ]}
          >
            🗓️ Agenda y Horario
          </Text>

          <View style={styles.infoRow}>
            <CalendarIcon color={colores.secondary} size={16} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.infoLabel, { fontSize: getScaledFont(12), color: colores.onSurfaceVariant }]}>
                Fecha programada
              </Text>
              <Text style={[styles.infoValue, { fontSize: getScaledFont(14), color: colores.onSurface }]}>
                {formatFechaCompleta(visita.fechaProgramada)}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <ClockIcon color={colores.secondary} size={16} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.infoLabel, { fontSize: getScaledFont(12), color: colores.onSurfaceVariant }]}>
                Duración estimada
              </Text>
              <Text style={[styles.infoValue, { fontSize: getScaledFont(14), color: colores.onSurface }]}>
                {visita.duracionEstimadaMin ? `${visita.duracionEstimadaMin} minutos` : 'No especificada'}
              </Text>
            </View>
          </View>

          {visita.fechaInicioReal && (
            <View style={styles.infoRow}>
              <ClockIcon color="#16a34a" size={16} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.infoLabel, { fontSize: getScaledFont(12), color: colores.onSurfaceVariant }]}>
                  Inicio real
                </Text>
                <Text style={[styles.infoValue, { fontSize: getScaledFont(14), color: colores.onSurface }]}>
                  {formatFechaCompleta(visita.fechaInicioReal)}
                </Text>
              </View>
            </View>
          )}

          {visita.fechaFinReal && (
            <View style={styles.infoRow}>
              <CheckIcon color="#16a34a" size={16} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.infoLabel, { fontSize: getScaledFont(12), color: colores.onSurfaceVariant }]}>
                  Finalización real
                </Text>
                <Text style={[styles.infoValue, { fontSize: getScaledFont(14), color: colores.onSurface }]}>
                  {formatFechaCompleta(visita.fechaFinReal)} ({visita.duracionRealMin} min)
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Sección 2: Finca y Productor */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: colores.surfaceContainerLowest,
              borderColor: colores.outlineVariant,
            },
          ]}
        >
          <Text
            style={[
              styles.cardSectionTitle,
              { fontSize: getScaledFont(15), color: colores.primary },
            ]}
          >
            🏡 Finca y Productor
          </Text>

          <View style={styles.infoRow}>
            <MapPinIcon color={colores.secondary} size={16} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.infoLabel, { fontSize: getScaledFont(12), color: colores.onSurfaceVariant }]}>
                Finca
              </Text>
              <Text style={[styles.infoValueBold, { fontSize: getScaledFont(15), color: colores.onSurface }]}>
                {visita.fincaNombre}
              </Text>
              <Text style={[styles.infoSubtext, { fontSize: getScaledFont(13), color: colores.onSurfaceVariant }]}>
                {visita.fincaMunicipio}
                {visita.fincaDepartamento ? `, ${visita.fincaDepartamento}` : ''}
                {visita.fincaVereda ? ` (Vereda: ${visita.fincaVereda})` : ''}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <UserIcon color={colores.secondary} size={16} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.infoLabel, { fontSize: getScaledFont(12), color: colores.onSurfaceVariant }]}>
                Productor
              </Text>
              <Text style={[styles.infoValue, { fontSize: getScaledFont(14), color: colores.onSurface }]}>
                {visita.agricultorNombre}
              </Text>
              {visita.agricultorTelefono && (
                <View style={styles.contactoProducerContainer}>
                  <View style={styles.telefonoRow}>
                    <PhoneIcon color={colores.primary} size={14} />
                    <Text style={[styles.telefonoText, { fontSize: getScaledFont(13), color: colores.primary }]}>
                      {visita.agricultorTelefono}
                    </Text>
                  </View>

                  <View style={styles.contactoButtonsRow}>
                    <TouchableOpacity
                      style={[styles.btnWhatsApp, { minHeight: botonesGrandes ? 48 : 36 }]}
                      onPress={() => {
                        const fechaStr = new Date(visita.fechaProgramada).toLocaleDateString('es-CO', {
                          day: 'numeric',
                          month: 'long',
                        });
                        abrirWhatsApp(
                          visita.agricultorTelefono!,
                          `Hola Don/Doña ${visita.agricultorNombre}, le escribe el profesional agrónomo de CacaoScan sobre la visita técnica programada para el ${fechaStr} en su finca ${visita.fincaNombre}.`
                        );
                      }}
                      accessibilityLabel="Contactar al productor por WhatsApp"
                    >
                      <WhatsAppIcon color="#ffffff" size={17} />
                      <Text style={[styles.btnWhatsAppText, { fontSize: getScaledFont(13) }]}>
                        WhatsApp
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.btnLlamar,
                        {
                          minHeight: botonesGrandes ? 48 : 36,
                          borderColor: colores.outlineVariant,
                          backgroundColor: colores.surfaceContainer,
                        },
                      ]}
                      onPress={() => llamarTelefono(visita.agricultorTelefono!)}
                      accessibilityLabel="Llamar al productor"
                    >
                      <PhoneIcon color={colores.primary} size={15} />
                      <Text style={[styles.btnLlamarText, { color: colores.primary, fontSize: getScaledFont(13) }]}>
                        Llamar
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </View>

          {visita.loteNombre && (
            <View style={styles.infoRow}>
              <View style={{ width: 16 }} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.infoLabel, { fontSize: getScaledFont(12), color: colores.onSurfaceVariant }]}>
                  Lote específico
                </Text>
                <Text style={[styles.infoValue, { fontSize: getScaledFont(14), color: colores.onSurface }]}>
                  {visita.loteNombre} {visita.loteVariedadCacao ? `• Variedad: ${visita.loteVariedadCacao}` : ''}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Sección 3: Motivo y Notas */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: colores.surfaceContainerLowest,
              borderColor: colores.outlineVariant,
            },
          ]}
        >
          <Text
            style={[
              styles.cardSectionTitle,
              { fontSize: getScaledFont(15), color: colores.primary },
            ]}
          >
            📋 Motivo de la Visita
          </Text>
          <Text style={[styles.motivoLargo, { fontSize: getScaledFont(14), color: colores.onSurface }]}>
            {visita.motivo || 'Sin motivo registrado'}
          </Text>

          {visita.notasPrevias ? (
            <>
              <Text
                style={[
                  styles.notasPreviasLabel,
                  { fontSize: getScaledFont(13), color: colores.onSurfaceVariant },
                ]}
              >
                Notas previas / Instrucciones:
              </Text>
              <Text style={[styles.motivoLargo, { fontSize: getScaledFont(13), color: colores.onSurface }]}>
                {visita.notasPrevias}
              </Text>
            </>
          ) : null}
        </View>

        {/* Sección 4: Informe de Visita (si completada o en curso) */}
        {(esCompletada || (esEnCurso && visita.observaciones)) && (
          <View
            style={[
              styles.card,
              {
                backgroundColor: colores.surfaceContainerLowest,
                borderColor: '#bbf7d0',
              },
            ]}
          >
            <Text
              style={[
                styles.cardSectionTitle,
                { fontSize: getScaledFont(15), color: '#15803d' },
              ]}
            >
              ✅ Informe Técnico Realizado
            </Text>

            {visita.plantasRevisadas != null && (
              <View style={styles.metricasRow}>
                <View style={styles.metricaBox}>
                  <Text style={[styles.metricaNum, { fontSize: getScaledFont(18), color: colores.primary }]}>
                    {visita.plantasRevisadas}
                  </Text>
                  <Text style={[styles.metricaLabel, { fontSize: getScaledFont(11) }]}>Revisadas</Text>
                </View>
                <View style={styles.metricaBox}>
                  <Text style={[styles.metricaNum, { fontSize: getScaledFont(18), color: '#b91c1c' }]}>
                    {visita.plantasEnfermas ?? 0}
                  </Text>
                  <Text style={[styles.metricaLabel, { fontSize: getScaledFont(11) }]}>Enfermas</Text>
                </View>
              </View>
            )}

            {visita.observaciones && (
              <View style={{ marginTop: 10 }}>
                <Text style={[styles.infoLabel, { fontSize: getScaledFont(12), color: colores.onSurfaceVariant }]}>
                  Observaciones de campo
                </Text>
                <Text style={[styles.infoValue, { fontSize: getScaledFont(14), color: colores.onSurface }]}>
                  {visita.observaciones}
                </Text>
              </View>
            )}

            {visita.recomendaciones && (
              <View style={{ marginTop: 10 }}>
                <Text style={[styles.infoLabel, { fontSize: getScaledFont(12), color: colores.onSurfaceVariant }]}>
                  Recomendaciones agronómicas
                </Text>
                <Text style={[styles.infoValue, { fontSize: getScaledFont(14), color: colores.onSurface }]}>
                  {visita.recomendaciones}
                </Text>
              </View>
            )}

            {visita.informeFinal && (
              <View style={{ marginTop: 10 }}>
                <Text style={[styles.infoLabel, { fontSize: getScaledFont(12), color: colores.onSurfaceVariant }]}>
                  Conclusión e informe general
                </Text>
                <Text style={[styles.infoValue, { fontSize: getScaledFont(14), color: colores.onSurface }]}>
                  {visita.informeFinal}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Sección: Motivo de Cancelación (si cancelada) */}
        {esCancelada && visita.motivoCancelacion && (
          <View
            style={[
              styles.card,
              {
                backgroundColor: '#fef2f2',
                borderColor: '#fca5a5',
              },
            ]}
          >
            <Text
              style={[
                styles.cardSectionTitle,
                { fontSize: getScaledFont(15), color: '#b91c1c' },
              ]}
            >
              ⚠️ Motivo de Cancelación
            </Text>
            <Text style={[styles.motivoLargo, { fontSize: getScaledFont(14), color: '#991b1b' }]}>
              {visita.motivoCancelacion}
            </Text>
          </View>
        )}

        {/* Sección: Galería de Evidencias */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: colores.surfaceContainerLowest,
              borderColor: colores.outlineVariant,
            },
          ]}
        >
          <Text
            style={[
              styles.cardSectionTitle,
              { fontSize: getScaledFont(15), color: colores.primary },
            ]}
          >
            📷 Evidencias y Fotos ({visita.totalImagenes})
          </Text>

          {visita.imagenes && visita.imagenes.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
              {visita.imagenes.map((img) => {
                const fotoUri = resolveMediaUrl(img.imagenUrl || img.url);
                return (
                  <View key={img.id} style={styles.imageThumb}>
                    {fotoUri ? (
                      <Image source={{ uri: fotoUri }} style={styles.imagePhoto} resizeMode="cover" />
                    ) : (
                      <View style={[styles.imagePhoto, { backgroundColor: colores.surfaceContainer, alignItems: 'center', justifyContent: 'center' }]}>
                        <ImageIcon color={colores.outline} size={24} />
                      </View>
                    )}
                    {img.enfermedadDetectada && (
                      <Text style={[styles.imageLabel, { fontSize: getScaledFont(10) }]} numberOfLines={1}>
                        {img.enfermedadDetectada}
                      </Text>
                    )}
                  </View>
                );
              })}
            </ScrollView>
          ) : (
            <View style={styles.noImagesBox}>
              <ImageIcon color={colores.outline} size={30} />
              <Text style={[styles.noImagesText, { fontSize: getScaledFont(13), color: colores.onSurfaceVariant }]}>
                No se han cargado fotografías para esta visita técnica.
              </Text>
            </View>
          )}
        </View>

        {/* BOTONES DE ACCIÓN SEGÚN ESTADO */}
        {accionEnProgreso ? (
          <ActivityIndicator size="large" color={colores.primary} style={{ marginVertical: 20 }} />
        ) : (
          <View style={styles.actionsContainer}>
            {esProgramada && (
              <>
                <TouchableOpacity
                  style={[
                    styles.primaryActionBtn,
                    {
                      backgroundColor: '#15803d',
                      minHeight: botonesGrandes ? 56 : 50,
                    },
                  ]}
                  onPress={handleIniciarVisita}
                  accessibilityRole="button"
                  accessibilityLabel="Iniciar visita técnica en campo"
                >
                  <ActivityIcon color="#ffffff" size={20} />
                  <Text style={[styles.primaryActionBtnText, { fontSize: getScaledFont(16) }]}>
                    Iniciar visita en campo
                  </Text>
                </TouchableOpacity>

                <View style={styles.secondaryActionsRow}>
                  <TouchableOpacity
                    style={[
                      styles.secondaryActionBtn,
                      {
                        backgroundColor: colores.surfaceContainerLowest,
                        borderColor: colores.primary,
                        minHeight: botonesGrandes ? 50 : 44,
                      },
                    ]}
                    onPress={() => {
                      const d = new Date(visita.fechaProgramada);
                      setNuevaFecha(
                        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
                          d.getDate()
                        ).padStart(2, '0')}`
                      );
                      setNuevaHora(
                        `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
                      );
                      setModalReprogramarVisible(true);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Reprogramar fecha de visita"
                  >
                    <CalendarIcon color={colores.primary} size={18} />
                    <Text style={[styles.secondaryActionBtnText, { fontSize: getScaledFont(14), color: colores.primary }]}>
                      Reprogramar
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.secondaryActionBtn,
                      {
                        backgroundColor: colores.surfaceContainerLowest,
                        borderColor: '#b91c1c',
                        minHeight: botonesGrandes ? 50 : 44,
                      },
                    ]}
                    onPress={() => setModalCancelarVisible(true)}
                    accessibilityRole="button"
                    accessibilityLabel="Cancelar visita técnica"
                  >
                    <CloseIcon color="#b91c1c" size={18} />
                    <Text style={[styles.secondaryActionBtnText, { fontSize: getScaledFont(14), color: '#b91c1c' }]}>
                      Cancelar
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {esEnCurso && (
              <>
                <TouchableOpacity
                  style={[
                    styles.primaryActionBtn,
                    {
                      backgroundColor: '#15803d',
                      minHeight: botonesGrandes ? 56 : 50,
                      marginBottom: 10,
                    },
                  ]}
                  onPress={() => navigation.navigate('VisitaEnCurso', { visitaId })}
                  accessibilityRole="button"
                  accessibilityLabel="Continuar atención técnica en campo"
                >
                  <ActivityIcon color="#ffffff" size={20} />
                  <Text style={[styles.primaryActionBtnText, { fontSize: getScaledFont(16) }]}>
                    Continuar atención en campo
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.secondaryActionBtn,
                    {
                      backgroundColor: colores.surfaceContainerLowest,
                      borderColor: colores.primary,
                      minHeight: botonesGrandes ? 50 : 44,
                    },
                  ]}
                  onPress={() => setModalFinalizarVisible(true)}
                  accessibilityRole="button"
                  accessibilityLabel="Finalizar visita técnica y registrar informe"
                >
                  <CheckIcon color={colores.primary} size={18} />
                  <Text style={[styles.secondaryActionBtnText, { fontSize: getScaledFont(14), color: colores.primary }]}>
                    Finalizar visita y consolidar informe
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
      </ScrollView>

      {/* MODAL CANCELAR VISITA */}
      <Modal visible={modalCancelarVisible} animationType="slide" transparent>
        <SafeAreaView style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colores.surfaceContainerLowest }]}>
            <Text style={[styles.modalTitle, { fontSize: getScaledFont(18), color: '#b91c1c' }]}>
              Cancelar Visita Técnica
            </Text>
            <Text style={[styles.modalSubtitle, { fontSize: getScaledFont(13), color: colores.onSurfaceVariant }]}>
              Indica el motivo de la cancelación para que quede registrado en el historial:
            </Text>
            <TextInput
              style={[
                styles.modalTextInput,
                {
                  backgroundColor: colores.surfaceContainer,
                  borderColor: colores.outlineVariant,
                  fontSize: getScaledFont(14),
                  color: colores.onSurface,
                },
              ]}
              value={motivoCancelacion}
              onChangeText={setMotivoCancelacion}
              placeholder="Ej: Clima adverso imposibilita acceso a la vereda..."
              placeholderTextColor={colores.outline}
              multiline
              numberOfLines={3}
            />
            <View style={styles.modalBtnsRow}>
              <TouchableOpacity
                style={[styles.modalBtnSec, { borderColor: colores.outline }]}
                onPress={() => setModalCancelarVisible(false)}
              >
                <Text style={{ color: colores.outline, fontWeight: '700' }}>Volver</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtnPrim, { backgroundColor: '#b91c1c' }]}
                onPress={handleConfirmarCancelar}
              >
                <Text style={{ color: '#ffffff', fontWeight: '700' }}>Confirmar Cancelación</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      {/* MODAL REPROGRAMAR VISITA */}
      <Modal visible={modalReprogramarVisible} animationType="slide" transparent>
        <SafeAreaView style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colores.surfaceContainerLowest }]}>
            <Text style={[styles.modalTitle, { fontSize: getScaledFont(18), color: colores.primary }]}>
              Reprogramar Visita Técnica
            </Text>
            <Text style={[styles.modalSubtitle, { fontSize: getScaledFont(13), color: colores.onSurfaceVariant }]}>
              Selecciona la nueva fecha y hora para la atención en campo:
            </Text>

            <View style={{ gap: 12, marginVertical: 14 }}>
              <View>
                <Text style={[styles.infoLabel, { fontSize: getScaledFont(12) }]}>Nueva fecha (AAAA-MM-DD)</Text>
                <TextInput
                  style={[
                    styles.singleInput,
                    {
                      backgroundColor: colores.surfaceContainer,
                      borderColor: colores.outlineVariant,
                      fontSize: getScaledFont(14),
                      color: colores.onSurface,
                    },
                  ]}
                  value={nuevaFecha}
                  onChangeText={setNuevaFecha}
                  placeholder="2026-10-20"
                />
              </View>
              <View>
                <Text style={[styles.infoLabel, { fontSize: getScaledFont(12) }]}>Nueva hora (HH:mm)</Text>
                <TextInput
                  style={[
                    styles.singleInput,
                    {
                      backgroundColor: colores.surfaceContainer,
                      borderColor: colores.outlineVariant,
                      fontSize: getScaledFont(14),
                      color: colores.onSurface,
                    },
                  ]}
                  value={nuevaHora}
                  onChangeText={setNuevaHora}
                  placeholder="14:00"
                />
              </View>
            </View>

            <View style={styles.modalBtnsRow}>
              <TouchableOpacity
                style={[styles.modalBtnSec, { borderColor: colores.outline }]}
                onPress={() => setModalReprogramarVisible(false)}
              >
                <Text style={{ color: colores.outline, fontWeight: '700' }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtnPrim, { backgroundColor: colores.primary }]}
                onPress={handleConfirmarReprogramar}
              >
                <Text style={{ color: '#ffffff', fontWeight: '700' }}>Guardar Cambio</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      {/* MODAL FINALIZAR VISITA */}
      <Modal visible={modalFinalizarVisible} animationType="slide" transparent>
        <SafeAreaView style={styles.modalOverlay}>
          <ScrollView
            contentContainerStyle={[
              styles.modalCard,
              { backgroundColor: colores.surfaceContainerLowest },
            ]}
          >
            <Text style={[styles.modalTitle, { fontSize: getScaledFont(18), color: colores.primary }]}>
              Finalizar Visita y Registrar Informe
            </Text>
            <Text style={[styles.modalSubtitle, { fontSize: getScaledFont(13), color: colores.onSurfaceVariant }]}>
              Diligencia las observaciones y recomendaciones técnicas para el productor:
            </Text>

            <View style={{ gap: 12, marginVertical: 14 }}>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.infoLabel, { fontSize: getScaledFont(12) }]}>Plantas revisadas</Text>
                  <TextInput
                    style={[
                      styles.singleInput,
                      {
                        backgroundColor: colores.surfaceContainer,
                        borderColor: colores.outlineVariant,
                        fontSize: getScaledFont(14),
                        color: colores.onSurface,
                      },
                    ]}
                    value={plantasRevisadas}
                    onChangeText={setPlantasRevisadas}
                    placeholder="Ej: 50"
                    keyboardType="number-pad"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.infoLabel, { fontSize: getScaledFont(12) }]}>Plantas enfermas</Text>
                  <TextInput
                    style={[
                      styles.singleInput,
                      {
                        backgroundColor: colores.surfaceContainer,
                        borderColor: colores.outlineVariant,
                        fontSize: getScaledFont(14),
                        color: colores.onSurface,
                      },
                    ]}
                    value={plantasEnfermas}
                    onChangeText={setPlantasEnfermas}
                    placeholder="Ej: 4"
                    keyboardType="number-pad"
                  />
                </View>
              </View>

              <View>
                <Text style={[styles.infoLabel, { fontSize: getScaledFont(12) }]}>Observaciones de campo</Text>
                <TextInput
                  style={[
                    styles.modalTextInput,
                    {
                      backgroundColor: colores.surfaceContainer,
                      borderColor: colores.outlineVariant,
                      fontSize: getScaledFont(14),
                      color: colores.onSurface,
                    },
                  ]}
                  value={observaciones}
                  onChangeText={setObservaciones}
                  placeholder="Detalla estado fitosanitario, nivel de sombra, etc."
                  multiline
                  numberOfLines={2}
                />
              </View>

              <View>
                <Text style={[styles.infoLabel, { fontSize: getScaledFont(12) }]}>Recomendaciones agronómicas</Text>
                <TextInput
                  style={[
                    styles.modalTextInput,
                    {
                      backgroundColor: colores.surfaceContainer,
                      borderColor: colores.outlineVariant,
                      fontSize: getScaledFont(14),
                      color: colores.onSurface,
                    },
                  ]}
                  value={recomendaciones}
                  onChangeText={setRecomendaciones}
                  placeholder="Recomendaciones de manejo, descope, poda o fertilización..."
                  multiline
                  numberOfLines={2}
                />
              </View>

              <View>
                <Text style={[styles.infoLabel, { fontSize: getScaledFont(12) }]}>Informe general / Conclusiones</Text>
                <TextInput
                  style={[
                    styles.modalTextInput,
                    {
                      backgroundColor: colores.surfaceContainer,
                      borderColor: colores.outlineVariant,
                      fontSize: getScaledFont(14),
                      color: colores.onSurface,
                    },
                  ]}
                  value={informeFinal}
                  onChangeText={setInformeFinal}
                  placeholder="Resumen para constancia técnica..."
                  multiline
                  numberOfLines={2}
                />
              </View>
            </View>

            <View style={styles.modalBtnsRow}>
              <TouchableOpacity
                style={[styles.modalBtnSec, { borderColor: colores.outline }]}
                onPress={() => setModalFinalizarVisible(false)}
              >
                <Text style={{ color: colores.outline, fontWeight: '700' }}>Volver</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtnPrim, { backgroundColor: colores.primary }]}
                onPress={handleConfirmarFinalizar}
              >
                <Text style={{ color: '#ffffff', fontWeight: '700' }}>Finalizar y Guardar</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
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
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  centerText: {
    marginTop: 14,
  },
  errorText: {
    textAlign: 'center',
    marginTop: 14,
    marginBottom: 16,
  },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: Theme.roundness.md,
  },
  statusBanner: {
    borderRadius: Theme.roundness.md,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
  },
  statusBannerLeft: {
    gap: 2,
  },
  statusBannerTitle: {
    fontWeight: '800',
  },
  statusBannerSubtitle: {
    fontWeight: '600',
  },
  card: {
    borderRadius: Theme.roundness.lg,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardSectionTitle: {
    fontWeight: '800',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 12,
  },
  infoLabel: {
    fontWeight: '600',
    marginBottom: 2,
  },
  infoValue: {
    lineHeight: 20,
  },
  infoValueBold: {
    fontWeight: '800',
  },
  infoSubtext: {
    marginTop: 2,
  },
  telefonoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  telefonoText: {
    fontWeight: '700',
  },
  contactoProducerContainer: {
    marginTop: 6,
  },
  contactoButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  btnWhatsApp: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#25D366',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Theme.roundness.full,
    shadowColor: '#25D366',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  btnWhatsAppText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  btnLlamar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Theme.roundness.full,
    borderWidth: 1,
  },
  btnLlamarText: {
    fontWeight: '700',
  },
  motivoLargo: {
    lineHeight: 22,
  },
  notasPreviasLabel: {
    fontWeight: '700',
    marginTop: 10,
    marginBottom: 4,
  },
  metricasRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  metricaBox: {
    flex: 1,
    padding: 10,
    borderRadius: Theme.roundness.sm,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
  },
  metricaNum: {
    fontWeight: '800',
  },
  metricaLabel: {
    color: '#64748b',
    fontWeight: '600',
  },
  imageThumb: {
    marginRight: 10,
    width: 90,
    borderRadius: Theme.roundness.sm,
    overflow: 'hidden',
  },
  imagePhoto: {
    width: 90,
    height: 90,
    borderRadius: Theme.roundness.sm,
  },
  imageLabel: {
    marginTop: 4,
    textAlign: 'center',
  },
  noImagesBox: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  noImagesText: {
    textAlign: 'center',
  },
  actionsContainer: {
    marginTop: 8,
    gap: 12,
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Theme.roundness.md,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryActionBtnText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  secondaryActionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Theme.roundness.md,
    borderWidth: 1.5,
    gap: 6,
  },
  secondaryActionBtnText: {
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  modalTitle: {
    fontWeight: '800',
    marginBottom: 6,
  },
  modalSubtitle: {
    marginBottom: 12,
    lineHeight: 18,
  },
  modalTextInput: {
    borderRadius: Theme.roundness.md,
    borderWidth: 1,
    padding: 12,
    textAlignVertical: 'top',
    minHeight: 70,
  },
  singleInput: {
    borderRadius: Theme.roundness.md,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  modalBtnsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 18,
  },
  modalBtnSec: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Theme.roundness.md,
    borderWidth: 1,
  },
  modalBtnPrim: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: Theme.roundness.md,
  },
});
