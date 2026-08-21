import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import { MapaMainScreen } from '../screens/mapa/MapaMainScreen';
import { CrearLoteScreen } from '../screens/mapa/CrearLoteScreen';
import { HistorialInspeccionesScreen } from '../screens/mapa/HistorialInspeccionesScreen';
import { DetalleInspeccionScreen } from '../screens/mapa/DetalleInspeccionScreen';

export type MapaStackParamList = {
  MapaPrincipal: undefined;
  CrearLote: undefined;
  HistorialInspecciones: { loteId: string };
  DetalleInspeccion: { inspeccionId: string };
};

const Stack = createStackNavigator<MapaStackParamList>();

/**
 * Stack Navigator del módulo de Mapas.
 *
 * Pantallas:
 * - MapaPrincipal: Mapa interactivo con lotes y detecciones
 * - CrearLote: Delimitación de terreno estilo Strava
 * - HistorialInspecciones: Historial de inspecciones del lote
 * - DetalleInspeccion: Detalle de una inspección con sus detecciones
 */
export const MapaStackNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MapaPrincipal" component={MapaMainScreen} />
      <Stack.Screen name="CrearLote" component={CrearLoteScreen} />
      <Stack.Screen name="HistorialInspecciones" component={HistorialInspeccionesScreen} />
      <Stack.Screen name="DetalleInspeccion" component={DetalleInspeccionScreen} />
    </Stack.Navigator>
  );
};
