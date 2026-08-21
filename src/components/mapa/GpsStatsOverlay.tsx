import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GpsTrackerState } from '../../types/geo';
import { formatearDuracion, formatearArea } from '../../utils/geoUtils';
import { useAccesibilidad } from '../../contexts/AccesibilidadContext';

interface GpsStatsOverlayProps {
  tracker: GpsTrackerState;
}

/**
 * Tarjeta flotante semitransparente que muestra métricas en tiempo real
 * durante la delimitación del lote estilo Strava:
 * - Precisión GPS (verde/amarillo/rojo)
 * - Distancia caminada
 * - Área aproximada
 * - Puntos capturados
 * - Duración
 */
export const GpsStatsOverlay: React.FC<GpsStatsOverlayProps> = ({ tracker }) => {
  const { colores, escalaTexto } = useAccesibilidad();

  const precisionColor =
    tracker.precisionActual <= 5
      ? '#4CAF50'
      : tracker.precisionActual <= 10
        ? '#FF9800'
        : '#F44336';

  const precisionLabel =
    tracker.precisionActual <= 5
      ? 'Excelente'
      : tracker.precisionActual <= 10
        ? 'Buena'
        : 'Baja';

  return (
    <View style={styles.container}>
      <View style={[styles.card, { backgroundColor: 'rgba(0,0,0,0.75)' }]}>
        {/* Precisión GPS */}
        <View style={styles.row}>
          <View style={styles.statItem}>
            <View style={[styles.precisionDot, { backgroundColor: precisionColor }]} />
            <Text style={[styles.statValue, { fontSize: 14 * escalaTexto }]}>
              {tracker.precisionActual.toFixed(0)}m
            </Text>
            <Text style={[styles.statLabel, { fontSize: 9 * escalaTexto }]}>
              GPS {precisionLabel}
            </Text>
          </View>

          {/* Distancia */}
          <View style={styles.statItem}>
            <Text style={{ fontSize: 14 }}>📏</Text>
            <Text style={[styles.statValue, { fontSize: 14 * escalaTexto }]}>
              {tracker.distanciaTotal < 1000
                ? `${tracker.distanciaTotal.toFixed(0)}m`
                : `${(tracker.distanciaTotal / 1000).toFixed(2)}km`}
            </Text>
            <Text style={[styles.statLabel, { fontSize: 9 * escalaTexto }]}>
              Distancia
            </Text>
          </View>

          {/* Área */}
          <View style={styles.statItem}>
            <Text style={{ fontSize: 14 }}>📐</Text>
            <Text style={[styles.statValue, { fontSize: 14 * escalaTexto }]}>
              {formatearArea(tracker.areaAproximada)}
            </Text>
            <Text style={[styles.statLabel, { fontSize: 9 * escalaTexto }]}>
              Área aprox.
            </Text>
          </View>

          {/* Puntos */}
          <View style={styles.statItem}>
            <Text style={{ fontSize: 14 }}>📍</Text>
            <Text style={[styles.statValue, { fontSize: 14 * escalaTexto }]}>
              {tracker.coordenadas.length}
            </Text>
            <Text style={[styles.statLabel, { fontSize: 9 * escalaTexto }]}>
              Puntos
            </Text>
          </View>

          {/* Duración */}
          <View style={styles.statItem}>
            <Text style={{ fontSize: 14 }}>⏱️</Text>
            <Text style={[styles.statValue, { fontSize: 14 * escalaTexto }]}>
              {formatearDuracion(tracker.duracionSegundos)}
            </Text>
            <Text style={[styles.statLabel, { fontSize: 9 * escalaTexto }]}>
              Tiempo
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    zIndex: 10,
  },
  card: {
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    minWidth: 54,
  },
  precisionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginBottom: 2,
  },
  statValue: {
    color: '#ffffff',
    fontWeight: '700',
    marginTop: 2,
  },
  statLabel: {
    color: 'rgba(255,255,255,0.65)',
    fontWeight: '500',
    marginTop: 1,
  },
});
