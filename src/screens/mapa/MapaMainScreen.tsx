import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import MapView, { Polygon, Marker, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

import { useLotes } from '../../hooks/useLotes';
import { LoteBottomSheet } from '../../components/mapa/LoteBottomSheet';
import { MapTypeSelector, MapType } from '../../components/mapa/MapTypeSelector';
import { getColorEnfermedad } from '../../types/geo';
import { calcularCentroide, calcularBoundingBox } from '../../utils/geoUtils';
import { useAccesibilidad } from '../../contexts/AccesibilidadContext';
import { Theme } from '../../constants/theme';

/**
 * Pantalla principal del módulo de Mapas.
 *
 * Visualiza:
 * - Ubicación actual del agricultor.
 * - Todos los lotes registrados como Polygons con colores diferenciados.
 * - Marcadores de detecciones de enfermedades con colores por tipo.
 * - Bottom Sheet al tocar un lote con estadísticas completas.
 * - FAB para crear nuevo lote y selector de tipo de mapa.
 */
export const MapaMainScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { colores, escalaTexto } = useAccesibilidad();

  const mapRef = useRef<MapView>(null);
  const [mapType, setMapType] = useState<MapType>('hybrid');
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [initialRegionSet, setInitialRegionSet] = useState(false);

  const {
    lotes,
    loteSeleccionado,
    cargando,
    error,
    cargarLotes,
    seleccionarLote,
    deseleccionarLote,
  } = useLotes();

  // Cargar lotes cada vez que la pantalla recibe foco
  useFocusEffect(
    useCallback(() => {
      cargarLotes();
    }, [cargarLotes])
  );

  // Obtener ubicación del usuario y centrar el mapa
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    })();
  }, []);

  // Centrar el mapa en la ubicación del usuario o en los lotes existentes
  useEffect(() => {
    if (initialRegionSet) return;

    if (lotes.length > 0 && mapRef.current) {
      // Centrar en todos los lotes
      const allCoords = lotes.flatMap((l) =>
        l.coordenadas.map((c) => ({ latitude: c.latitud, longitude: c.longitud }))
      );
      if (allCoords.length > 0) {
        mapRef.current.fitToCoordinates(allCoords, {
          edgePadding: { top: 80, right: 40, bottom: 200, left: 40 },
          animated: true,
        });
        setInitialRegionSet(true);
      }
    }
  }, [lotes, initialRegionSet]);

  /**
   * Al tocar un Polygon, selecciona el lote y hace zoom animado.
   */
  const handlePressPoly = useCallback(
    async (loteId: string, coordenadas: { latitud: number; longitud: number }[]) => {
      await seleccionarLote(loteId);
      setShowBottomSheet(true);

      // Zoom animado al lote seleccionado
      if (mapRef.current && coordenadas.length > 0) {
        const mapCoords = coordenadas.map((c) => ({
          latitude: c.latitud,
          longitude: c.longitud,
        }));
        mapRef.current.fitToCoordinates(mapCoords, {
          edgePadding: { top: 100, right: 60, bottom: 300, left: 60 },
          animated: true,
        });
      }
    },
    [seleccionarLote]
  );

  const handleCloseSheet = useCallback(() => {
    setShowBottomSheet(false);
    deseleccionarLote();
  }, [deseleccionarLote]);

  const handleVerHistorial = useCallback(
    (loteId: string) => {
      setShowBottomSheet(false);
      navigation.navigate('HistorialInspecciones', { loteId });
    },
    [navigation]
  );

  const handleIniciarInspeccion = useCallback(
    (loteId: string) => {
      setShowBottomSheet(false);
      Alert.alert(
        'Iniciar inspección',
        'Esta funcionalidad se conectará con el módulo de cámara IA.',
        [{ text: 'Entendido' }]
      );
    },
    []
  );

  const handleCentrarUsuario = useCallback(() => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          ...userLocation,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        },
        800
      );
    }
  }, [userLocation]);

  // Región inicial por defecto (Colombia central)
  const defaultRegion: Region = {
    latitude: userLocation?.latitude || 4.7,
    longitude: userLocation?.longitude || -74.0,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}

        mapType={mapType}
        initialRegion={defaultRegion}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass
        rotateEnabled={false}
        toolbarEnabled={false}
      >
        {/* Renderizar Polygons de los lotes */}
        {lotes.map((lote) => (
          <React.Fragment key={lote.id}>
            <Polygon
              coordinates={lote.coordenadas.map((c) => ({
                latitude: c.latitud,
                longitude: c.longitud,
              }))}
              strokeColor={lote.colorHex}
              fillColor={lote.colorHex + '30'}
              strokeWidth={2.5}
              tappable
              onPress={() => handlePressPoly(lote.id, lote.coordenadas)}
            />

            {/* Etiqueta del nombre del lote en el centroide */}
            {lote.coordenadas.length > 0 && (
              <Marker
                coordinate={{
                  latitude: calcularCentroide(lote.coordenadas).latitud,
                  longitude: calcularCentroide(lote.coordenadas).longitud,
                }}
                anchor={{ x: 0.5, y: 0.5 }}
                tracksViewChanges={false}
                onPress={() => handlePressPoly(lote.id, lote.coordenadas)}
              >
                <View style={[styles.loteLabel, { backgroundColor: lote.colorHex }]}>
                  <Text style={styles.loteLabelText} numberOfLines={1}>
                    {lote.nombre}
                  </Text>
                </View>
              </Marker>
            )}

            {/* Marcadores de detecciones dentro del lote */}
            {lote.detecciones.map((det) => (
              <Marker
                key={det.id}
                coordinate={{
                  latitude: det.latitud,
                  longitude: det.longitud,
                }}
                tracksViewChanges={false}
                onPress={() => {
                  Alert.alert(
                    det.enfermedad,
                    `Confianza: ${det.porcentajeConfianza}%\nSeveridad: ${det.severidad || '—'}\nFecha: ${new Date(det.fechaDeteccion).toLocaleDateString('es-CO')}`,
                  );
                }}
              >
                <View
                  style={[
                    styles.deteccionMarker,
                    { backgroundColor: getColorEnfermedad(det.enfermedad) },
                  ]}
                >
                  <Text style={styles.deteccionMarkerIcon}>🦠</Text>
                </View>
              </Marker>
            ))}
          </React.Fragment>
        ))}
      </MapView>

      {/* Selector de tipo de mapa */}
      <MapTypeSelector currentType={mapType} onChangeType={setMapType} />

      {/* FAB: Centrar en ubicación */}
      <TouchableOpacity
        style={[styles.fabLocation, { backgroundColor: colores.surfaceContainerLowest, bottom: 180 + insets.bottom }]}
        onPress={handleCentrarUsuario}
      >
        <Text style={{ fontSize: 20 }}>📍</Text>
      </TouchableOpacity>

      {/* FAB: Crear lote */}
      <TouchableOpacity
        style={[
          styles.fabCreate,
          { backgroundColor: colores.primary, bottom: 120 + insets.bottom },
        ]}
        onPress={() => navigation.navigate('CrearLote')}
      >
        <Text style={styles.fabCreateIcon}>＋</Text>
        <Text style={[styles.fabCreateText, { fontSize: 12 * escalaTexto }]}>
          Crear lote
        </Text>
      </TouchableOpacity>

      {/* Indicador de carga */}
      {cargando && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color={colores.primary} />
        </View>
      )}

      {/* Estado vacío */}
      {!cargando && lotes.length === 0 && !error && (
        <View style={[styles.emptyState, { top: 120 }]}>
          <View style={[styles.emptyCard, { backgroundColor: colores.surfaceContainerLowest }]}>
            <Text style={{ fontSize: 40 }}>🌱</Text>
            <Text style={[styles.emptyTitle, { color: colores.onSurface, fontSize: 16 * escalaTexto }]}>
              Sin lotes registrados
            </Text>
            <Text style={[styles.emptySubtitle, { color: colores.onSurfaceVariant, fontSize: 13 * escalaTexto }]}>
              Presiona "Crear lote" y camina alrededor{'\n'}de tu terreno para delimitarlo.
            </Text>
          </View>
        </View>
      )}

      {/* Bottom Sheet */}
      <LoteBottomSheet
        lote={loteSeleccionado}
        visible={showBottomSheet}
        onClose={handleCloseSheet}
        onVerHistorial={handleVerHistorial}
        onIniciarInspeccion={handleIniciarInspeccion}
      />
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
  loteLabel: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    maxWidth: 120,
  },
  loteLabelText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  deteccionMarker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 4,
  },
  deteccionMarkerIcon: {
    fontSize: 14,
  },
  fabLocation: {
    position: 'absolute',
    right: 24,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 6,
  },
  fabCreate: {
    position: 'absolute',
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 28,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 8,
  },
  fabCreateIcon: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
  },
  fabCreateText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 120,
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  emptyState: {
    position: 'absolute',
    left: 32,
    right: 32,
    alignItems: 'center',
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 24,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyTitle: {
    fontWeight: '700',
    marginTop: 12,
  },
  emptySubtitle: {
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
  },
});
