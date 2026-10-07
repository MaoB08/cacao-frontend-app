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
  FlatList,
} from 'react-native';
import MapView, { Polyline, Polygon } from 'react-native-maps';
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
const VARIEDADES_CACAO = [
  'CCN-51',
  'ICS-1',
  'ICS-39',
  'ICS-60',
  'ICS-95',
  'TSH-565',
  'Criollo',
  'Nacional / Común',
  'Otro',
];

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
  const [variedadModalVisible, setVariedadModalVisible] = useState(false);
  const [showCrearFincaModal, setShowCrearFincaModal] = useState(false);
  const [nuevaFincaNombre, setNuevaFincaNombre] = useState('');
  const [nuevaFincaDepto, setNuevaFincaDepto] = useState('');
  const [nuevaFincaMuni, setNuevaFincaMuni] = useState('');
  const [creandoFinca, setCreandoFinca] = useState(false);
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

  const handleCrearFinca = useCallback(async () => {
    if (!nuevaFincaNombre.trim()) {
      Alert.alert('Campo requerido', 'Ingresa el nombre de la finca.');
      return;
    }
    try {
      setCreandoFinca(true);
      const nueva = await fincaService.crear({
        nombre: nuevaFincaNombre.trim(),
        departamento: nuevaFincaDepto.trim() || undefined,
        municipio: nuevaFincaMuni.trim() || undefined,
      });
      setFincas((prev) => [...prev, nueva]);
      setFincaSeleccionada(nueva);
      setShowCrearFincaModal(false);
      setNuevaFincaNombre('');
      setNuevaFincaDepto('');
      setNuevaFincaMuni('');
      Alert.alert('✅ Finca registrada', `La finca "${nueva.nombre}" fue creada exitosamente.`);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'No se pudo crear la finca');
    } finally {
      setCreandoFinca(false);
    }
  }, [nuevaFincaNombre, nuevaFincaDepto, nuevaFincaMuni]);

  const handleIniciar = useCallback(async () => {
    if (!fincaSeleccionada) {
      Alert.alert(
        'Sin finca asignada',
        'Necesitas registrar al menos una finca antes de delimitar un lote.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Crear Finca', onPress: () => setShowCrearFincaModal(true) },
        ]
      );
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

      {/* Badge / Selector de finca */}
      <TouchableOpacity
        style={[
          styles.fincaBadge,
          {
            top: insets.top + 12,
            backgroundColor: colores.surfaceContainerLowest,
            borderColor: colores.outlineVariant,
          },
        ]}
        onPress={() => setShowCrearFincaModal(true)}
      >
        <Text
          numberOfLines={1}
          style={[styles.fincaBadgeText, { color: colores.onSurface, fontSize: 13 * escalaTexto }]}
        >
          🏡 {fincaSeleccionada ? fincaSeleccionada.nombre : '+ Registrar finca'}
        </Text>
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

            <TouchableOpacity
              style={[
                styles.selectWrapper,
                {
                  borderColor: colores.outlineVariant,
                  backgroundColor: colores.surfaceContainer,
                  marginBottom: 16,
                },
              ]}
              onPress={() => setVariedadModalVisible(true)}
            >
              <Text
                style={[
                  styles.selectText,
                  {
                    color: variedadCacao ? colores.onSurface : colores.outline,
                    fontSize: 15 * escalaTexto,
                  },
                ]}
              >
                {variedadCacao || 'Variedad de cacao (opcional)'}
              </Text>
              <Text style={{ color: colores.outline, fontSize: 12 }}>▼</Text>
            </TouchableOpacity>

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

      {/* Modal Selector de Variedad */}
      <Modal visible={variedadModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colores.surfaceContainerLowest, maxHeight: '60%' }]}>
            <Text style={[styles.modalTitle, { color: colores.primary, fontSize: 18 * escalaTexto, marginVertical: 15, textAlign: 'center', fontWeight: 'bold' }]}>
              Variedades de Cacao en Colombia
            </Text>
            <FlatList
              data={VARIEDADES_CACAO}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setVariedadCacao(item);
                    setVariedadModalVisible(false);
                  }}
                >
                  <Text style={[styles.modalItemText, { color: colores.onSurface, fontSize: 16 * escalaTexto }]}>
                    {item}
                  </Text>
                  {variedadCacao === item && <Text style={{ color: colores.primary, fontWeight: 'bold', fontSize: 18 }}>✓</Text>}
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={[styles.modalSeparator, { backgroundColor: colores.outlineVariant }]} />}
            />
            <TouchableOpacity
              style={[styles.modalCloseButton, { backgroundColor: colores.surfaceContainer }]}
              onPress={() => setVariedadModalVisible(false)}
            >
              <Text style={{ color: colores.secondary, fontWeight: '700', fontSize: 16 * escalaTexto }}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal Crear Finca */}
      <Modal visible={showCrearFincaModal} transparent animationType="slide">
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={[styles.modalContent, { backgroundColor: colores.surfaceContainerLowest }]}>
            <Text style={[styles.modalTitle, { color: colores.onSurface, fontSize: 20 * escalaTexto }]}>
              🏡 Registrar Finca
            </Text>
            <Text style={[styles.modalSubtitle, { color: colores.onSurfaceVariant, fontSize: 13 * escalaTexto }]}>
              Ingresa los datos de tu finca para poder asociarle lotes.
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
              placeholder="Nombre de la finca (ej: La Esmeralda)"
              placeholderTextColor={colores.outline}
              value={nuevaFincaNombre}
              onChangeText={setNuevaFincaNombre}
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
              placeholder="Departamento (ej: Santander)"
              placeholderTextColor={colores.outline}
              value={nuevaFincaDepto}
              onChangeText={setNuevaFincaDepto}
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
              placeholder="Municipio (ej: San Vicente de Chucurí)"
              placeholderTextColor={colores.outline}
              value={nuevaFincaMuni}
              onChangeText={setNuevaFincaMuni}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, { borderColor: colores.outline }]}
                onPress={() => setShowCrearFincaModal(false)}
                disabled={creandoFinca}
              >
                <Text style={[styles.modalButtonText, { color: colores.onSurfaceVariant, fontSize: 14 * escalaTexto }]}>
                  Cancelar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colores.primary }]}
                onPress={handleCrearFinca}
                disabled={creandoFinca}
              >
                {creandoFinca ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={[styles.modalButtonText, { color: '#fff', fontSize: 14 * escalaTexto }]}>
                    💾 Guardar Finca
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
    left: 24,
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
    paddingHorizontal: 24,
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
  selectWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    height: 56,
  },
  selectText: {
    fontWeight: '500',
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  modalItemText: {
    fontWeight: '500',
  },
  modalSeparator: {
    height: 1,
  },
  modalCloseButton: {
    borderRadius: 14,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  fincaBadge: {
    position: 'absolute',
    left: 70,
    right: 24,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 16,
    justifyContent: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  fincaBadgeText: {
    fontWeight: '600',
  },
});
