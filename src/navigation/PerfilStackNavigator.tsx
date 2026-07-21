import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { PerfilScreen } from '../screens/PerfilScreen';
import { NotificacionesScreen } from '../screens/NotificacionesScreen';
import { DiagnosticosResumenScreen } from '../screens/DiagnosticosResumenScreen';
import { ChatExpertoScreen } from '../screens/ChatExpertoScreen';
import { ConfiguracionScreen } from '../screens/ConfiguracionScreen';
import { CentroAyudaScreen } from '../screens/CentroAyudaScreen';
import { AyudaCategoriaScreen } from '../screens/AyudaCategoriaScreen';

const Stack = createStackNavigator();

export const PerfilStackNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PerfilMain" component={PerfilScreen} />
      <Stack.Screen name="Notificaciones" component={NotificacionesScreen} />
      <Stack.Screen name="DiagnosticosResumen" component={DiagnosticosResumenScreen} />
      <Stack.Screen name="ChatExperto" component={ChatExpertoScreen} />
      <Stack.Screen name="Configuracion" component={ConfiguracionScreen} />
      <Stack.Screen name="CentroAyuda" component={CentroAyudaScreen} />
      <Stack.Screen name="AyudaCategoria" component={AyudaCategoriaScreen} />
    </Stack.Navigator>
  );
};
