import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity,
  ActivityIndicator, Image, RefreshControl, Platform, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/useAuthStore';
import { api } from '../services/api';
import { Theme } from '../constants/theme';
import {
  CacaoIcon, CameraIcon, AlertTriangleIcon, ActivityIcon,
  ThermometerIcon, LeafIcon, CalendarIcon, ChevronRightIcon,
  UserIcon, MapPinIcon, ClockIcon,
} from '../components/Icons';
import { CultivIALogo } from '../components/CultivIALogo';
import { useShallow } from 'zustand/react/shallow';
import { useAccesibilidad } from '../contexts/AccesibilidadContext';
import { agricultorVisitaService } from '../services/agricultorVisitaService';
import { VisitasAgricultorDashboard, ProximaVisitaAgricultor } from '../types/visita';
import { HistorialVisitasAgricultorModal } from '../components/HistorialVisitasAgricultorModal';
import { resolveMediaUrl } from '../utils/mediaUtils';

interface DiagnosticoInfo {
  id: string;
  imagenUrl: string;
  enfermedadDetectada: string;
  nivelConfianza: number;
  severidad: 'ALTA' | 'MEDIA' | 'BAJA' | 'SALUDABLE';
  fecha: string;
}

interface DashboardData {
  agricultor: { nombre: string; nombreFinca: string };
  resumen: { totalDiagnosticos: number; alertasActivas: number; ultimoAnalisis: string | null };
  diagnosticosRecientes: DiagnosticoInfo[];
}

const severityColors: Record<string, { bg: string; text: string }> = {
  ALTA: { bg: '#ffdad6', text: '#ba1a1a' },
  MEDIA: { bg: '#ffddb8', text: '#724700' },
  BAJA: { bg: '#e8f5e9', text: '#2e7d32' },
  SALUDABLE: { bg: '#bcf0ae', text: '#154212' },
};

