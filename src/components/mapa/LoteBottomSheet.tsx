import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
} from 'react-native';
import { LoteDetalle, getColorEnfermedad } from '../../types/geo';
import { formatearArea } from '../../utils/geoUtils';
import { Theme } from '../../constants/theme';
import { useAccesibilidad } from '../../contexts/AccesibilidadContext';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.45;

interface LoteBottomSheetProps {
  lote: LoteDetalle | null;
  visible: boolean;
  onClose: () => void;
  onVerHistorial: (loteId: string) => void;
  onIniciarInspeccion: (loteId: string) => void;
}

/**
 * Bottom Sheet animado que muestra la información completa de un lote
 * cuando el usuario toca un Polygon en el mapa.
 *
 * Muestra: nombre, área, inspecciones, detecciones agrupadas por enfermedad,
 * y botones de acción (Ver historial / Iniciar inspección).
 */
export const LoteBottomSheet: React.FC<LoteBottomSheetProps> = ({
  lote,
  visible,
  onClose,
  onVerHistorial,
  onIniciarInspeccion,
}) => {
  const { colores, escalaTexto } = useAccesibilidad();
  const translateY = React.useRef(new Animated.Value(SHEET_HEIGHT)).current;

  React.useEffect(() => {
    Animated.spring(translateY, {
      toValue: visible ? 0 : SHEET_HEIGHT,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  }, [visible]);

  if (!lote) return null;

  const resumenEntries = Object.entries(lote.resumenEnfermedades || {});

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: colores.surfaceContainerLowest,
          transform: [{ translateY }],
        },
      ]}
    >
      {/* Handle / Drag indicator */}
      <View style={styles.handleContainer}>
        <View style={[styles.handle, { backgroundColor: colores.outlineVariant }]} />
      </View>

      <ScrollView
        style={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header: Nombre y área */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={[styles.colorDot, { backgroundColor: lote.colorHex }]} />
            <Text style={[styles.nombre, { color: colores.onSurface, fontSize: 18 * escalaTexto }]}>
              {lote.nombre}
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={[styles.closeText, { color: colores.outline }]}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Métricas principales */}
        <View style={styles.metricsRow}>
          <MetricCard
            label="Área"
            value={formatearArea(lote.areaHectareas)}
            icon="📐"
            colores={colores}
            escalaTexto={escalaTexto}
          />
          <MetricCard
            label="Inspecciones"
            value={String(lote.totalInspecciones)}
            icon="🔍"
            colores={colores}
            escalaTexto={escalaTexto}
          />
          <MetricCard
            label="Detecciones"
            value={String(lote.totalDetecciones)}
            icon="🦠"
            colores={colores}
            escalaTexto={escalaTexto}
          />
        </View>

        {/* Última inspección */}
        {lote.ultimaInspeccion && (
          <View style={[styles.infoRow, { borderBottomColor: colores.outlineVariant }]}>
            <Text style={[styles.infoLabel, { color: colores.onSurfaceVariant, fontSize: 13 * escalaTexto }]}>
              Última inspección
            </Text>
            <Text style={[styles.infoValue, { color: colores.onSurface, fontSize: 13 * escalaTexto }]}>
              {new Date(lote.ultimaInspeccion).toLocaleDateString('es-CO', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </Text>
          </View>
        )}

        {/* Resumen de enfermedades */}
        {resumenEntries.length > 0 && (
          <View style={styles.enfermedadesSection}>
            <Text style={[styles.sectionTitle, { color: colores.onSurface, fontSize: 14 * escalaTexto }]}>
              Enfermedades detectadas
            </Text>
            {resumenEntries.map(([enfermedad, cantidad]) => (
              <View key={enfermedad} style={styles.enfermedadRow}>
                <View style={styles.enfermedadLeft}>
                  <View
                    style={[
                      styles.enfermedadDot,
                      { backgroundColor: getColorEnfermedad(enfermedad) },
                    ]}
                  />
                  <Text style={[styles.enfermedadNombre, { color: colores.onSurfaceVariant, fontSize: 13 * escalaTexto }]}>
                    {enfermedad}
                  </Text>
                </View>
                <Text style={[styles.enfermedadCantidad, { color: colores.onSurface, fontSize: 14 * escalaTexto }]}>
                  {cantidad}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Estado vacío de enfermedades */}
        {resumenEntries.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={{ fontSize: 28 }}>🌿</Text>
            <Text style={[styles.emptyText, { color: colores.onSurfaceVariant, fontSize: 13 * escalaTexto }]}>
              Sin enfermedades detectadas
            </Text>
          </View>
        )}

        {/* Botones de acción */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton, { borderColor: colores.primary }]}
            onPress={() => onVerHistorial(lote.id)}
          >
            <Text style={[styles.secondaryButtonText, { color: colores.primary, fontSize: 14 * escalaTexto }]}>
              📋 Ver historial
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.primaryButton, { backgroundColor: colores.primary }]}
            onPress={() => onIniciarInspeccion(lote.id)}
          >
            <Text style={[styles.primaryButtonText, { fontSize: 14 * escalaTexto }]}>
              🔬 Iniciar inspección
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </Animated.View>
  );
};

// ======================== Sub-componente MetricCard ========================

interface MetricCardProps {
  label: string;
  value: string;
  icon: string;
  colores: any;
  escalaTexto: number;
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, icon, colores, escalaTexto }) => (
  <View style={[styles.metricCard, { backgroundColor: colores.surfaceContainer }]}>
    <Text style={{ fontSize: 18 }}>{icon}</Text>
    <Text style={[styles.metricValue, { color: colores.onSurface, fontSize: 16 * escalaTexto }]}>
      {value}
    </Text>
    <Text style={[styles.metricLabel, { color: colores.onSurfaceVariant, fontSize: 10 * escalaTexto }]}>
      {label}
    </Text>
  </View>
);

// ======================== Styles ========================

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SHEET_HEIGHT,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 20,
    paddingHorizontal: 20,
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  scrollContent: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  colorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 10,
  },
  nombre: {
    fontWeight: '700',
    flex: 1,
  },
  closeButton: {
    padding: 8,
  },
  closeText: {
    fontSize: 18,
    fontWeight: '600',
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 10,
  },
  metricCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  metricValue: {
    fontWeight: '700',
    marginTop: 4,
  },
  metricLabel: {
    marginTop: 2,
    fontWeight: '500',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    marginBottom: 12,
  },
  infoLabel: {
    fontWeight: '500',
  },
  infoValue: {
    fontWeight: '600',
  },
  enfermedadesSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: '700',
    marginBottom: 10,
  },
  enfermedadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  enfermedadLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  enfermedadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  enfermedadNombre: {
    fontWeight: '500',
  },
  enfermedadCantidad: {
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    marginTop: 8,
    fontWeight: '500',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  secondaryButton: {
    borderWidth: 1.5,
  },
  primaryButton: {},
  secondaryButtonText: {
    fontWeight: '700',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '700',
  },
});
