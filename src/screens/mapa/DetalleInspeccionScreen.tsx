import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';

import { InspeccionDetalle, getColorEnfermedad } from '../../types/geo';
import { inspeccionService } from '../../services/inspeccionService';
import { useAccesibilidad } from '../../contexts/AccesibilidadContext';

/**
 * Detalle completo de una inspección de campo con todas sus
 * detecciones de enfermedades, fotos y observaciones.
 */
export const DetalleInspeccionScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const { colores, escalaTexto } = useAccesibilidad();

  const { inspeccionId } = route.params as { inspeccionId: string };

  const [inspeccion, setInspeccion] = useState<InspeccionDetalle | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await inspeccionService.obtenerDetalle(inspeccionId);
        setInspeccion(data);
      } catch (err) {
        console.error('Error cargando detalle de inspección:', err);
      } finally {
        setCargando(false);
      }
    })();
  }, [inspeccionId]);

  if (cargando || !inspeccion) {
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
          Detalle de inspección
        </Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Info general */}
        <View style={[styles.infoCard, { backgroundColor: colores.surfaceContainerLowest }]}>
          <Text style={[styles.infoDate, { color: colores.onSurface, fontSize: 16 * escalaTexto }]}>
            📅 {new Date(inspeccion.fechaInspeccion).toLocaleDateString('es-CO', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </Text>

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colores.onSurfaceVariant, fontSize: 13 * escalaTexto }]}>
              Lote
            </Text>
            <Text style={[styles.infoValue, { color: colores.onSurface, fontSize: 13 * escalaTexto }]}>
              {inspeccion.loteNombre}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colores.onSurfaceVariant, fontSize: 13 * escalaTexto }]}>
              Inspector
            </Text>
            <Text style={[styles.infoValue, { color: colores.onSurface, fontSize: 13 * escalaTexto }]}>
              {inspeccion.usuarioNombre}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colores.onSurfaceVariant, fontSize: 13 * escalaTexto }]}>
              Plantas revisadas
            </Text>
            <Text style={[styles.infoValue, { color: colores.onSurface, fontSize: 13 * escalaTexto }]}>
              {inspeccion.plantasInspeccionadas}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colores.onSurfaceVariant, fontSize: 13 * escalaTexto }]}>
              Plantas enfermas
            </Text>
            <Text style={[styles.infoValue, { color: '#F44336', fontSize: 13 * escalaTexto }]}>
              {inspeccion.plantasEnfermas}
            </Text>
          </View>
          {inspeccion.duracionMinutos && (
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colores.onSurfaceVariant, fontSize: 13 * escalaTexto }]}>
                Duración
              </Text>
              <Text style={[styles.infoValue, { color: colores.onSurface, fontSize: 13 * escalaTexto }]}>
                {inspeccion.duracionMinutos} minutos
              </Text>
            </View>
          )}
        </View>

        {/* Observaciones */}
        {inspeccion.observaciones && (
          <View style={[styles.observacionesCard, { backgroundColor: colores.surfaceContainerLowest }]}>
            <Text style={[styles.sectionTitle, { color: colores.onSurface, fontSize: 14 * escalaTexto }]}>
              💬 Observaciones
            </Text>
            <Text style={[styles.observacionesText, { color: colores.onSurfaceVariant, fontSize: 13 * escalaTexto }]}>
              {inspeccion.observaciones}
            </Text>
          </View>
        )}

        {/* Detecciones */}
        <Text style={[styles.sectionTitle, { color: colores.onSurface, fontSize: 15 * escalaTexto, marginLeft: 24, marginTop: 20 }]}>
          🦠 Enfermedades detectadas ({inspeccion.detecciones.length})
        </Text>

        {inspeccion.detecciones.length === 0 ? (
          <View style={[styles.emptyDetecciones, { backgroundColor: colores.surfaceContainerLowest }]}>
            <Text style={{ fontSize: 30 }}>🌿</Text>
            <Text style={[styles.emptyText, { color: colores.onSurfaceVariant, fontSize: 13 * escalaTexto }]}>
              No se detectaron enfermedades en esta inspección
            </Text>
          </View>
        ) : (
          inspeccion.detecciones.map((det) => (
            <View
              key={det.id}
              style={[styles.deteccionCard, { backgroundColor: colores.surfaceContainerLowest }]}
            >
              <View style={styles.deteccionHeader}>
                <View style={styles.deteccionLeft}>
                  <View style={[styles.deteccionDot, { backgroundColor: getColorEnfermedad(det.enfermedad) }]} />
                  <View>
                    <Text style={[styles.deteccionEnfermedad, { color: colores.onSurface, fontSize: 14 * escalaTexto }]}>
                      {det.enfermedad}
                    </Text>
                    <Text style={[styles.deteccionConfianza, { color: colores.onSurfaceVariant, fontSize: 11 * escalaTexto }]}>
                      Confianza: {det.porcentajeConfianza}% · {det.severidad || '—'}
                    </Text>
                  </View>
                </View>
              </View>

              {det.imagenUrl && (
                <Image
                  source={{ uri: det.imagenUrl }}
                  style={styles.deteccionImage}
                  resizeMode="cover"
                />
              )}

              {det.observaciones && (
                <Text style={[styles.deteccionObs, { color: colores.onSurfaceVariant, fontSize: 12 * escalaTexto }]}>
                  {det.observaciones}
                </Text>
              )}
            </View>
          ))
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
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
    paddingHorizontal: 24,
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
  scrollContent: {
    flex: 1,
  },
  infoCard: {
    marginHorizontal: 24,
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  infoDate: {
    fontWeight: '600',
    marginBottom: 14,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  infoLabel: {
    fontWeight: '500',
  },
  infoValue: {
    fontWeight: '600',
  },
  observacionesCard: {
    marginHorizontal: 24,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontWeight: '700',
    marginBottom: 8,
  },
  observacionesText: {
    lineHeight: 20,
  },
  emptyDetecciones: {
    marginHorizontal: 24,
    marginTop: 10,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 10,
    fontWeight: '500',
    textAlign: 'center',
  },
  deteccionCard: {
    marginHorizontal: 24,
    marginTop: 10,
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  deteccionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deteccionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  deteccionDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  deteccionEnfermedad: {
    fontWeight: '700',
  },
  deteccionConfianza: {
    fontWeight: '500',
    marginTop: 2,
  },
  deteccionImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    marginTop: 12,
  },
  deteccionObs: {
    marginTop: 10,
    fontStyle: 'italic',
    lineHeight: 18,
  },
});
