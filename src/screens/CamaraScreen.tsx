import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useAccesibilidad } from '../contexts/AccesibilidadContext';
import { useDiagnosticoStore } from '../store/useDiagnosticoStore';
import { visitaService } from '../services/visitaService';
import {
  CameraIcon,
  ImageIcon,
  SparklesIcon,
  CacaoIcon,
  CheckIcon,
} from '../components/Icons';
import { CultivIALogo } from '../components/CultivIALogo';

export const CamaraScreen = ({ navigation, route }: any) => {
  const visitaId = route?.params?.visitaId;
  const loteId = route?.params?.loteId;
  const [subiendoAVisita, setSubiendoAVisita] = useState(false);
  const { escalaTexto, colores, botonesGrandes } = useAccesibilidad();
  const {
    currentImageUri,
    setCurrentImageUri,
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

  // Vincular fotografía a la visita técnica activa
  const handleVincularAVisita = async () => {
    if (!localImage) {
      Alert.alert('Atención', 'Por favor primero toma o selecciona una imagen de la mazorca.');
      return;
    }
    if (!visitaId) return;

    try {
      setSubiendoAVisita(true);
      await visitaService.subirImagen(visitaId, localImage, loteId);
      Alert.alert(
        'Foto Vinculada',
        'La evidencia fotográfica ha sido asociada con éxito al expediente de la visita técnica.',
        [
          {
            text: 'Volver a la Visita en Campo',
            onPress: () => {
              navigation.navigate('Visitas', {
                screen: 'VisitaEnCurso',
                params: { visitaId },
              });
            },
          },
          { text: 'Tomar Otra', style: 'cancel' },
        ]
      );
    } catch (err: any) {
      const msg = err?.response?.data?.mensaje || err?.mensaje || 'No se pudo subir la foto.';
      Alert.alert('Error al subir foto', msg);
    } finally {
      setSubiendoAVisita(false);
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
        {/* Banner de contexto de visita técnica */}
        {visitaId && (
          <View style={styles.visitaBanner}>
            <Text style={[styles.visitaBannerTitle, { fontSize: getScaledFont(14) }]}>
              📸 Modo Visita Técnica Activa
            </Text>
            <Text style={[styles.visitaBannerSub, { fontSize: getScaledFont(12) }]}>
              Las fotografías que captures se pueden vincular directamente al informe de campo de esta visita.
            </Text>
          </View>
        )}

        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.logoBadge, { backgroundColor: colores.surfaceContainer }]}>
            <CultivIALogo size={40} />
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


        {/* Botón de Vincular a Visita Técnica (cuando se ingresó con contexto de visita) */}
        {localImage && visitaId && (
          <TouchableOpacity
            style={[
              styles.actionSubmitBtn,
              {
                backgroundColor: '#15803d',
                minHeight: botonesGrandes ? 60 : 54,
                marginBottom: 12,
              },
            ]}
            onPress={handleVincularAVisita}
            disabled={subiendoAVisita}
            activeOpacity={0.85}
          >
            {subiendoAVisita ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <CheckIcon color="#ffffff" size={22} />
                <Text style={[styles.actionSubmitBtnText, { fontSize: getScaledFont(17) }]}>
                  Vincular a la Visita Técnica
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}

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
  visitaBanner: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  visitaBannerTitle: {
    fontWeight: '700',
    color: '#15803d',
  },
  visitaBannerSub: {
    marginTop: 2,
    color: '#166534',
    lineHeight: 16,
  },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 40, paddingTop: 12 },
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
