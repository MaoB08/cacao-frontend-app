import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useAccesibilidad } from '../contexts/AccesibilidadContext';
import { useDiagnosticoStore } from '../store/useDiagnosticoStore';
import {
  CameraIcon,
  ImageIcon,
  SparklesIcon,
  CacaoIcon,
} from '../components/Icons';

export const CamaraScreen = ({ navigation }: any) => {
  const { escalaTexto, colores, botonesGrandes } = useAccesibilidad();
  const {
    currentImageUri,
    setCurrentImageUri,
    modoSimulacion,
    setModoSimulacion,
    ejecutarAnalisis,
  } = useDiagnosticoStore();

  const [localImage, setLocalImage] = useState<string | null>(currentImageUri);

  const getScaledFont = (size: number) => size * escalaTexto;

  // Abrir la Cámara nativa del dispositivo
  const tomarFoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permiso requerido', 'Se requiere acceso a la cámara para capturar fotos de las mazorcas.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.9,
        allowsEditing: true,
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets[0]?.uri) {
        const uri = result.assets[0].uri;
        setLocalImage(uri);
        setCurrentImageUri(uri);
      }
    } catch (error) {
      console.error('Error al tomar foto:', error);
      Alert.alert('Error', 'No se pudo abrir la cámara en este dispositivo.');
    }
  };

  // Seleccionar Imagen desde la Galería
  const seleccionarGaleria = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permiso requerido', 'Se requiere acceso a la galería para seleccionar imágenes de cacao.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.9,
        allowsEditing: true,
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets[0]?.uri) {
        const uri = result.assets[0].uri;
        setLocalImage(uri);
        setCurrentImageUri(uri);
      }
    } catch (error) {
      console.error('Error al seleccionar imagen:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen de la galería.');
    }
  };

  // Iniciar flujo de envío a la Red Neuronal
  const iniciarAnalisisIA = async () => {
    if (!localImage) {
      Alert.alert('Atención', 'Por favor primero toma o selecciona una imagen de la mazorca.');
      return;
    }
    // Redirige inmediatamente a la Pantalla de Carga
    navigation.navigate('PantallaCarga', { imageUri: localImage });
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.container, { backgroundColor: colores.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.logoBadge, { backgroundColor: colores.surfaceContainer }]}>
            <CacaoIcon color={colores.primary} size={28} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { fontSize: getScaledFont(20), color: colores.primary }]}>
              Cámara de Análisis IA
            </Text>
            <Text
              style={[styles.subtitle, { fontSize: getScaledFont(13), color: colores.onSurfaceVariant }]}
            >
              Diagnóstico agronómico mediante red neuronal
            </Text>
          </View>
        </View>

        {/* Workspace de Imagen Seleccionada */}
        <View style={[styles.previewContainer, { backgroundColor: colores.surfaceContainerLowest, borderColor: colores.outlineVariant }]}>
          {localImage ? (
            <View style={styles.imageWrapper}>
              <Image source={{ uri: localImage }} style={styles.previewImage} resizeMode="cover" />
              <View style={styles.imageOverlayBadge}>
                <Text style={styles.imageOverlayText}>✓ Imagen Lista para Análisis</Text>
              </View>
            </View>
          ) : (
            <View style={styles.emptyPreview}>
              <View style={[styles.emptyIconBg, { backgroundColor: colores.surfaceContainer }]}>
                <CameraIcon color={colores.primary} size={48} />
              </View>
              <Text style={[styles.emptyTitle, { fontSize: getScaledFont(16), color: colores.onSurface }]}>
                Ninguna imagen seleccionada
              </Text>
              <Text style={[styles.emptySub, { fontSize: getScaledFont(13), color: colores.onSurfaceVariant }]}>
                Tome una foto limpia a la mazorca de cacao o selecciónela de su galería
              </Text>
            </View>
          )}
        </View>

        {/* Botones de Selección (Cámara & Galería) */}
        <View style={styles.pickerButtonsRow}>
          <TouchableOpacity
            style={[
              styles.pickerBtn,
              {
                backgroundColor: colores.primaryContainer,
                minHeight: botonesGrandes ? 56 : 48,
              },
            ]}
            onPress={tomarFoto}
            activeOpacity={0.8}
          >
            <CameraIcon color="#ffffff" size={22} />
            <Text style={[styles.pickerBtnText, { fontSize: getScaledFont(15), color: '#ffffff' }]}>
              Abrir Cámara
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.pickerBtnOutline,
              {
                borderColor: colores.primary,
                backgroundColor: colores.surfaceContainerLowest,
                minHeight: botonesGrandes ? 56 : 48,
              },
            ]}
            onPress={seleccionarGaleria}
            activeOpacity={0.8}
          >
            <ImageIcon color={colores.primary} size={22} />
            <Text style={[styles.pickerBtnOutlineText, { fontSize: getScaledFont(15), color: colores.primary }]}>
              Galería
            </Text>
          </TouchableOpacity>
        </View>

        {/* Modo de prueba agronómico / simulación opcional */}
        <View style={[styles.modoCard, { backgroundColor: colores.surfaceContainer, borderColor: colores.outlineVariant }]}>
          <Text style={[styles.modoCardTitle, { fontSize: getScaledFont(13), color: colores.onSurfaceVariant }]}>
            SELECCIÓN DE CASO DE PRUEBA EN CAMPO:
          </Text>
          <View style={styles.chipContainer}>
            <TouchableOpacity
              style={[
                styles.chip,
                modoSimulacion === 'AUTO' && { backgroundColor: colores.primary },
              ]}
              onPress={() => setModoSimulacion('AUTO')}
            >
              <Text style={[styles.chipText, modoSimulacion === 'AUTO' && { color: '#ffffff' }]}>
                Auto (IA)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.chip,
                modoSimulacion === 'ENFERMA' && { backgroundColor: '#ba1a1a' },
              ]}
              onPress={() => setModoSimulacion('ENFERMA')}
            >
              <Text style={[styles.chipText, modoSimulacion === 'ENFERMA' && { color: '#ffffff' }]}>
                Moniliasis
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.chip,
                modoSimulacion === 'SANA' && { backgroundColor: '#2d5a27' },
              ]}
              onPress={() => setModoSimulacion('SANA')}
            >
              <Text style={[styles.chipText, modoSimulacion === 'SANA' && { color: '#ffffff' }]}>
                Mazorca Sana
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Botón Principal de Envío a la Red Neuronal */}
        {localImage && (
          <TouchableOpacity
            style={[
              styles.actionSubmitBtn,
              {
                backgroundColor: colores.primary,
                minHeight: botonesGrandes ? 60 : 54,
              },
            ]}
            onPress={iniciarAnalisisIA}
            activeOpacity={0.85}
          >
            <SparklesIcon color="#ffffff" size={24} />
            <Text style={[styles.actionSubmitBtnText, { fontSize: getScaledFont(17) }]}>
              Enviar a Red Neuronal (Analizar)
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 12 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 14,
  },
  logoBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: 'Montserrat',
    fontWeight: '800',
  },
  subtitle: {
    fontFamily: 'Inter',
    marginTop: 2,
  },
  previewContainer: {
    width: '100%',
    height: 450,
    borderRadius: 24,
    borderWidth: 2,
    borderStyle: 'dashed',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  imageWrapper: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlayBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: 'rgba(21, 66, 18, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  imageOverlayText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyPreview: {
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  emptyIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontWeight: '700',
    marginBottom: 4,
  },
  emptySub: {
    textAlign: 'center',
    lineHeight: 18,
  },
  pickerButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  pickerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    gap: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  pickerBtnText: {
    fontWeight: '700',
    fontFamily: 'Montserrat',
  },
  pickerBtnOutline: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    borderWidth: 2,
    gap: 8,
  },
  pickerBtnOutlineText: {
    fontWeight: '700',
    fontFamily: 'Montserrat',
  },
  modoCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  modoCardTitle: {
    fontWeight: '700',
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  chipContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#e4e4cc',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1b1d0e',
  },
  actionSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 28,
    gap: 10,
    elevation: 4,
    shadowColor: '#154212',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  actionSubmitBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontFamily: 'Montserrat',
  },
});
