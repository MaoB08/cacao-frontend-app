import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { visitaService } from '../services/visitaService';
import { VisitaResumen, EstadoVisita } from '../types/visita';
import { Theme } from '../constants/theme';
import {
  CalendarIcon,
  ClockIcon,
  PlusIcon,
  SearchIcon,
  MapPinIcon,
  ChevronRightIcon,
  AlertTriangleIcon,
} from '../components/Icons';
import { useAccesibilidad } from '../contexts/AccesibilidadContext';

type TabTipo = 'PROGRAMADAS' | 'HISTORIAL';

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
        year: 'numeric',
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

export const VisitasScreen = ({ navigation, route }: any) => {
  const { colores, escalaTexto, botonesGrandes } = useAccesibilidad();
  const getScaledFont = (size: number) => size * escalaTexto;

  const [activeTab, setActiveTab] = useState<TabTipo>(route?.params?.tab || 'PROGRAMADAS');

  useEffect(() => {
    if (route?.params?.tab) {
      setActiveTab(route.params.tab);
    }
  }, [route?.params?.tab]);
  const [visitas, setVisitas] = useState<VisitaResumen[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Paginación
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const cargarVisitas = useCallback(
    async (resetPage: boolean = true) => {
      try {
        setError(null);
        const currentPage = resetPage ? 0 : page;
        if (resetPage) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }

        const res = await visitaService.listarVisitas({
          page: currentPage,
          size: 20,
        });

        const newItems = res.content || [];
        if (resetPage) {
          setVisitas(newItems);
          setPage(0);
        } else {
          setVisitas((prev) => [...prev, ...newItems]);
        }

        setHasMore(!res.last && newItems.length > 0);
      } catch (e: any) {
        setError(e?.mensaje || e?.message || 'Error al cargar las visitas técnicas');
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [page]
  );

  useEffect(() => {
    cargarVisitas(true);
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    cargarVisitas(true);
  }, [cargarVisitas]);

  const handleCargarMas = () => {
    if (!loading && !loadingMore && hasMore) {
      setPage((prev) => prev + 1);
      cargarVisitas(false);
    }
  };

  // Filtrado según pestaña y término de búsqueda
  const visitasFiltradas = visitas.filter((v) => {
    const esProgramada =
      v.estado === 'PROGRAMADA' || v.estado === 'EN_CURSO' || v.estado === 'REPROGRAMADA';
    const esHistorial = v.estado === 'COMPLETADA' || v.estado === 'CANCELADA';

    const coincideTab = activeTab === 'PROGRAMADAS' ? esProgramada : esHistorial;
    if (!coincideTab) return false;

    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase();
      const finca = v.fincaNombre?.toLowerCase() || '';
      const productor = v.agricultorNombre?.toLowerCase() || '';
      const municipio = v.fincaMunicipio?.toLowerCase() || '';
      const motivo = v.motivo?.toLowerCase() || '';
      return (
        finca.includes(q) ||
        productor.includes(q) ||
        municipio.includes(q) ||
        motivo.includes(q)
      );
    }

    return true;
  });

  const renderItem = ({ item }: { item: VisitaResumen }) => {
    const badge = getEstadoBadgeStyle(item.estado);
    const { fecha, hora } = formatFechaHora(item.fechaProgramada);

    return (
      <TouchableOpacity
        style={[
          styles.card,
          {
            backgroundColor: colores.surfaceContainerLowest,
            borderColor: colores.outlineVariant,
          },
        ]}
        onPress={() => navigation.navigate('DetalleVisita', { visitaId: item.id })}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`Visita técnica a ${item.fincaNombre}, estado ${badge.label}`}
      >
        <View style={styles.cardHeader}>
          <View style={styles.fechaBadgeRow}>
            <CalendarIcon color={colores.secondary} size={15} />
            <Text
              style={[
                styles.fechaText,
                { fontSize: getScaledFont(13), color: colores.secondary },
              ]}
            >
              {fecha}
            </Text>
            <Text style={[styles.horaText, { fontSize: getScaledFont(13), color: colores.outline }]}>
              • {hora}
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
            styles.fincaName,
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

        {item.loteNombre && (
          <Text
            style={[
              styles.loteText,
              { fontSize: getScaledFont(12), color: colores.primary },
            ]}
          >
            📍 Lote: {item.loteNombre}
            {item.loteVariedadCacao ? ` (${item.loteVariedadCacao})` : ''}
          </Text>
        )}

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
            Ver detalle completo
          </Text>
          <ChevronRightIcon color={colores.primary} size={16} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.container, { backgroundColor: colores.background }]}
    >
      {/* Top Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text
            style={[
              styles.headerTitle,
              { fontSize: getScaledFont(22), color: colores.primary },
            ]}
          >
            Agenda de Visitas
          </Text>
          <Text
            style={[
              styles.headerSubtitle,
              { fontSize: getScaledFont(13), color: colores.secondary },
            ]}
          >
            Gestión y seguimiento técnico en campo
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.nuevoBtn,
            {
              backgroundColor: colores.primary,
              minHeight: botonesGrandes ? 50 : 44,
            },
          ]}
          onPress={() => navigation.navigate('ProgramarVisita')}
          accessibilityRole="button"
          accessibilityLabel="Programar nueva visita"
        >
          <PlusIcon color="#ffffff" size={18} />
          <Text style={[styles.nuevoBtnText, { fontSize: getScaledFont(13) }]}>
            Agendar
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tabs Segmentados: Programadas vs Historial */}
      <View
        style={[
          styles.tabContainer,
          {
            backgroundColor: colores.surfaceContainer,
            borderColor: colores.outlineVariant,
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'PROGRAMADAS' && [
              styles.activeTabButton,
              { backgroundColor: colores.surfaceContainerLowest },
            ],
            { minHeight: botonesGrandes ? 54 : 48 },
          ]}
          onPress={() => setActiveTab('PROGRAMADAS')}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'PROGRAMADAS' }}
        >
          <Text
            style={[
              styles.tabButtonText,
              {
                fontSize: getScaledFont(14),
                color: activeTab === 'PROGRAMADAS' ? colores.primary : colores.onSurfaceVariant,
                fontWeight: activeTab === 'PROGRAMADAS' ? '800' : '600',
              },
            ]}
          >
            Programadas
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'HISTORIAL' && [
              styles.activeTabButton,
              { backgroundColor: colores.surfaceContainerLowest },
            ],
            { minHeight: botonesGrandes ? 54 : 48 },
          ]}
          onPress={() => setActiveTab('HISTORIAL')}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'HISTORIAL' }}
        >
          <Text
            style={[
              styles.tabButtonText,
              {
                fontSize: getScaledFont(14),
                color: activeTab === 'HISTORIAL' ? colores.primary : colores.onSurfaceVariant,
                fontWeight: activeTab === 'HISTORIAL' ? '800' : '600',
              },
            ]}
          >
            Historial
          </Text>
        </TouchableOpacity>
      </View>

      {/* Barra de Búsqueda */}
      <View
        style={[
          styles.searchBar,
          {
            backgroundColor: colores.surfaceContainerLowest,
            borderColor: colores.outlineVariant,
          },
        ]}
      >
        <SearchIcon color={colores.outline} size={18} />
        <TextInput
          style={[
            styles.searchInput,
            { fontSize: getScaledFont(14), color: colores.onSurface },
          ]}
          placeholder="Buscar por finca, productor o motivo..."
          placeholderTextColor={colores.outline}
          value={searchQuery}
          onChangeText={setSearchQuery}
          accessibilityLabel="Buscar visitas"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Text style={{ fontSize: 16, color: colores.outline, paddingHorizontal: 6 }}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Contenido / Listado */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colores.primary} />
          <Text
            style={[
              styles.centerText,
              { fontSize: getScaledFont(15), color: colores.onSurfaceVariant },
            ]}
          >
            Cargando visitas técnicas...
          </Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <AlertTriangleIcon color={colores.error} size={44} />
          <Text style={[styles.errorText, { fontSize: getScaledFont(15), color: colores.error }]}>
            {error}
          </Text>
          <TouchableOpacity
            style={[styles.retryBtn, { backgroundColor: colores.primary }]}
            onPress={() => cargarVisitas(true)}
          >
            <Text style={{ color: '#ffffff', fontWeight: '700' }}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={visitasFiltradas}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colores.primary}
            />
          }
          onEndReached={handleCargarMas}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator
                size="small"
                color={colores.primary}
                style={{ paddingVertical: 16 }}
              />
            ) : null
          }
          ListEmptyComponent={
            <View
              style={[
                styles.emptyContainer,
                {
                  backgroundColor: colores.surfaceContainerLowest,
                  borderColor: colores.outlineVariant,
                },
              ]}
            >
              <CalendarIcon color={colores.outline} size={44} />
              <Text
                style={[
                  styles.emptyTitle,
                  { fontSize: getScaledFont(16), color: colores.onSurface },
                ]}
              >
                {activeTab === 'PROGRAMADAS'
                  ? 'No hay visitas programadas'
                  : 'No hay visitas en el historial'}
              </Text>
              <Text
                style={[
                  styles.emptySubtitle,
                  { fontSize: getScaledFont(14), color: colores.onSurfaceVariant },
                ]}
              >
                {activeTab === 'PROGRAMADAS'
                  ? 'Agente una nueva visita técnica para programar labores en campo.'
                  : 'Las visitas finalizadas o canceladas aparecerán registradas aquí.'}
              </Text>
              {activeTab === 'PROGRAMADAS' && (
                <TouchableOpacity
                  style={[
                    styles.emptyBtn,
                    {
                      backgroundColor: colores.primary,
                      minHeight: botonesGrandes ? 50 : 44,
                    },
                  ]}
                  onPress={() => navigation.navigate('ProgramarVisita')}
                >
                  <Text style={[styles.emptyBtnText, { fontSize: getScaledFont(14) }]}>
                    Programar visita ahora
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 14,
  },
  headerTitle: {
    fontWeight: '800',
  },
  headerSubtitle: {
    fontWeight: '600',
    marginTop: 2,
  },
  nuevoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    borderRadius: Theme.roundness.full,
    gap: 6,
    shadowColor: '#154212',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  nuevoBtnText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    borderRadius: Theme.roundness.md,
    padding: 4,
    borderWidth: 1,
    marginBottom: 12,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Theme.roundness.sm,
  },
  activeTabButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabButtonText: {},
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Theme.roundness.md,
    borderWidth: 1,
    marginBottom: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
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
  card: {
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  fechaBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  fechaText: {
    fontWeight: '700',
  },
  horaText: {},
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Theme.roundness.full,
  },
  badgeText: {
    fontWeight: '700',
  },
  fincaName: {
    fontWeight: '800',
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  metaText: {
    flex: 1,
  },
  loteText: {
    fontWeight: '600',
    marginBottom: 6,
  },
  motivoText: {
    fontStyle: 'italic',
    lineHeight: 18,
    marginBottom: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 10,
    gap: 4,
  },
  detalleLink: {
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    borderRadius: Theme.roundness.lg,
    borderWidth: 1,
    marginTop: 20,
  },
  emptyTitle: {
    fontWeight: '700',
    marginTop: 14,
    marginBottom: 6,
  },
  emptySubtitle: {
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  emptyBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: Theme.roundness.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyBtnText: {
    color: '#ffffff',
    fontWeight: '700',
  },
});
