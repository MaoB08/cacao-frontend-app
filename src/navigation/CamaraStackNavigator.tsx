import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { CamaraScreen } from '../screens/CamaraScreen';
import { PantallaCargaScreen } from '../screens/PantallaCargaScreen';
import { ResultadoAnalisisScreen } from '../screens/ResultadoAnalisisScreen';
import { ChatExpertoScreen } from '../screens/ChatExpertoScreen';

const Stack = createStackNavigator();

export const CamaraStackNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CamaraMain" component={CamaraScreen} />
      <Stack.Screen name="PantallaCarga" component={PantallaCargaScreen} />
      <Stack.Screen name="ResultadoAnalisis" component={ResultadoAnalisisScreen} />
      <Stack.Screen name="ChatExperto" component={ChatExpertoScreen} />
    </Stack.Navigator>
  );
};
