import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { useAuthStore } from '../store/useAuthStore';
import { Theme } from '../constants/theme';
import { FarmerIcon } from '../components/Icons';

import { useShallow } from 'zustand/react/shallow';

export const HomeScreen = () => {
  const { user, clearSession } = useAuthStore(
    useShallow((state) => ({
      user: state.user,
      clearSession: state.clearSession,
    }))
  );

  const handleSignOut = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Está seguro de que desea salir?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Salir', onPress: () => clearSession(), style: 'destructive' }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.card}>
          <View style={{ marginBottom: 12 }}>
            <FarmerIcon color={Theme.colors.primary} size={64} />
          </View>
          <Text style={styles.welcomeText}>¡Bienvenido a CacaoCare!</Text>
          
          <View style={styles.divider} />
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Agricultor:</Text>
            <Text style={styles.infoValue}>{user?.nombre}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Contacto:</Text>
            <Text style={styles.infoValue}>{user?.email}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Rol asignado:</Text>
            <Text style={styles.infoValueBadge}>{user?.rol}</Text>
          </View>

          <View style={styles.fincaBox}>
            <Text style={styles.fincaTitle}>Ubicación Finca Piloto</Text>
            <Text style={styles.fincaDetail}>Finca La Variante • Ocaña, Norte de Santander</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.button} onPress={handleSignOut}>
          <Text style={styles.buttonText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Theme.spacing.marginMobile,
  },
  card: {
    backgroundColor: Theme.colors.surfaceContainerLowest,
    width: '100%',
    padding: 24,
    borderRadius: Theme.roundness.default,
    alignItems: 'center',
    shadowColor: '#5c403a',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 30,
    elevation: 8,
    marginBottom: Theme.spacing.stackLg,
  },
  welcomeEmoji: {
    fontSize: 64,
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: '700',
    color: Theme.colors.primary,
    textAlign: 'center',
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: Theme.colors.outlineVariant,
    marginVertical: 20,
  },
  infoRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: Theme.colors.outline,
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 15,
    color: Theme.colors.onSurface,
    fontWeight: '700',
  },
  infoValueBadge: {
    fontSize: 12,
    color: '#ffffff',
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    fontWeight: '700',
    overflow: 'hidden',
  },
  fincaBox: {
    backgroundColor: Theme.colors.surfaceContainer,
    width: '100%',
    padding: 16,
    borderRadius: Theme.roundness.default,
    marginTop: 20,
  },
  fincaTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.colors.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  fincaDetail: {
    fontSize: 14,
    color: Theme.colors.onSurface,
    fontWeight: '600',
  },
  button: {
    backgroundColor: Theme.colors.secondary,
    width: '100%',
    height: 56,
    borderRadius: Theme.roundness.full,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#5c403a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
  },
});
