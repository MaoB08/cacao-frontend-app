import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from '../constants/theme';
import { ChatBubbleIcon, SparklesIcon } from '../components/Icons';
import { useAccesibilidad } from '../contexts/AccesibilidadContext';

export const ChatAgronomoScreen = () => {
  const { colores, escalaTexto } = useAccesibilidad();

  const getScaledFont = (size: number) => size * escalaTexto;

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.container, { backgroundColor: colores.background }]}>
      <View style={styles.content}>
        <View style={[styles.iconCircle, { backgroundColor: colores.surfaceContainer }]}>
          <ChatBubbleIcon color={colores.primary} size={48} />
        </View>

        <Text style={[styles.title, { fontSize: getScaledFont(22), color: colores.primary }]}>
          Canal de Mensajería
        </Text>

        <View style={[styles.badge, { backgroundColor: colores.surfaceContainer }]}>
          <SparklesIcon color={colores.secondary} size={16} />
          <Text style={[styles.badgeText, { fontSize: getScaledFont(12), color: colores.secondary }]}>
            En desarrollo
          </Text>
        </View>

        <Text style={[styles.description, { fontSize: getScaledFont(15), color: colores.onSurfaceVariant }]}>
          La mensajería directa y coordinación técnica con agricultores estará disponible en una próxima actualización.
        </Text>

        <View style={[styles.infoCard, { backgroundColor: colores.surfaceContainerLowest, borderColor: colores.outlineVariant }]}>
          <Text style={[styles.infoCardTitle, { fontSize: getScaledFont(14), color: colores.primary }]}>
            Canal alternativo
          </Text>
          <Text style={[styles.infoCardBody, { fontSize: getScaledFont(13), color: colores.onSurfaceVariant }]}>
            Por el momento, puedes consultar el número de contacto del productor directamente en el detalle de cada visita técnica programada.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Theme.roundness.full,
    marginBottom: 16,
  },
  badgeText: {
    fontWeight: '700',
  },
  description: {
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  infoCard: {
    width: '100%',
    padding: 16,
    borderRadius: Theme.roundness.md,
    borderWidth: 1,
  },
  infoCardTitle: {
    fontWeight: '700',
    marginBottom: 6,
  },
  infoCardBody: {
    lineHeight: 18,
  },
});
