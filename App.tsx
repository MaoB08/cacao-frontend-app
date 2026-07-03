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

const Stack = createStackNavigator();

const NavigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: Theme.colors.background,
  },
};

export default function App() {
  const { user, isInitializing, loadSession, setConnected } = useAuthStore(
    useShallow((state) => ({
      user: state.user,
      isInitializing: state.isInitializing,
      loadSession: state.loadSession,
      setConnected: state.setConnected,
    }))
  );

  // 1. Cargar la sesión desde Secure Store al iniciar la app
  useEffect(() => {
    loadSession();
  }, []);

  // 2. Suscribirse a cambios en la conectividad a Internet
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      // NetInfo devuelve null/false si no hay internet
      setConnected(state.isConnected ?? false);
    });

    return () => unsubscribe();
  }, []);

  // Pantalla de carga mientras se recupera la sesión persistida
  if (isInitializing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Theme.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer theme={NavigationTheme}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {user ? (
            // Ruta Protegida: El usuario ya inició sesión → Tabs
            <Stack.Screen name="MainTabs" component={BottomTabNavigator} />
          ) : (
            // Rutas de Autenticación
            <>
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="Register" component={RegisterScreen} />
              <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
              <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
            </>
          )}
        </Stack.Navigator>
        
        {/* Banner de conectividad global */}
        <OfflineBanner />
        
        <StatusBar style="dark" />
      </NavigationContainer>
    </SafeAreaProvider>
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
