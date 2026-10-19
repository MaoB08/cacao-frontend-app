import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { VisitasScreen } from '../screens/VisitasScreen';
import { DetalleVisitaScreen } from '../screens/DetalleVisitaScreen';
import { ProgramarVisitaScreen } from '../screens/ProgramarVisitaScreen';
import { VisitaEnCursoScreen } from '../screens/VisitaEnCursoScreen';

const Stack = createStackNavigator();

export const VisitasStackNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="VisitasMain" component={VisitasScreen} />
      <Stack.Screen name="DetalleVisita" component={DetalleVisitaScreen} />
      <Stack.Screen name="ProgramarVisita" component={ProgramarVisitaScreen} />
      <Stack.Screen name="VisitaEnCurso" component={VisitaEnCursoScreen} />
    </Stack.Navigator>
  );
};
