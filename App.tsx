import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import NetInfo from '@react-native-community/netinfo';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

import { useAuthStore } from './src/store/useAuthStore';
import { LoginScreen } from './src/screens/LoginScreen';
import { RegisterScreen } from './src/screens/RegisterScreen';
import { ForgotPasswordScreen } from './src/screens/ForgotPasswordScreen';
import { ResetPasswordScreen } from './src/screens/ResetPasswordScreen';
import { BottomTabNavigator } from './src/navigation/BottomTabNavigator';
import { OfflineBanner } from './src/components/OfflineBanner';
import { Theme } from './src/constants/theme';

import { useShallow } from 'zustand/react/shallow';
import { AccesibilidadProvider, useAccesibilidad } from './src/contexts/AccesibilidadContext';

const Stack = createStackNavigator();

function AppContent() {
  const { user, isInitializing, loadSession, setConnected } = useAuthStore(
    useShallow((state) => ({
      user: state.user,
      isInitializing: state.isInitializing,
      loadSession: state.loadSession,
      setConnected: state.setConnected,
    }))
  );

  const { colores } = useAccesibilidad();

  // 1. Cargar la sesión desde Secure Store al iniciar la app
  useEffect(() => {
    loadSession();
  }, []);

  // 2. Suscribirse a cambios en la conectividad a Internet
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setConnected(state.isConnected ?? false);
    });

    return () => unsubscribe();
  }, []);

  // Pantalla de carga mientras se recupera la sesión persistida
  if (isInitializing) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colores.background }]}>
        <ActivityIndicator size="large" color={colores.primary} />
      </View>
    );
  }

  const NavigationTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: colores.background,
    },
  };

  return (
    <SafeAreaProvider>
      <NavigationContainer theme={NavigationTheme}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {user ? (
            <Stack.Screen name="MainTabs" component={BottomTabNavigator} />
          ) : (
            <>
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="Register" component={RegisterScreen} />
              <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
              <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
            </>
          )}
        </Stack.Navigator>
        
        <OfflineBanner />
        
        <StatusBar style="dark" translucent backgroundColor="transparent" />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default function App() {
  return (
    <AccesibilidadProvider>
      <AppContent />
    </AccesibilidadProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: Theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
