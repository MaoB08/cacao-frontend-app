import React from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuthStore } from '../store/useAuthStore';
import { Theme } from '../constants/theme';
import {
  HomeIcon, CameraIcon, MapIcon, BookIcon, ProfileIcon,
} from '../components/Icons';

import { DashboardAgricultorScreen } from '../screens/DashboardAgricultorScreen';
import { DashboardExpertoScreen } from '../screens/DashboardExpertoScreen';
import { PlaceholderScreen } from '../screens/PlaceholderScreen';
import { HomeScreen } from '../screens/HomeScreen';

import { useShallow } from 'zustand/react/shallow';

const Tab = createBottomTabNavigator();

// Wrapper components for placeholder tabs
const CamaraTab = () => <PlaceholderScreen title="Cámara" icon="📷" />;
const MapaTab = () => <PlaceholderScreen title="Mapa" icon="🗺️" />;
const CatalogoTab = () => <PlaceholderScreen title="Catálogo" icon="📖" />;

export const BottomTabNavigator = () => {
  const { user } = useAuthStore(
    useShallow((state) => ({ user: state.user }))
  );

  const isExperto = user?.rol === 'EXPERTO';

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: Theme.colors.primary,
        tabBarInactiveTintColor: Theme.colors.outline,
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
      }}
    >
      <Tab.Screen
        name="Casa"
        component={isExperto ? DashboardExpertoScreen : DashboardAgricultorScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrapper, focused && styles.activeIconWrapper]}>
              <HomeIcon color={focused ? '#ffffff' : color} size={20} />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Cámara"
        component={CamaraTab}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrapper, focused && styles.activeIconWrapper]}>
              <CameraIcon color={focused ? '#ffffff' : color} size={20} />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Mapa"
        component={MapaTab}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrapper, focused && styles.activeIconWrapper]}>
              <MapIcon color={focused ? '#ffffff' : color} size={20} />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Catálogo"
        component={CatalogoTab}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrapper, focused && styles.activeIconWrapper]}>
              <BookIcon color={focused ? '#ffffff' : color} size={20} />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Perfil"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrapper, focused && styles.activeIconWrapper]}>
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
    height: Platform.OS === 'ios' ? 92 : 72,
    paddingTop: 6,
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
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
