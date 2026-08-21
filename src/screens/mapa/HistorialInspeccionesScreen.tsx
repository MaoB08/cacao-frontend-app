import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';

import { Inspeccion } from '../../types/geo';
import { inspeccionService } from '../../services/inspeccionService';
import { useAccesibilidad } from '../../contexts/AccesibilidadContext';

/**
 * Pantalla de historial de inspecciones realizadas sobre un lote.
 * Muestra todas las inspecciones ordenadas por fecha descendente.
 */
export const HistorialInspeccionesScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const { colores, escalaTexto } = useAccesibilidad();

  const { loteId } = route.params as { loteId: string };

  const [inspecciones, setInspecciones] = useState<Inspeccion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const cargarInspecciones = useCallback(async () => {
    try {
      const data = await inspeccionService.listarPorLote(loteId);
      setInspecciones(data);
    } catch (err) {
      console.error('Error cargando inspecciones:', err);
    } finally {
      setCargando(false);
      setRefreshing(false);
    }
  }, [loteId]);

  useEffect(() => {
    cargarInspecciones();
  }, [cargarInspecciones]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    cargarInspecciones();
  }, [cargarInspecciones]);

  const renderInspeccion = ({ item }: { item: Inspeccion }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colores.surfaceContainerLowest }]}
      onPress={() => navigation.navigate('DetalleInspeccion', { inspeccionId: item.id })}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <Text style={[styles.cardDate, { color: colores.onSurface, fontSize: 15 * escalaTexto }]}>
          📅 {new Date(item.fechaInspeccion).toLocaleDateString('es-CO', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </Text>
        <View
          style={[
            styles.badge,
            {
              backgroundColor:
                item.estado === 'COMPLETADA' ? '#4CAF5020' : '#FF980020',
            },
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              {
                color: item.estado === 'COMPLETADA' ? '#4CAF50' : '#FF9800',
                fontSize: 10 * escalaTexto,
              },
            ]}
          >
            {item.estado}
          </Text>
        </View>
      </View>

      <View style={styles.cardMetrics}>
        <View style={styles.metric}>
          <Text style={[styles.metricValue, { color: colores.onSurface, fontSize: 18 * escalaTexto }]}>
            {item.plantasInspeccionadas}
          </Text>
          <Text style={[styles.metricLabel, { color: colores.onSurfaceVariant, fontSize: 11 * escalaTexto }]}>
            Plantas
          </Text>
        </View>
        <View style={[styles.separator, { backgroundColor: colores.outlineVariant }]} />
        <View style={styles.metric}>
          <Text style={[styles.metricValue, { color: '#F44336', fontSize: 18 * escalaTexto }]}>
            {item.plantasEnfermas}
          </Text>
          <Text style={[styles.metricLabel, { color: colores.onSurfaceVariant, fontSize: 11 * escalaTexto }]}>
            Enfermas
          </Text>
        </View>
        <View style={[styles.separator, { backgroundColor: colores.outlineVariant }]} />
        <View style={styles.metric}>
          <Text style={[styles.metricValue, { color: colores.onSurface, fontSize: 18 * escalaTexto }]}>
            {item.totalEnfermedades}
          </Text>
          <Text style={[styles.metricLabel, { color: colores.onSurfaceVariant, fontSize: 11 * escalaTexto }]}>
            Detecciones
          </Text>
        </View>
        {item.duracionMinutos && (
          <>
            <View style={[styles.separator, { backgroundColor: colores.outlineVariant }]} />
            <View style={styles.metric}>
              <Text style={[styles.metricValue, { color: colores.onSurface, fontSize: 18 * escalaTexto }]}>
                {item.duracionMinutos}
              </Text>
              <Text style={[styles.metricLabel, { color: colores.onSurfaceVariant, fontSize: 11 * escalaTexto }]}>
                Minutos
              </Text>
            </View>
          </>
        )}
      </View>

      {item.observaciones && (
        <Text
          style={[styles.observaciones, { color: colores.onSurfaceVariant, fontSize: 12 * escalaTexto }]}
          numberOfLines={2}
        >
          💬 {item.observaciones}
        </Text>
      )}

      <View style={styles.cardFooter}>
        <Text style={[styles.usuario, { color: colores.outline, fontSize: 11 * escalaTexto }]}>
          👤 {item.usuarioNombre}
        </Text>
        <Text style={[styles.arrow, { color: colores.outline }]}>→</Text>
      </View>
    </TouchableOpacity>
  );

  if (cargando) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colores.background, paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colores.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colores.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={[styles.backIcon, { color: colores.onSurface }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colores.onSurface, fontSize: 18 * escalaTexto }]}>
          Historial de inspecciones
        </Text>
        <View style={{ width: 44 }} />
      </View>

      {inspecciones.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={{ fontSize: 50 }}>🔍</Text>
          <Text style={[styles.emptyTitle, { color: colores.onSurface, fontSize: 16 * escalaTexto }]}>
            Sin inspecciones
          </Text>
          <Text style={[styles.emptySubtitle, { color: colores.onSurfaceVariant, fontSize: 13 * escalaTexto }]}>
            Aún no se han realizado inspecciones{'\n'}de campo en este lote.
          </Text>
        </View>
      ) : (
        <FlatList
          data={inspecciones}
          keyExtractor={(item) => item.id}
          renderItem={renderInspeccion}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[colores.primary]} />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 24,
    fontWeight: '700',
  },
  title: {
    fontWeight: '700',
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardDate: {
    fontWeight: '600',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  cardMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  metric: {
    flex: 1,
    alignItems: 'center',
  },
  metricValue: {
    fontWeight: '700',
  },
  metricLabel: {
    fontWeight: '500',
    marginTop: 2,
  },
  separator: {
    width: 1,
    height: 30,
  },
  observaciones: {
    fontStyle: 'italic',
    marginBottom: 10,
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  usuario: {
    fontWeight: '500',
  },
  arrow: {
    fontSize: 18,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 80,
  },
  emptyTitle: {
    fontWeight: '700',
    marginTop: 16,
  },
  emptySubtitle: {
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
});
