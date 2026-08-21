import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import MapView, { Polyline, Polygon, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { useGpsTracker } from '../../hooks/useGpsTracker';
import { GpsStatsOverlay } from '../../components/mapa/GpsStatsOverlay';
import { loteService } from '../../services/loteService';
import { fincaService } from '../../services/fincaService';
import { Finca, Coordenada } from '../../types/geo';
import { useAccesibilidad } from '../../contexts/AccesibilidadContext';
import { Theme } from '../../constants/theme';

/**
 * Pantalla de delimitación de terreno estilo Strava.
 *
 * Flujo:
 * 1. "Iniciar recorrido" → comienza el rastreo GPS
 * 2. El agricultor camina alrededor de su lote
 * 3. Se dibuja un Polyline en tiempo real
 * 4. "Finalizar recorrido" → cierra el Polygon
 * 5. Modal: asignar nombre del lote → guardar en backend
 * 6. Regresa al mapa principal con el lote visible
 */
export const CrearLoteScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { colores, escalaTexto } = useAccesibilidad();
  const mapRef = useRef<MapView>(null);

  const tracker = useGpsTracker();

  const [fincas, setFincas] = useState<Finca[]>([]);
  const [fincaSeleccionada, setFincaSeleccionada] = useState<Finca | null>(null);
  const [coordenadasFinales, setCoordenadasFinales] = useState<Coordenada[] | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [nombreLote, setNombreLote] = useState('');
  const [variedadCacao, setVariedadCacao] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  // Cargar fincas del usuario
  useEffect(() => {
    (async () => {
      try {
        const data = await fincaService.listar();
        setFincas(data);
        if (data.length > 0) {
          setFincaSeleccionada(data[0]);
        }
      } catch (err) {
        console.error('Error cargando fincas:', err);
      }

      // Obtener ubicación inicial
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setUserLocation({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
      }
    })();
  }, []);

  // Seguir la posición del usuario en el mapa durante el rastreo
  useEffect(() => {
    if (tracker.estado === 'tracking' && tracker.coordenadas.length > 0 && mapRef.current) {
      const ultima = tracker.coordenadas[tracker.coordenadas.length - 1];
      mapRef.current.animateToRegion(
        {
          latitude: ultima.latitud,
          longitude: ultima.longitud,
          latitudeDelta: 0.003,
          longitudeDelta: 0.003,
        },
        500
      );
    }
  }, [tracker.coordenadas.length, tracker.estado]);

  const handleIniciar = useCallback(async () => {
    if (!fincaSeleccionada) {
      Alert.alert('Sin finca', 'Primero debes crear una finca para poder registrar lotes.');
      return;
    }

    try {
      await tracker.iniciarRecorrido();
    } catch (err: any) {
      Alert.alert('Error GPS', err.message);
    }
  }, [tracker, fincaSeleccionada]);

  const handleFinalizar = useCallback(() => {
    if (tracker.coordenadas.length < 3) {
      Alert.alert(
        'Puntos insuficientes',
        'Necesitas al menos 3 puntos GPS para delimitar un lote. Sigue caminando alrededor del terreno.'
      );
      return;
    }

    const simplificadas = tracker.finalizarRecorrido();
    setCoordenadasFinales(simplificadas);
    setShowModal(true);
  }, [tracker]);

  const handleGuardarLote = useCallback(async () => {
    if (!nombreLote.trim()) {
      Alert.alert('Nombre requerido', 'Ingresa un nombre para identificar este lote.');
      return;
    }

    if (!fincaSeleccionada || !coordenadasFinales) return;

    try {
      setGuardando(true);
      await loteService.crear({
        fincaId: fincaSeleccionada.id,
        nombre: nombreLote.trim(),
        variedadCacao: variedadCacao.trim() || undefined,
        coordenadas: coordenadasFinales,
      });

      setShowModal(false);
      Alert.alert('✅ Lote creado', `El lote "${nombreLote}" ha sido registrado exitosamente.`, [
        { text: 'Ver en mapa', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      const msg = err?.mensaje || err?.message || 'Error al guardar el lote';
      Alert.alert('Error', msg);
    } finally {
      setGuardando(false);
    }
  }, [nombreLote, variedadCacao, fincaSeleccionada, coordenadasFinales, navigation]);

  const handleCancelar = useCallback(() => {
    Alert.alert('¿Cancelar recorrido?', 'Se perderán todas las coordenadas recolectadas.', [
      { text: 'Continuar', style: 'cancel' },
      {
        text: 'Cancelar',
        style: 'destructive',
        onPress: () => {
          tracker.cancelarRecorrido();
          navigation.goBack();
        },
      },
    ]);
  }, [tracker, navigation]);

  const polylineCoords = tracker.coordenadas.map((c) => ({
    latitude: c.latitud,
    longitude: c.longitud,
  }));

  const defaultRegion = {
    latitude: userLocation?.latitude || 4.7,
    longitude: userLocation?.longitude || -74.0,
    latitudeDelta: 0.005,
    longitudeDelta: 0.005,
  };

  return (
    <View style={styles.container}>
      {/* Mapa */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        mapType="hybrid"
        initialRegion={defaultRegion}
        showsUserLocation
        showsMyLocationButton={false}
        followsUserLocation={tracker.estado === 'tracking'}
      >
        {/* Polyline del recorrido en progreso */}
        {polylineCoords.length > 1 && (
          <Polyline
            coordinates={polylineCoords}
            strokeColor={Theme.colors.primary}
            strokeWidth={4}
            lineDashPattern={[0]}
          />
        )}

        {/* Polygon de vista previa cuando se finaliza */}
        {coordenadasFinales && coordenadasFinales.length >= 3 && (
          <Polygon
            coordinates={coordenadasFinales.map((c) => ({
              latitude: c.latitud,
              longitude: c.longitud,
            }))}
            strokeColor={Theme.colors.primary}
            fillColor={Theme.colors.primary + '40'}
            strokeWidth={3}
          />
        )}
      </MapView>

      {/* Stats overlay durante el rastreo */}
      {(tracker.estado === 'tracking' || tracker.estado === 'paused') && (
        <GpsStatsOverlay tracker={tracker} />
      )}

      {/* Botón regresar */}
      <TouchableOpacity
        style={[styles.backButton, { top: insets.top + 12 }]}
        onPress={tracker.estado === 'idle' ? () => navigation.goBack() : handleCancelar}
      >
        <Text style={styles.backIcon}>←</Text>
      </TouchableOpacity>

      {/* Panel de control inferior */}
      <View
        style={[
          styles.controlPanel,
          {
            backgroundColor: colores.surfaceContainerLowest,
            paddingBottom: insets.bottom + 16,
          },
        ]}
      >
        {/* Estado: Idle → Botón iniciar */}
        {tracker.estado === 'idle' && (
          <>
            <Text style={[styles.instruction, { color: colores.onSurfaceVariant, fontSize: 14 * escalaTexto }]}>
              Camina alrededor de tu terreno{'\n'}para delimitarlo automáticamente
            </Text>
            <TouchableOpacity
              style={[styles.mainButton, { backgroundColor: colores.primary }]}
              onPress={handleIniciar}
            >
              <Text style={[styles.mainButtonText, { fontSize: 16 * escalaTexto }]}>
                🚶 Iniciar recorrido
              </Text>
            </TouchableOpacity>
          </>
        )}

        {/* Estado: Tracking → Pausar / Finalizar */}
        {tracker.estado === 'tracking' && (
          <View style={styles.trackingControls}>
            <TouchableOpacity
              style={[styles.controlButton, { borderColor: colores.outline }]}
              onPress={tracker.pausarRecorrido}
            >
              <Text style={[styles.controlButtonText, { color: colores.onSurface, fontSize: 14 * escalaTexto }]}>
                ⏸ Pausar
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.controlButton, styles.finishButton, { backgroundColor: colores.primary }]}
              onPress={handleFinalizar}
            >
              <Text style={[styles.controlButtonText, { color: '#fff', fontSize: 14 * escalaTexto }]}>
                ✅ Finalizar recorrido
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Estado: Paused → Reanudar / Finalizar */}
        {tracker.estado === 'paused' && (
          <View style={styles.trackingControls}>
            <TouchableOpacity
              style={[styles.controlButton, { borderColor: colores.outline }]}
              onPress={tracker.reanudarRecorrido}
            >
              <Text style={[styles.controlButtonText, { color: colores.onSurface, fontSize: 14 * escalaTexto }]}>
                ▶ Reanudar
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.controlButton, styles.finishButton, { backgroundColor: colores.primary }]}
              onPress={handleFinalizar}
            >
              <Text style={[styles.controlButtonText, { color: '#fff', fontSize: 14 * escalaTexto }]}>
                ✅ Finalizar recorrido
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Modal de guardado */}
      <Modal visible={showModal} transparent animationType="slide">
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={[styles.modalContent, { backgroundColor: colores.surfaceContainerLowest }]}>
            <Text style={[styles.modalTitle, { color: colores.onSurface, fontSize: 20 * escalaTexto }]}>
              🌿 Nombrar lote
            </Text>
            <Text style={[styles.modalSubtitle, { color: colores.onSurfaceVariant, fontSize: 13 * escalaTexto }]}>
              Tu lote ha sido delimitado exitosamente.{'\n'}Asígnale un nombre para identificarlo.
            </Text>

            <TextInput
              style={[
                styles.input,
                {
                  borderColor: colores.outlineVariant,
                  color: colores.onSurface,
                  fontSize: 15 * escalaTexto,
                },
              ]}
              placeholder="Ej: Lote Norte, Parcela Río..."
              placeholderTextColor={colores.outline}
              value={nombreLote}
              onChangeText={setNombreLote}
              autoFocus
            />

            <TextInput
              style={[
                styles.input,
                {
                  borderColor: colores.outlineVariant,
                  color: colores.onSurface,
                  fontSize: 15 * escalaTexto,
                },
              ]}
              placeholder="Variedad de cacao (opcional)"
              placeholderTextColor={colores.outline}
              value={variedadCacao}
              onChangeText={setVariedadCacao}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, { borderColor: colores.outline }]}
                onPress={() => setShowModal(false)}
                disabled={guardando}
              >
                <Text style={[styles.modalButtonText, { color: colores.onSurfaceVariant, fontSize: 14 * escalaTexto }]}>
                  Cancelar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colores.primary }]}
                onPress={handleGuardarLote}
                disabled={guardando}
              >
                {guardando ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={[styles.modalButtonText, { color: '#fff', fontSize: 14 * escalaTexto }]}>
                    💾 Guardar lote
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  backButton: {
    position: 'absolute',
    left: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  backIcon: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  controlPanel: {
    paddingHorizontal: 20,
    paddingTop: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  instruction: {
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
    fontWeight: '500',
  },
  mainButton: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  mainButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  trackingControls: {
    flexDirection: 'row',
    gap: 12,
  },
  controlButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  finishButton: {
    borderWidth: 0,
  },
  controlButtonText: {
    fontWeight: '700',
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 40,
  },
  modalTitle: {
    fontWeight: '700',
    textAlign: 'center',
  },
  modalSubtitle: {
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
    marginBottom: 24,
  },
  input: {
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 14,
    fontWeight: '500',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  modalButtonText: {
    fontWeight: '700',
  },
});
