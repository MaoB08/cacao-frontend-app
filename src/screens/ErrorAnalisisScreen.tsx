import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAccesibilidad } from '../contexts/AccesibilidadContext';
import { CultivIALogo } from '../components/CultivIALogo';

export const ErrorAnalisisScreen = ({ route, navigation }: any) => {
  const { errorMessage, imageUri } = route.params || {};
  const { colores, escalaTexto, botonesGrandes } = useAccesibilidad();

  const getScaledFont = (size: number) => size * escalaTexto;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colores.background }]}>
      <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        {/* Header / Logo */}
        <View style={styles.header}>
          <CultivIALogo size={60} />
        </View>

        {/* Card de Error */}
        <View style={[styles.errorCard, { backgroundColor: colores.surfaceContainerLowest, borderColor: colores.outlineVariant }]}>
          <View style={styles.iconCircle}>
            <Text style={styles.errorIcon}>⚠️</Text>
          </View>

          <Text style={[styles.title, { fontSize: getScaledFont(22), color: colores.onSurface }]}>
            Análisis no disponible
          </Text>

          <Text style={[styles.message, { fontSize: getScaledFont(15), color: colores.onSurfaceVariant }]}>
            {errorMessage ||
              'No fue posible procesar la fotografía con la red neuronal en este momento. Por favor verifique su conexión a internet y vuelva a intentarlo.'}
          </Text>

          {/* Miniatura de la imagen enviada si está disponible */}
          {imageUri && (
            <View style={styles.thumbnailContainer}>
              <Image source={{ uri: imageUri }} style={styles.thumbnail} resizeMode="cover" />
              <Text style={[styles.thumbnailLabel, { fontSize: getScaledFont(12), color: colores.outline }]}>
                Fotografía capturada
              </Text>
            </View>
          )}

          {/* Información de transparencia agronómica */}
          <View style={styles.infoBox}>
            <Text style={[styles.infoTitle, { fontSize: getScaledFont(13) }]}>
              🔬 Compromiso de precisión agronómica
            </Text>
            <Text style={[styles.infoText, { fontSize: getScaledFont(12) }]}>
              CultivIA no genera diagnósticos simulados o inventados. Si el clasificador neuronal o el enlace de datos no responden con certeza, se informa transparentemente para evitar decisiones de manejo fitosanitario erróneas en su parcela.
            </Text>
          </View>
        </View>

        {/* Acciones */}
        <View style={styles.actionsContainer}>
          {imageUri && (
            <TouchableOpacity
              style={[
                styles.primaryButton,
                botonesGrandes && styles.largeButton,
                { backgroundColor: '#2e7d32' },
              ]}
              onPress={() => navigation.replace('PantallaCarga', { imageUri })}
              activeOpacity={0.8}
            >
              <Text style={[styles.primaryButtonText, { fontSize: getScaledFont(16) }]}>
                🔄 Reintentar análisis
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              styles.secondaryButton,
              botonesGrandes && styles.largeButton,
              { borderColor: '#2e7d32', backgroundColor: colores.surfaceContainerLowest },
            ]}
            onPress={() => navigation.navigate('CamaraMain')}
            activeOpacity={0.8}
          >
            <Text style={[styles.secondaryButtonText, { fontSize: getScaledFont(15), color: '#2e7d32' }]}>
              📸 Tomar nueva fotografía
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.outlineButton, botonesGrandes && styles.largeButton]}
            onPress={() => navigation.navigate('ChatExperto')}
            activeOpacity={0.8}
          >
            <Text style={[styles.outlineButtonText, { fontSize: getScaledFont(14), color: colores.onSurfaceVariant }]}>
              💬 Consultar a un agrónomo experto
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
    alignItems: 'center',
  },
  header: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  errorCard: {
    width: '100%',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
  },
  iconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#fff3e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  errorIcon: {
    fontSize: 34,
  },
  title: {
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  thumbnailContainer: {
    alignItems: 'center',
    marginVertical: 12,
  },
  thumbnail: {
    width: 120,
    height: 120,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  thumbnailLabel: {
    marginTop: 6,
  },
  infoBox: {
    marginTop: 16,
    padding: 14,
    backgroundColor: '#f1f8e9',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#558b2f',
    width: '100%',
  },
  infoTitle: {
    fontWeight: '700',
    color: '#33691e',
    marginBottom: 4,
  },
  infoText: {
    color: '#558b2f',
    lineHeight: 18,
  },
  actionsContainer: {
    width: '100%',
    marginTop: 24,
    gap: 12,
  },
  primaryButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2e7d32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  secondaryButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  secondaryButtonText: {
    fontWeight: '700',
  },
  outlineButton: {
    width: '100%',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineButtonText: {
    fontWeight: '600',
  },
  largeButton: {
    paddingVertical: 18,
  },
});
