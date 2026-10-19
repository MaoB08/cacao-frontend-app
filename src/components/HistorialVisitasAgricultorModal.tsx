import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAccesibilidad } from '../contexts/AccesibilidadContext';
import { Theme } from '../constants/theme';
import {
  CalendarIcon,
  CloseIcon,
  UserIcon,
  MapPinIcon,
  ClockIcon,
  LeafIcon,
  CheckIcon,
  AlertTriangleIcon,
} from './Icons';
import { agricultorVisitaService } from '../services/agricultorVisitaService';
import { VisitaAgricultorResumen, EstadoVisita } from '../types/visita';

interface HistorialVisitasAgricultorModalProps {
  visible: boolean;
  onClose: () => void;
  fincaId?: string;
}

type FiltroTab = 'TODAS' | 'PROXIMAS' | 'COMPLETADAS';

export const HistorialVisitasAgricultorModal = ({
  visible,
  onClose,
  fincaId,
}: HistorialVisitasAgricultorModalProps) => {
  const { colores, escalaTexto, botonesGrandes } = useAccesibilidad();
  const [visitas, setVisitas] = useState<VisitaAgricultorResumen[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filtro, setFiltro] = useState<FiltroTab>('TODAS');
  const [error, setError] = useState<string | null>(null);

  const getScaledFont = (size: number) => size * escalaTexto;

  const fetchVisitas = useCallback(async () => {
    try {
      setError(null);
      const res = await agricultorVisitaService.listarVisitas(fincaId, 0, 50);
      setVisitas(res.content || []);
    } catch (e: any) {
      setError(e.mensaje || 'No se pudieron cargar las visitas técnicas');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fincaId]);

  useEffect(() => {
    if (visible) {
      setLoading(true);
      fetchVisitas();
    }
  }, [visible, fetchVisitas]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchVisitas();
  };

  const visitasFiltradas = visitas.filter((v) => {
    if (filtro === 'PROXIMAS') {
      return v.estado === 'PROGRAMADA' || v.estado === 'EN_CURSO';
    }
    if (filtro === 'COMPLETADAS') {
      return v.estado === 'COMPLETADA';
    }
    return true;
  });

  const getBadgeStyle = (estado: EstadoVisita) => {
    switch (estado) {
      case 'PROGRAMADA':
        return { bg: '#e0f2fe', text: '#0369a1', label: 'Programada' };
      case 'EN_CURSO':
        return { bg: '#fef3c7', text: '#b45309', label: 'En Curso' };
      case 'COMPLETADA':
        return { bg: '#bcf0ae', text: '#154212', label: 'Completada' };
      case 'CANCELADA':
        return { bg: '#fee2e2', text: '#b91c1c', label: 'Cancelada' };
      default:
        return { bg: colores.surfaceContainer, text: colores.onSurfaceVariant, label: estado };
    }
  };

  const renderItem = ({ item }: { item: VisitaAgricultorResumen }) => {
    const badge = getBadgeStyle(item.estado);
    const fecha = new Date(item.fechaProgramada);
    const fechaStr = fecha.toLocaleDateString('es-CO', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    const horaStr = fecha.toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
    });

    return (
      <View
        style={[
          styles.card,
          {
            backgroundColor: colores.surfaceContainerLowest,
            borderColor: colores.outlineVariant,
          },
        ]}
      >
        {/* Cabecera de la visita */}
        <View style={styles.cardHeader}>
          <View style={[styles.badge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.badgeText, { color: badge.text, fontSize: getScaledFont(12) }]}>
              {badge.label}
            </Text>
          </View>
          <View style={styles.fechaContainer}>
            <CalendarIcon color={colores.primary} size={16} />
            <Text style={[styles.fechaText, { color: colores.onSurface, fontSize: getScaledFont(13) }]}>
              {fechaStr} • {horaStr}
            </Text>
          </View>
        </View>

        {/* Motivo */}
        <Text style={[styles.motivoText, { color: colores.onSurface, fontSize: getScaledFont(16) }]}>
          {item.motivo || 'Visita técnica fitosanitaria'}
        </Text>

        {/* Finca y Agrónomo */}
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <MapPinIcon color={colores.secondary} size={16} />
            <Text
              style={[styles.metaText, { color: colores.onSurfaceVariant, fontSize: getScaledFont(13) }]}
              numberOfLines={1}
            >
              {item.fincaNombre}
              {item.loteNombre ? ` (${item.loteNombre})` : ''}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <UserIcon color={colores.secondary} size={16} />
            <Text
              style={[styles.metaText, { color: colores.onSurfaceVariant, fontSize: getScaledFont(13) }]}
              numberOfLines={1}
            >
              {item.agronomoNombre}
            </Text>
          </View>
        </View>

        {/* Recomendaciones (solo expuestas al agricultor) */}
        {item.estado === 'COMPLETADA' && item.recomendaciones ? (
          <View
            style={[
              styles.recomendacionesBox,
              {
                backgroundColor: '#f4fbf1',
                borderColor: '#cce8c5',
              },
            ]}
          >
            <View style={styles.recHeader}>
              <LeafIcon color="#154212" size={18} />
              <Text style={[styles.recTitle, { fontSize: getScaledFont(13), color: '#154212' }]}>
                Recomendaciones del Agrónomo
              </Text>
            </View>
            <Text style={[styles.recBody, { fontSize: getScaledFont(14), color: '#2b3b27' }]}>
              {item.recomendaciones}
            </Text>

            {item.plantasRevisadas != null && (
              <View style={styles.plantasRow}>
                <Text style={[styles.plantasText, { fontSize: getScaledFont(12), color: '#496043' }]}>
                  Plantas evaluadas: <Text style={{ fontWeight: '700' }}>{item.plantasRevisadas}</Text>
                </Text>
                {item.plantasEnfermas != null && (
                  <Text style={[styles.plantasText, { fontSize: getScaledFont(12), color: '#496043' }]}>
                    Afectadas: <Text style={{ fontWeight: '700', color: item.plantasEnfermas > 0 ? '#b91c1c' : '#154212' }}>{item.plantasEnfermas}</Text>
                  </Text>
                )}
              </View>
            )}
          </View>
        ) : null}

        {/* Si está en curso o programada */}
        {item.estado === 'PROGRAMADA' && (
          <View style={[styles.noticeBox, { backgroundColor: colores.surfaceContainer }]}>
            <ClockIcon color={colores.primary} size={16} />
            <Text style={[styles.noticeText, { color: colores.onSurfaceVariant, fontSize: getScaledFont(12) }]}>
              Duración estimada: {item.duracionEstimadaMin || 60} minutos
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView
        edges={['top', 'left', 'right', 'bottom']}
        style={[styles.container, { backgroundColor: colores.background }]}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colores.outlineVariant }]}>
          <View style={styles.headerTitleContainer}>
            <CalendarIcon color={colores.primary} size={24} />
            <Text style={[styles.headerTitle, { color: colores.primary, fontSize: getScaledFont(20) }]}>
              Visitas Técnicas
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.closeButton,
              {
                backgroundColor: colores.surfaceContainer,
                height: botonesGrandes ? 48 : 40,
                width: botonesGrandes ? 48 : 40,
                borderRadius: botonesGrandes ? 24 : 20,
              },
            ]}
            onPress={onClose}
            accessibilityLabel="Cerrar modal de visitas técnicas"
          >
            <CloseIcon color={colores.onSurface} size={20} />
          </TouchableOpacity>
        </View>

        {/* Notice informativo de solo lectura */}
        <View style={[styles.infoBanner, { backgroundColor: colores.surfaceContainer }]}>
          <LeafIcon color={colores.primary} size={18} />
          <Text style={[styles.infoBannerText, { color: colores.onSurfaceVariant, fontSize: getScaledFont(12) }]}>
            Registro oficial de asistencias técnicas agronómicas a tus fincas. La programación y reportes son administrados por tu profesional agrónomo.
          </Text>
        </View>

        {/* Tabs de Filtro */}
        <View style={styles.tabsRow}>
          {(['TODAS', 'PROXIMAS', 'COMPLETADAS'] as FiltroTab[]).map((tab) => {
            const active = filtro === tab;
            const labels: Record<FiltroTab, string> = {
              TODAS: 'Todas',
              PROXIMAS: 'Próximas',
              COMPLETADAS: 'Completadas',
            };
            return (
              <TouchableOpacity
                key={tab}
                style={[
                  styles.tabButton,
                  {
                    backgroundColor: active ? colores.primary : colores.surfaceContainer,
                    height: botonesGrandes ? 46 : 38,
                  },
                ]}
                onPress={() => setFiltro(tab)}
              >
                <Text
                  style={[
                    styles.tabButtonText,
                    {
                      color: active ? '#ffffff' : colores.onSurfaceVariant,
                      fontSize: getScaledFont(13),
                      fontWeight: active ? '700' : '500',
                    },
                  ]}
                >
                  {labels[tab]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Contenido principal */}
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colores.primary} />
            <Text style={[styles.loadingText, { color: colores.onSurfaceVariant, fontSize: getScaledFont(14) }]}>
              Cargando visitas técnicas...
            </Text>
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <AlertTriangleIcon color={colores.error} size={40} />
            <Text style={[styles.errorText, { color: colores.error, fontSize: getScaledFont(15) }]}>
              {error}
            </Text>
            <TouchableOpacity
              style={[styles.retryBtn, { backgroundColor: colores.primary }]}
              onPress={fetchVisitas}
            >
              <Text style={[styles.retryBtnText, { fontSize: getScaledFont(14) }]}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : visitasFiltradas.length === 0 ? (
          <View style={styles.centerContainer}>
            <CalendarIcon color={colores.outline} size={48} />
            <Text style={[styles.emptyTitle, { color: colores.onSurface, fontSize: getScaledFont(17) }]}>
              No hay visitas registradas
            </Text>
            <Text style={[styles.emptySubtitle, { color: colores.onSurfaceVariant, fontSize: getScaledFont(13) }]}>
              {filtro === 'PROXIMAS'
                ? 'No tienes visitas programadas próximamente en tus fincas.'
                : filtro === 'COMPLETADAS'
                ? 'Aún no se han completado visitas técnicas con recomendaciones registradas.'
                : 'No se encontraron visitas técnicas asociadas a tus fincas.'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={visitasFiltradas}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colores.primary} />
            }
          />
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontWeight: '800',
  },
  closeButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Theme.roundness.md,
  },
  infoBannerText: {
    flex: 1,
    lineHeight: 17,
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  tabButton: {
    flex: 1,
    borderRadius: Theme.roundness.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  tabButtonText: {},
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 32,
    gap: 14,
  },
  card: {
    padding: 16,
    borderRadius: Theme.roundness.lg,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Theme.roundness.full,
  },
  badgeText: {
    fontWeight: '700',
  },
  fechaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  fechaText: {
    fontWeight: '600',
  },
  motivoText: {
    fontWeight: '700',
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginBottom: 10,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontWeight: '500',
  },
  recomendacionesBox: {
    marginTop: 8,
    padding: 12,
    borderRadius: Theme.roundness.md,
    borderWidth: 1,
  },
  recHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  recTitle: {
    fontWeight: '700',
  },
  recBody: {
    lineHeight: 20,
    fontWeight: '500',
  },
  plantasRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#cce8c5',
  },
  plantasText: {},
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Theme.roundness.sm,
  },
  noticeText: {
    fontWeight: '500',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
  },
  errorText: {
    marginTop: 12,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: Theme.roundness.full,
  },
  retryBtnText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  emptyTitle: {
    fontWeight: '700',
    marginTop: 14,
    marginBottom: 6,
  },
  emptySubtitle: {
    textAlign: 'center',
    lineHeight: 19,
  },
});
