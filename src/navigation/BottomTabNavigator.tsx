import React from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuthStore } from '../store/useAuthStore';
import { Theme } from '../constants/theme';
import {
  HomeIcon, CameraIcon, MapIcon, ProfileIcon, DollarIcon,
} from '../components/Icons';

import { DashboardAgricultorScreen } from '../screens/DashboardAgricultorScreen';
import { DashboardExpertoScreen } from '../screens/DashboardExpertoScreen';
import { PagosVentasScreen } from '../screens/PagosVentasScreen';
import { PerfilStackNavigator } from './PerfilStackNavigator';
import { CamaraStackNavigator } from './CamaraStackNavigator';
import { MapaStackNavigator } from './MapaStackNavigator';

import { useShallow } from 'zustand/react/shallow';
import { useAccesibilidad } from '../contexts/AccesibilidadContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const Tab = createBottomTabNavigator();

export const BottomTabNavigator = () => {
  const { user } = useAuthStore(
    useShallow((state) => ({ user: state.user }))
  );
  const { colores, escalaTexto } = useAccesibilidad();
  const insets = useSafeAreaInsets();

  const isExperto = user?.rol === 'EXPERTO';

  const bottomPadding = insets.bottom > 0 ? insets.bottom : 12;
  const tabBarHeight = 60 + bottomPadding;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: [
          styles.tabBar,
          {
            backgroundColor: colores.surfaceContainerLowest,
            borderTopColor: colores.outlineVariant,
            height: tabBarHeight,
            paddingBottom: bottomPadding,
          }
        ],
        tabBarActiveTintColor: colores.primary,
        tabBarInactiveTintColor: colores.outline,
        tabBarLabelStyle: [
          styles.tabLabel,
          {
            fontSize: 10 * escalaTexto,
          }
        ],
        tabBarItemStyle: styles.tabItem,
      }}
    >
      <Tab.Screen
        name="Casa"
        component={isExperto ? DashboardExpertoScreen : DashboardAgricultorScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View 
              style={[
                styles.iconWrapper, 
                focused && [styles.activeIconWrapper, { backgroundColor: colores.primary, shadowColor: colores.primary }]
              ]}
            >
              <HomeIcon color={focused ? '#ffffff' : color} size={20} />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Cámara"
        component={CamaraStackNavigator}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View 
              style={[
                styles.iconWrapper, 
                focused && [styles.activeIconWrapper, { backgroundColor: colores.primary, shadowColor: colores.primary }]
              ]}
            >
              <CameraIcon color={focused ? '#ffffff' : color} size={20} />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Mapa"
        component={MapaStackNavigator}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View 
              style={[
                styles.iconWrapper, 
                focused && [styles.activeIconWrapper, { backgroundColor: colores.primary, shadowColor: colores.primary }]
              ]}
            >
              <MapIcon color={focused ? '#ffffff' : color} size={20} />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Ventas"
        component={PagosVentasScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View 
              style={[
                styles.iconWrapper, 
                focused && [styles.activeIconWrapper, { backgroundColor: colores.primary, shadowColor: colores.primary }]
              ]}
            >
              <DollarIcon color={focused ? '#ffffff' : color} size={20} />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Perfil"
        component={PerfilStackNavigator}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View 
              style={[
                styles.iconWrapper, 
                focused && [styles.activeIconWrapper, { backgroundColor: colores.primary, shadowColor: colores.primary }]
              ]}
            >
              <ProfileIcon color={focused ? '#ffffff' : color} size={20} />
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Theme.colors.surfaceContainerLowest,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.outlineVariant,
    paddingTop: 6,
    shadowColor: '#5c403a',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 12,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  tabItem: {
    paddingVertical: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrapper: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  activeIconWrapper: {
    backgroundColor: Theme.colors.primary,
    shadowColor: Theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
});
