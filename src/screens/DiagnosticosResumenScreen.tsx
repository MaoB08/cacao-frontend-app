import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAccesibilidad } from '../contexts/AccesibilidadContext';
import { ChevronLeftIcon } from '../components/Icons';

export const DiagnosticosResumenScreen = ({ navigation }: any) => {
  const { escalaTexto, colores, botonesGrandes } = useAccesibilidad();

  const getScaledFont = (size: number) => size * escalaTexto;

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.container, { backgroundColor: colores.background }]}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={[
            styles.backBtn, 
            { 
              backgroundColor: colores.surfaceContainer,
              height: botonesGrandes ? 48 : 40,
              width: botonesGrandes ? 48 : 40,
              borderRadius: botonesGrandes ? 24 : 20,
            }
          ]} 
          onPress={() => navigation.goBack()}
        >
          <ChevronLeftIcon color={colores.primary} size={24} />
        </TouchableOpacity>
        <Text style={[styles.title, { fontSize: getScaledFont(18), color: colores.onSurface }]}>
          Estado de Salud
        </Text>
        <View style={{ width: 40 }} />
      </View>
      <View style={styles.content}>
        <Text style={[styles.placeholderText, { fontSize: getScaledFont(20), color: colores.primary }]}>
          Historial de Salud
        </Text>
        <Text style={[styles.subtext, { fontSize: getScaledFont(14), color: colores.onSurfaceVariant }]}>
          Detalles y evolución de diagnósticos próximamente
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  backBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontWeight: '700' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  placeholderText: { fontWeight: '700', marginBottom: 8 },
  subtext: { textAlign: 'center' },
});