export const DashboardAgricultorScreen = ({ navigation }: any) => {
  const { user } = useAuthStore(useShallow((s) => ({ user: s.user })));
  const { escalaTexto, colores, botonesGrandes } = useAccesibilidad();
  const [data, setData] = useState<DashboardData | null>(null);
  const [visitasDashboard, setVisitasDashboard] = useState<VisitasAgricultorDashboard | null>(null);
  const [modalVisitasVisible, setModalVisitasVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = useCallback(async () => {
    try {
      setError(null);
      const [dashRes, visitasRes] = await Promise.allSettled([
        api.get('/agricultores/dashboard'),
        agricultorVisitaService.getResumenVisitas(),
      ]);

      if (dashRes.status === 'fulfilled') {
        setData(dashRes.value.data);
      } else {
        throw dashRes.reason;
      }

      if (visitasRes.status === 'fulfilled') {
        setVisitasDashboard(visitasRes.value);
      }
    } catch (e: any) {
      setError(e.mensaje || 'Error al cargar el dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboard();
  }, [fetchDashboard]);

  const getScaledFont = (size: number) => size * escalaTexto;

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colores.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colores.primary} />
          <Text style={[styles.loadingText, { fontSize: getScaledFont(16), color: colores.onSurfaceVariant }]}>
            Cargando tu finca...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colores.background }]}>
        <View style={styles.loadingContainer}>
          <AlertTriangleIcon color={colores.error} size={48} />
          <Text style={[styles.errorText, { fontSize: getScaledFont(16), color: colores.error }]}>{error}</Text>
          <TouchableOpacity style={[styles.retryButton, { backgroundColor: colores.primary }]} onPress={fetchDashboard}>
            <Text style={[styles.retryButtonText, { fontSize: getScaledFont(16) }]}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!data) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colores.background }]}>
        <View style={styles.loadingContainer}>
          <AlertTriangleIcon color={colores.error} size={48} />
          <Text style={[styles.errorText, { fontSize: getScaledFont(16), color: colores.error }]}>
            {error || 'No fue posible conectar con el servidor CultivIA'}
          </Text>
          <TouchableOpacity style={[styles.retryButton, { backgroundColor: colores.primary }]} onPress={fetchDashboard}>
            <Text style={[styles.retryButtonText, { fontSize: getScaledFont(16) }]}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const d = data;

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.container, { backgroundColor: colores.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          {
            paddingHorizontal: 24
          }
        ]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colores.primary} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={[styles.farmerName, { fontSize: getScaledFont(24), color: colores.primary }]}>
              {d.agricultor?.nombre || user?.nombre || 'Agricultor'}
            </Text>
            <Text style={[styles.fincaName, { fontSize: getScaledFont(14), color: colores.secondary }]}>
              {d.agricultor?.nombreFinca || user?.nombreFinca || 'Mi Finca Cacaotera'}
            </Text>
          </View>
          <View style={[styles.headerIcon, { backgroundColor: colores.surfaceContainer }]}>
            <CultivIALogo size={46} />
          </View>
        </View>

        {/* Temperature Card */}
        <View style={[styles.tempCard, { backgroundColor: colores.primary }]}>
          <ThermometerIcon color="#ffffff" size={22} />
          <View style={{ marginLeft: 12 }}>
            <Text style={[styles.tempLabel, { fontSize: getScaledFont(12) }]}>Temperatura actual</Text>
            <Text style={[styles.tempValue, { fontSize: getScaledFont(18) }]}>28°C — Soleado</Text>
          </View>
        </View>

        {/* Stats Bento Grid */}
        <View style={styles.bentoGrid}>
          <View style={[styles.statCard, { backgroundColor: colores.surfaceContainer }]}>
            <ActivityIcon color={colores.primary} size={24} />
            <Text style={[styles.statValue, { fontSize: getScaledFont(28), color: colores.primary }]}>
              {d.resumen.totalDiagnosticos}
            </Text>
            <Text style={[styles.statLabel, { fontSize: getScaledFont(13), color: colores.primary }]}>
              Diagnósticos
            </Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#ffddb8' }]}>
            <AlertTriangleIcon color="#724700" size={24} />
            <Text style={[styles.statValue, { fontSize: getScaledFont(28), color: '#724700' }]}>
              {d.resumen.alertasActivas}
            </Text>
            <Text style={[styles.statLabel, { fontSize: getScaledFont(13), color: '#724700' }]}>
              Alertas Activas
            </Text>
          </View>
          <View style={[styles.statCardWide, { backgroundColor: colores.surfaceContainerLowest, borderColor: colores.outlineVariant }]}>
            <LeafIcon color={colores.primary} size={20} />
            <Text style={[styles.statLabelWide, { fontSize: getScaledFont(14), color: colores.onSurfaceVariant }]}>
              Último análisis:{' '}
              <Text style={{ fontWeight: '700' }}>
                {d.resumen.ultimoAnalisis
                  ? new Date(d.resumen.ultimoAnalisis).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })
                  : 'Sin análisis'}
              </Text>
            </Text>
          </View>
        </View>

        {/* Quick Action */}
        <TouchableOpacity
          style={[
            styles.scanButton,
            {
              backgroundColor: colores.primary,
              height: botonesGrandes ? 64 : 48,
              borderRadius: botonesGrandes ? 32 : 24,
            }
          ]}
          onPress={() => navigation.navigate('Cámara')}
        >
          <CameraIcon color="#ffffff" size={22} />
          <Text style={[styles.scanButtonText, { fontSize: getScaledFont(16) }]}>Escanear Mazorca</Text>
        </TouchableOpacity>

        {/* Visitas Técnicas del Agrónomo (MA-20) */}
        <View style={styles.visitasSectionHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <CalendarIcon color={colores.primary} size={22} />
            <Text style={[styles.sectionTitle, { fontSize: getScaledFont(20), color: colores.onSurface, marginBottom: 0 }]}>
              Asistencia Técnica
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.verHistorialLink, { minHeight: botonesGrandes ? 48 : 36 }]}
            onPress={() => setModalVisitasVisible(true)}
            accessibilityLabel="Ver historial completo de visitas técnicas"
          >
            <Text style={[styles.verHistorialLinkText, { color: colores.primary, fontSize: getScaledFont(13) }]}>
              Ver historial
            </Text>
            <ChevronRightIcon color={colores.primary} size={16} />
          </TouchableOpacity>
        </View>

        {/* Bento / KPIs de Visitas */}
        <View style={styles.visitasKpiRow}>
          <View style={[styles.visitaKpiCard, { backgroundColor: colores.surfaceContainerLowest, borderColor: colores.outlineVariant }]}>
            <Text style={[styles.visitaKpiNumber, { color: colores.primary, fontSize: getScaledFont(22) }]}>
              {visitasDashboard?.proximasVisitas ?? 0}
            </Text>
            <Text style={[styles.visitaKpiLabel, { color: colores.onSurfaceVariant, fontSize: getScaledFont(12) }]}>
              Próximas visitas
            </Text>
          </View>
          <View style={[styles.visitaKpiCard, { backgroundColor: colores.surfaceContainerLowest, borderColor: colores.outlineVariant }]}>
            <Text style={[styles.visitaKpiNumber, { color: '#154212', fontSize: getScaledFont(22) }]}>
              {visitasDashboard?.completadasTotal ?? 0}
            </Text>
            <Text style={[styles.visitaKpiLabel, { color: colores.onSurfaceVariant, fontSize: getScaledFont(12) }]}>
              Completadas
            </Text>
          </View>
        </View>

        {/* Próximas Visitas Cards o Estado Vacío */}
        {visitasDashboard?.proximas && visitasDashboard.proximas.length > 0 ? (
          <View style={styles.proximasContainer}>
            {visitasDashboard.proximas.map((prox) => {
              const f = new Date(prox.fechaProgramada);
              const fStr = f.toLocaleDateString('es-CO', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
              });
              const hStr = f.toLocaleTimeString('es-CO', {
                hour: '2-digit',
                minute: '2-digit',
              });
              return (
                <TouchableOpacity
                  key={prox.id}
                  style={[
                    styles.proximaCard,
                    {
                      backgroundColor: colores.surfaceContainerLowest,
                      borderColor: colores.outlineVariant,
                    },
                  ]}
                  onPress={() => setModalVisitasVisible(true)}
                  accessibilityLabel={`Visita técnica agendada para ${fStr}`}
                >
                  <View style={styles.proximaCardHeader}>
                    <View style={[styles.estadoPill, { backgroundColor: prox.estado === 'EN_CURSO' ? '#fef3c7' : '#e0f2fe' }]}>
                      <Text style={[styles.estadoPillText, { color: prox.estado === 'EN_CURSO' ? '#b45309' : '#0369a1', fontSize: getScaledFont(11) }]}>
                        {prox.estado === 'EN_CURSO' ? 'En Curso' : 'Programada'}
                      </Text>
                    </View>
                    <Text style={[styles.proximaFecha, { color: colores.primary, fontSize: getScaledFont(13) }]}>
                      {fStr} • {hStr}
                    </Text>
                  </View>

                  <Text style={[styles.proximaMotivo, { color: colores.onSurface, fontSize: getScaledFont(15) }]} numberOfLines={1}>
                    {prox.motivo || 'Visita agronómica programada'}
                  </Text>

                  <View style={styles.proximaFooter}>
                    <View style={styles.proximaMetaItem}>
                      <UserIcon color={colores.secondary} size={14} />
                      <Text style={[styles.proximaMetaText, { color: colores.onSurfaceVariant, fontSize: getScaledFont(12) }]} numberOfLines={1}>
                        {prox.agronomoNombre}
                      </Text>
                    </View>
                    <View style={styles.proximaMetaItem}>
                      <MapPinIcon color={colores.secondary} size={14} />
                      <Text style={[styles.proximaMetaText, { color: colores.onSurfaceVariant, fontSize: getScaledFont(12) }]} numberOfLines={1}>
                        {prox.fincaNombre}{prox.loteNombre ? ` • ${prox.loteNombre}` : ''}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <TouchableOpacity
            style={[
              styles.emptyVisitasCard,
              {
                backgroundColor: colores.surfaceContainerLowest,
                borderColor: colores.outlineVariant,
              },
            ]}
            onPress={() => setModalVisitasVisible(true)}
            accessibilityLabel="Ver registro de asistencias técnicas"
          >
            <View style={[styles.emptyIconCircle, { backgroundColor: colores.surfaceContainer }]}>
              <CalendarIcon color={colores.primary} size={20} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.emptyVisitaTitle, { color: colores.onSurface, fontSize: getScaledFont(14) }]}>
                Sin visitas pendientes
              </Text>
              <Text style={[styles.emptyVisitaSub, { color: colores.onSurfaceVariant, fontSize: getScaledFont(12) }]}>
                Consulta el historial y recomendaciones técnicas previas aquí.
              </Text>
            </View>
            <ChevronRightIcon color={colores.outline} size={18} />
          </TouchableOpacity>
        )}

        {/* Recent Diagnoses */}
        <Text style={[styles.sectionTitle, { fontSize: getScaledFont(20), color: colores.onSurface }]}>
          Diagnósticos Recientes
        </Text>
        {d.diagnosticosRecientes.map((diag) => {
          const sev = severityColors[diag.severidad] || severityColors.BAJA;
          const resolvedUri = resolveMediaUrl(diag.imagenUrl);
          return (
            <TouchableOpacity
              key={diag.id}
              activeOpacity={0.8}
              onPress={() => {
                navigation.navigate('Cámara', {
                  screen: 'ResultadoAnalisis',
                  params: {
                    diagnostico: {
                      id: diag.id,
                      imagenUrl: resolvedUri || diag.imagenUrl,
                      tieneEnfermedad: diag.enfermedadDetectada.toLowerCase() !== 'mazorca sana',
                      nombreEnfermedad: diag.enfermedadDetectada,
                      nombreCientifico: diag.enfermedadDetectada.toLowerCase().includes('monilia')
                        ? 'Moniliophthora roreri'
                        : 'Theobroma cacao L.',
                      codigoClase: '',
                      probabilidad: diag.nivelConfianza,
                      confianza: `${Math.round(diag.nivelConfianza * 100)}%`,
                      severidad: diag.severidad,
                      concluyente: true,
                      recomendaciones: [],
                      createdAt: diag.fecha,
                    },
                    imageUri: resolvedUri || diag.imagenUrl,
                  },
                });
              }}
              style={[
                styles.diagCard,
                { backgroundColor: colores.surfaceContainerLowest, borderColor: colores.outlineVariant }
              ]}
            >
              {resolvedUri ? (
                <Image
                  source={{ uri: resolvedUri }}
                  style={styles.diagImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.diagImage, styles.diagImagePlaceholder]}>
                  <CameraIcon color={colores.outline} size={26} />
                </View>
              )}
              <View style={styles.diagInfo}>
                <Text style={[styles.diagDisease, { fontSize: getScaledFont(15), color: colores.onSurface }]} numberOfLines={1}>
                  {diag.enfermedadDetectada}
                </Text>
                <Text style={[styles.diagDate, { fontSize: getScaledFont(12), color: colores.outline }]}>
                  {new Date(diag.fecha).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  <View style={[styles.severityBadge, { backgroundColor: sev.bg }]}>
                    <Text style={[styles.severityText, { fontSize: getScaledFont(11), color: sev.text }]}>{diag.severidad}</Text>
                  </View>
                  <Text style={[styles.confidence, { fontSize: getScaledFont(13), color: colores.primary }]}>
                    {Math.round(diag.nivelConfianza * 100)}%
                  </Text>
                </View>
              </View>
              <ChevronRightIcon color={colores.outline} size={18} />
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <HistorialVisitasAgricultorModal
        visible={modalVisitasVisible}
        onClose={() => setModalVisitasVisible(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    paddingBottom: 40,
  },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  loadingText: { marginTop: 16 },
  errorText: { marginTop: 16, textAlign: 'center' },
  retryButton: {
    marginTop: 20, paddingHorizontal: 32, paddingVertical: 14,
    borderRadius: Theme.roundness.full,
  },
  retryButtonText: { color: '#fff', fontWeight: '700' },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerLeft: {
    flex: 1,
    paddingRight: 16,
  },
  farmerName: { fontWeight: '800' },
  fincaName: { fontWeight: '600', marginTop: 2 },
  headerIcon: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
  },

  tempCard: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: Theme.roundness.md, padding: 16, marginBottom: 20,
  },
  tempLabel: { color: '#a1d494', fontWeight: '600' },
  tempValue: { color: '#ffffff', fontWeight: '700' },

  bentoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  statCard: {
    flex: 1, minWidth: '45%', padding: 16, borderRadius: Theme.roundness.default,
    alignItems: 'flex-start', gap: 8,
  },
  statValue: { fontWeight: '800' },
  statLabel: { fontWeight: '600' },
  statCardWide: {
    width: '100%', flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 14, borderRadius: Theme.roundness.default,
    borderWidth: 1,
  },
  statLabelWide: {},

  scanButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    marginBottom: 28,
    shadowColor: Theme.colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 8, elevation: 4,
  },
  scanButtonText: { color: '#fff', fontWeight: '700' },

  sectionTitle: { fontWeight: '700', marginBottom: 14 },

  diagCard: {
    flexDirection: 'row',
    borderRadius: Theme.roundness.default, padding: 12, marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#5c403a', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06,
    shadowRadius: 12, elevation: 3,
  },
  diagImage: { width: 68, height: 68, borderRadius: 12, backgroundColor: Theme.colors.surfaceContainer },
  diagImagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  diagInfo: { flex: 1, marginLeft: 12, justifyContent: 'center' },
  diagDisease: { fontWeight: '700' },
  diagDate: { marginTop: 2 },
  severityBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  severityText: { fontWeight: '700', letterSpacing: 0.5 },
  confidence: { fontWeight: '700' },
  visitasSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    marginTop: 4,
  },
  verHistorialLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  verHistorialLinkText: {
    fontWeight: '700',
  },
  visitasKpiRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  visitaKpiCard: {
    flex: 1,
    padding: 12,
    borderRadius: Theme.roundness.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  visitaKpiNumber: {
    fontWeight: '800',
    marginBottom: 2,
  },
  visitaKpiLabel: {
    fontWeight: '600',
  },
  proximasContainer: {
    gap: 10,
    marginBottom: 24,
  },
  proximaCard: {
    padding: 14,
    borderRadius: Theme.roundness.md,
    borderWidth: 1,
  },
  proximaCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  estadoPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Theme.roundness.full,
  },
  estadoPillText: {
    fontWeight: '700',
  },
  proximaFecha: {
    fontWeight: '700',
  },
  proximaMotivo: {
    fontWeight: '700',
    marginBottom: 8,
  },
  proximaFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  proximaMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  proximaMetaText: {
    fontWeight: '500',
  },
  emptyVisitasCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: Theme.roundness.md,
    borderWidth: 1,
    marginBottom: 24,
  },
  emptyIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyVisitaTitle: {
    fontWeight: '700',
  },
  emptyVisitaSub: {
    marginTop: 2,
    lineHeight: 16,
  },
});
