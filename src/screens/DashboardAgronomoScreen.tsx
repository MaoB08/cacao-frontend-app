import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/useAuthStore';
import { agronomoService } from '../services/agronomoService';
import { AgronomoDashboardData, ProximaVisitaInfo, EstadoVisita } from '../types/visita';
import { Theme } from '../constants/theme';
import {
  CalendarIcon,
  ClockIcon,
  PlusIcon,
  AlertTriangleIcon,
  CheckIcon,
  ActivityIcon,
  ChevronRightIcon,
  MapPinIcon,
} from '../components/Icons';
import { useShallow } from 'zustand/react/shallow';
import { useAccesibilidad } from '../contexts/AccesibilidadContext';

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

const formatFechaHora = (fechaIso: string) => {
  try {
    const d = new Date(fechaIso);
    return {
      fecha: d.toLocaleDateString('es-CO', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      }),
      hora: d.toLocaleTimeString('es-CO', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
  } catch {
    return { fecha: fechaIso, hora: '' };
  }
};

export const DashboardAgronomoScreen = ({ navigation }: any) => {
  const { user } = useAuthStore(useShallow((s) => ({ user: s.user })));
  const { escalaTexto, colores, botonesGrandes } = useAccesibilidad();
  const [data, setData] = useState<AgronomoDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = useCallback(async () => {
    try {
      setError(null);
      const res = await agronomoService.getDashboard();
      setData(res);
    } catch (e: any) {
      setError(e?.mensaje || e?.message || 'Error al cargar panel del agrónomo');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboard();
  }, [fetchDashboard]);

  const getScaledFont = (size: number) => size * escalaTexto;

  const handleIrAProgramar = () => {
    navigation.navigate('Visitas', { screen: 'ProgramarVisita' });
  };

  const handleVerDetalleVisita = (visitaId: string) => {
    navigation.navigate('Visitas', {
      screen: 'DetalleVisita',
      params: { visitaId },
    });
  };

  const handleVerTodasLasVisitas = () => {
    navigation.navigate('Visitas', { screen: 'VisitasMain' });
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colores.background }]}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colores.primary} />
          <Text
            style={[
              styles.loadingText,
              { fontSize: getScaledFont(16), color: colores.onSurfaceVariant },
            ]}
          >
            Cargando agenda técnica...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colores.background }]}>
        <View style={styles.centerContainer}>
          <AlertTriangleIcon color={colores.error} size={48} />
          <Text style={[styles.errorText, { fontSize: getScaledFont(16), color: colores.error }]}>
            {error}
          </Text>
          <TouchableOpacity
            style={[
              styles.retryButton,
              {
                backgroundColor: colores.primary,
                minHeight: botonesGrandes ? 54 : 48,
              },
            ]}
            onPress={fetchDashboard}
            accessibilityRole="button"
            accessibilityLabel="Reintentar cargar información del panel"
          >
            <Text style={[styles.retryButtonText, { fontSize: getScaledFont(16) }]}>
              Reintentar
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const d = data!;
  const nombreAgronomo = d.agronomo?.nombre || user?.nombre || 'Agrónomo';
  const fincasAsignadas = d.agronomo?.fincasAsignadas ?? 0;
  const contadores = d.contadores || { programadas: 0, enCurso: 0, completadasMes: 0 };
  const proximas = d.proximasVisitas || [];

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.container, { backgroundColor: colores.background }]}
    >
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
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text
              style={[
                styles.greetingLabel,
                { fontSize: getScaledFont(13), color: colores.secondary },
              ]}
            >
              PANEL DEL AGRÓNOMO
            </Text>
            <Text
              style={[
                styles.agronomoName,
                { fontSize: getScaledFont(24), color: colores.primary },
              ]}
              numberOfLines={1}
            >
              {nombreAgronomo}
            </Text>
            <Text
              style={[
                styles.fincasCount,
                { fontSize: getScaledFont(14), color: colores.onSurfaceVariant },
              ]}
            >
              🌱 {fincasAsignadas} {fincasAsignadas === 1 ? 'finca asignada' : 'fincas asignadas'}
            </Text>
          </View>
        </View>

        {/* CTA Principal: Programar Visita */}
        <TouchableOpacity
          style={[
            styles.ctaButton,
            {
              backgroundColor: colores.primary,
              minHeight: botonesGrandes ? 56 : 50,
            },
          ]}
          onPress={handleIrAProgramar}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Programar nueva visita técnica"
        >
          <View style={styles.ctaIconWrapper}>
            <PlusIcon color="#ffffff" size={20} />
          </View>
          <Text style={[styles.ctaText, { fontSize: getScaledFont(16) }]}>
            Programar visita técnica
          </Text>
        </TouchableOpacity>

        {/* KPI Cards: Programadas, En Curso, Completadas */}
        <View style={styles.kpiRow}>
          <TouchableOpacity
            style={[
              styles.kpiCard,
              { backgroundColor: colores.surfaceContainerLowest, borderColor: '#bae6fd' },
            ]}
            onPress={() => navigation.navigate('Visitas', { screen: 'VisitasMain', params: { tab: 'PROGRAMADAS' } })}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel={`Ver ${contadores.programadas} visitas programadas`}
          >
            <View style={[styles.kpiIconWrapper, { backgroundColor: '#e0f2fe' }]}>
              <CalendarIcon color="#0284c7" size={20} />
            </View>
            <Text style={[styles.kpiValue, { fontSize: getScaledFont(22), color: '#0369a1' }]}>
              {contadores.programadas}
            </Text>
            <Text style={[styles.kpiLabel, { fontSize: getScaledFont(12) }]}>Programadas</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.kpiCard,
              { backgroundColor: colores.surfaceContainerLowest, borderColor: '#fde68a' },
            ]}
            onPress={() => navigation.navigate('Visitas', { screen: 'VisitasMain', params: { tab: 'PROGRAMADAS' } })}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel={`Ver ${contadores.enCurso} visitas en curso`}
          >
            <View style={[styles.kpiIconWrapper, { backgroundColor: '#fef3c7' }]}>
              <ActivityIcon color="#d97706" size={20} />
            </View>
            <Text style={[styles.kpiValue, { fontSize: getScaledFont(22), color: '#b45309' }]}>
              {contadores.enCurso}
            </Text>
            <Text style={[styles.kpiLabel, { fontSize: getScaledFont(12) }]}>En curso</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.kpiCard,
              { backgroundColor: colores.surfaceContainerLowest, borderColor: '#bbf7d0' },
            ]}
            onPress={() => navigation.navigate('Visitas', { screen: 'VisitasMain', params: { tab: 'HISTORIAL' } })}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel={`Ver ${contadores.completadasMes} visitas realizadas`}
          >
            <View style={[styles.kpiIconWrapper, { backgroundColor: '#dcfce7' }]}>
              <CheckIcon color="#16a34a" size={20} />
            </View>
            <Text style={[styles.kpiValue, { fontSize: getScaledFont(22), color: '#15803d' }]}>
              {contadores.completadasMes}
            </Text>
            <Text style={[styles.kpiLabel, { fontSize: getScaledFont(12) }]}>Realizadas</Text>
          </TouchableOpacity>
        </View>

        {/* Sección: Próximas Visitas */}
        <View style={styles.sectionHeaderRow}>
          <Text
            style={[
              styles.sectionTitle,
              { fontSize: getScaledFont(18), color: colores.primary },
            ]}
          >
            Próximas Visitas Técnicas
          </Text>
          {proximas.length > 0 && (
            <TouchableOpacity
              onPress={handleVerTodasLasVisitas}
              accessibilityRole="button"
              accessibilityLabel="Ver agenda completa de visitas"
            >
              <Text
                style={[
                  styles.verTodasLink,
                  { fontSize: getScaledFont(14), color: colores.primary },
                ]}
              >
                Ver todas
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {proximas.length === 0 ? (
          <View
            style={[
              styles.emptyCard,
              {
                backgroundColor: colores.surfaceContainerLowest,
                borderColor: colores.outlineVariant,
              },
            ]}
          >
            <CalendarIcon color={colores.outline} size={40} />
            <Text
              style={[
                styles.emptyTitle,
                { fontSize: getScaledFont(16), color: colores.onSurface },
              ]}
            >
              No tienes visitas programadas
            </Text>
            <Text
              style={[
                styles.emptySubtitle,
                { fontSize: getScaledFont(14), color: colores.onSurfaceVariant },
              ]}
            >
              Programa visitas técnicas a tus fincas asignadas para dar seguimiento al cultivo de cacao.
            </Text>
            <TouchableOpacity
              style={[
                styles.emptyActionBtn,
                {
                  backgroundColor: colores.surfaceContainer,
                  minHeight: botonesGrandes ? 50 : 44,
                },
              ]}
              onPress={handleIrAProgramar}
              accessibilityRole="button"
            >
              <Text
                style={[
                  styles.emptyActionBtnText,
                  { fontSize: getScaledFont(14), color: colores.primary },
                ]}
              >
                Programar primera visita
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          proximas.map((item) => {
            const badge = getEstadoBadgeStyle(item.estado);
            const { fecha, hora } = formatFechaHora(item.fechaProgramada);

            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.visitaCard,
                  {
                    backgroundColor: colores.surfaceContainerLowest,
                    borderColor: colores.outlineVariant,
                  },
                ]}
                onPress={() => handleVerDetalleVisita(item.id)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`Visita técnica en finca ${item.fincaNombre}, estado ${badge.label}`}
              >
                <View style={styles.visitaCardTop}>
                  <View style={styles.fechaHoraRow}>
                    <ClockIcon color={colores.secondary} size={16} />
                    <Text
                      style={[
                        styles.visitaFecha,
                        { fontSize: getScaledFont(13), color: colores.secondary },
                      ]}
                    >
                      {fecha} • {hora}
                    </Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                    <Text
                      style={[
                        styles.badgeText,
                        { fontSize: getScaledFont(11), color: badge.text },
                      ]}
                    >
                      {badge.label}
                    </Text>
                  </View>
                </View>

                <Text
                  style={[
                    styles.fincaTitulo,
                    { fontSize: getScaledFont(16), color: colores.onSurface },
                  ]}
                  numberOfLines={1}
                >
                  {item.fincaNombre}
                </Text>

                <View style={styles.metaRow}>
                  <MapPinIcon color={colores.outline} size={14} />
                  <Text
                    style={[
                      styles.metaText,
                      { fontSize: getScaledFont(13), color: colores.onSurfaceVariant },
                    ]}
                    numberOfLines={1}
                  >
                    {item.fincaMunicipio} • Productor: {item.agricultorNombre}
                  </Text>
                </View>

                {item.motivo ? (
                  <Text
                    style={[
                      styles.motivoText,
                      { fontSize: getScaledFont(13), color: colores.onSurfaceVariant },
                    ]}
                    numberOfLines={2}
                  >
                    📝 {item.motivo}
                  </Text>
                ) : null}

                <View style={styles.cardFooter}>
                  <Text
                    style={[
                      styles.detalleLink,
                      { fontSize: getScaledFont(13), color: colores.primary },
                    ]}
                  >
                    Ver detalles de la visita
                  </Text>
                  <ChevronRightIcon color={colores.primary} size={16} />
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontWeight: '500',
  },
  errorText: {
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 20,
    lineHeight: 22,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: Theme.roundness.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryButtonText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  header: {
    marginBottom: 16,
  },
  headerLeft: {
    gap: 4,
  },
  greetingLabel: {
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  agronomoName: {
    fontWeight: '800',
  },
  fincasCount: {
    fontWeight: '500',
    marginTop: 2,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Theme.roundness.md,
    paddingHorizontal: 20,
    marginBottom: 20,
    shadowColor: '#154212',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  ctaIconWrapper: {
    marginRight: 10,
  },
  ctaText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  kpiCard: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: Theme.roundness.md,
    borderWidth: 1,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  kpiIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  kpiValue: {
    fontWeight: '800',
  },
  kpiLabel: {
    fontWeight: '600',
    color: Theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontWeight: '800',
  },
  verTodasLink: {
    fontWeight: '700',
  },
  emptyCard: {
    padding: 24,
    borderRadius: Theme.roundness.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 6,
  },
  emptySubtitle: {
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  emptyActionBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: Theme.roundness.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyActionBtnText: {
    fontWeight: '700',
  },
  visitaCard: {
    borderRadius: Theme.roundness.lg,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  visitaCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  fechaHoraRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  visitaFecha: {
    fontWeight: '600',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Theme.roundness.full,
  },
  badgeText: {
    fontWeight: '700',
  },
  fincaTitulo: {
    fontWeight: '700',
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  metaText: {
    flex: 1,
  },
  motivoText: {
    fontStyle: 'italic',
    marginBottom: 10,
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 10,
  },
  detalleLink: {
    fontWeight: '700',
  },
});
