import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAccesibilidad } from '../contexts/AccesibilidadContext';
import { ChevronLeftIcon } from '../components/Icons';
import { PagosVentasScreen } from './PagosVentasScreen';

export const AyudaCategoriaScreen = ({ route, navigation }: any) => {
  const { categoriaNombre } = route.params || { categoriaNombre: 'Ayuda' };
  const { escalaTexto, colores, botonesGrandes } = useAccesibilidad();

  // Redirección inteligente a la pantalla de Pagos y Ventas
  if (categoriaNombre && categoriaNombre.toLowerCase().includes('pago')) {
    return <PagosVentasScreen navigation={navigation} />;
  }

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
          {categoriaNombre}
        </Text>
        <View style={{ width: 40 }} />
      </View>
      <View style={styles.content}>
        <Text style={[styles.placeholderText, { fontSize: getScaledFont(20), color: colores.primary }]}>
          {categoriaNombre}
        </Text>
        <Text style={[styles.subtext, { fontSize: getScaledFont(14), color: colores.onSurfaceVariant }]}>
          Artículos y tutoriales próximamente en la siguiente versión
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
