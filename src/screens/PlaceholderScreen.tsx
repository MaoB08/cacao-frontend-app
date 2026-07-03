import React from 'react';
import { StyleSheet, Text, View, SafeAreaView, Platform } from 'react-native';
import { Theme } from '../constants/theme';

interface PlaceholderScreenProps {
  title: string;
  icon: string;
}

export const PlaceholderScreen = ({ title, icon }: PlaceholderScreenProps) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.icon}>{icon}</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>Esta sección estará disponible próximamente</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>En Desarrollo</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
    paddingTop: Platform.OS === 'android' ? 24 : 0,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Theme.spacing.marginMobile,
  },
  icon: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Theme.colors.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: Theme.colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: 24,
  },
  badge: {
    backgroundColor: Theme.colors.surfaceContainer,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Theme.roundness.full,
    borderWidth: 1,
    borderColor: Theme.colors.outlineVariant,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: Theme.colors.outline,
    letterSpacing: 0.5,
  },
});
