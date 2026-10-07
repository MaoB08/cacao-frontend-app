import React, { useEffect, useState, useCallback } from 'react';
import { 
  StyleSheet, Text, View, TouchableOpacity, Image, ScrollView, 
  RefreshControl, Alert, Modal, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { usePerfilStore } from '../store/usePerfilStore';
import { useAccesibilidad } from '../contexts/AccesibilidadContext';
import { 
  SyncIcon, BellIcon, PencilIcon, GridIcon, TrendUpIcon, 
  ChevronRightIcon, GearIcon, HelpCircleIcon, LogoutIcon, ChatBubbleIcon,
  DollarIcon, CameraIcon
} from '../components/Icons';
import { ProfileSkeleton } from '../components/SkeletonLoader';
import { CultivIALogo } from '../components/CultivIALogo';

export const PerfilScreen = ({ navigation }: any) => {
  const { perfil, loading, fetchPerfil, updateFoto, updatePerfil, logout } = usePerfilStore();
  const { escalaTexto, escalaBoton, colores, botonesGrandes } = useAccesibilidad();
  const [refreshing, setRefreshing] = useState(false);

  // Estados para el Modal de Edición de Perfil
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editNombre, setEditNombre] = useState('');
  const [editTelefono, setEditTelefono] = useState('');
  const [editFincaNombre, setEditFincaNombre] = useState('');
  const [editDepartamento, setEditDepartamento] = useState('');
  const [editMunicipio, setEditMunicipio] = useState('');
  const [editHectareas, setEditHectareas] = useState('');
  const [guardando, setGuardando] = useState(false);

  const loadData = useCallback(async () => {
    await fetchPerfil();
  }, [fetchPerfil]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleOpenEditModal = () => {
    if (perfil) {
      setEditNombre(perfil.nombre || '');
      setEditTelefono(perfil.telefono || '');
      setEditFincaNombre(perfil.finca?.nombre || '');
      setEditDepartamento(perfil.finca?.departamento || '');
      setEditMunicipio(perfil.finca?.municipio || '');
      setEditHectareas(perfil.finca?.hectareas?.toString() || '');
      setEditModalVisible(true);
    }
  };

  const handleSavePerfil = async () => {
    if (!editNombre.trim()) {
      Alert.alert('Error', 'El nombre es obligatorio.');
      return;
    }

    setGuardando(true);
    try {
      await updatePerfil({
        nombre: editNombre,
        telefono: editTelefono,
        finca: {
          nombre: editFincaNombre,
          departamento: editDepartamento,
          municipio: editMunicipio,
          hectareas: parseFloat(editHectareas) || 0,
        }
      });
      setEditModalVisible(false);
      Alert.alert('¡Éxito!', 'Perfil actualizado correctamente.');
    } catch (err) {
      console.warn('Error al guardar perfil', err);
      Alert.alert('Error', 'Hubo un error al actualizar los datos.');
    } finally {
      setGuardando(false);
    }
  };

  const handleChangePhoto = () => {
    Alert.alert(
      'Foto de Perfil',
      'Elige una opción para cambiar tu foto de perfil:',
      [
        {
          text: 'Tomar Foto 📸',
          onPress: handleTakePhoto,
        },
        {
          text: 'Seleccionar de Galería 🖼️',
          onPress: handleChooseFromGallery,
        },
        {
          text: 'Cancelar',
          style: 'cancel',
        },
      ]
    );
  };

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permiso Requerido',
        'Necesitamos permisos de acceso a la cámara para tomar una foto de perfil.'
      );
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        await updateFoto(result.assets[0].uri);
      }
    } catch (err) {
      console.warn('Error al tomar foto', err);
      Alert.alert('Error', 'Hubo un error al tomar la foto.');
    }
  };

  const handleChooseFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permiso Requerido',
        'Necesitamos permisos de acceso a la galería para cambiar tu foto de perfil.'
      );
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        await updateFoto(result.assets[0].uri);
      }
    } catch (err) {
      console.warn('Error al seleccionar imagen', err);
      Alert.alert('Error', 'Hubo un error al subir la foto.');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que deseas salir de CultivIA?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Sí, salir', 
          style: 'destructive',
          onPress: async () => {
            await logout();
          }
        }
      ]
    );
  };

  const getScaledFont = (size: number) => size * escalaTexto;

  if (loading && !perfil) {
    return (
      <SafeAreaView edges={['top', 'left', 'right']} style={[styles.container, { backgroundColor: colores.background }]}>
        <ProfileSkeleton />
      </SafeAreaView>
    );
  }

  const p = perfil || {
    nombre: 'Agricultor',
    email: '',
    telefono: '',
    fotoPerfil: null,
    finca: { nombre: 'Mi Finca', departamento: '', municipio: '', hectareas: 0 },
    estadisticas: { totalAnalisis: 0, estadoSaludPorcentaje: 92, estadoSaludEtiqueta: 'Excelente' },
    versionApp: '1.0.0'
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.container, { backgroundColor: colores.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={[styles.headerBtn, { backgroundColor: colores.surfaceContainer }]} 
          onPress={loadData}
        >
          <SyncIcon color={colores.primary} size={22} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { fontSize: getScaledFont(18), color: colores.onSurface }]}>
          Mi Finca Cacaotera
        </Text>
        <TouchableOpacity 
          style={[styles.headerBtn, { backgroundColor: colores.surfaceContainer }]}
          onPress={() => navigation.navigate('Notificaciones')}
        >
          <BellIcon color={colores.primary} size={22} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colores.primary} />
        }
      >
        {/* Identidad */}
        <View style={styles.identityCard}>
          <TouchableOpacity style={styles.avatarContainer} onPress={handleChangePhoto}>
            {p.fotoPerfil ? (
              <Image source={{ uri: p.fotoPerfil }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: colores.surfaceContainer }]}>
                <Text style={[styles.avatarLetter, { fontSize: getScaledFont(36), color: colores.primary }]}>
                  {p.nombre.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={[styles.editBadge, { backgroundColor: colores.primary }]}>
              <CameraIcon color="#ffffff" size={14} />
            </View>
          </TouchableOpacity>

          <View style={styles.nameRow}>
            <Text style={[styles.name, { fontSize: getScaledFont(22), color: colores.onSurface }]}>
              {p.nombre}
            </Text>
            <TouchableOpacity onPress={handleOpenEditModal} style={styles.editProfileIconBtn}>
              <PencilIcon color={colores.primary} size={18} />
            </TouchableOpacity>
          </View>

          {p.finca?.nombre ? (
            <Text style={[styles.locationText, { fontSize: getScaledFont(14), color: colores.primary }]}>
              📍 {p.finca.nombre}
              {p.finca.municipio || p.finca.departamento ? ` (${p.finca.municipio}${p.finca.municipio && p.finca.departamento ? ', ' : ''}${p.finca.departamento})` : ''}
            </Text>
          ) : null}

          <Text style={[styles.email, { fontSize: getScaledFont(13), color: colores.onSurfaceVariant, marginTop: 4 }]}>
            {p.email}
          </Text>
        </View>

        {/* Bento Grid Info */}
        <View style={styles.bentoGrid}>
          <View style={[styles.bentoCard, { backgroundColor: colores.surfaceContainerLowest, borderColor: colores.outlineVariant }]}>
            <GridIcon color={colores.primary} size={24} />
            <Text style={[styles.bentoValue, { fontSize: getScaledFont(24), color: colores.onSurface }]}>
              {p.finca.hectareas || '0'}
            </Text>
            <Text style={[styles.bentoLabel, { fontSize: getScaledFont(12), color: colores.onSurfaceVariant }]}>
              Hectáreas
            </Text>
          </View>

          <View style={[styles.bentoCard, { backgroundColor: colores.surfaceContainerLowest, borderColor: colores.outlineVariant }]}>
            <TrendUpIcon color={colores.primary} size={24} />
            <Text style={[styles.bentoValue, { fontSize: getScaledFont(24), color: colores.onSurface }]}>
              {p.estadisticas.totalAnalisis || '0'}
            </Text>
            <Text style={[styles.bentoLabel, { fontSize: getScaledFont(12), color: colores.onSurfaceVariant }]}>
              Análisis Realizados
            </Text>
          </View>
        </View>

        {/* Bento Card 3: Ventas de Cacao e Ingresos */}
        <TouchableOpacity
          style={[styles.salesBentoCard, { backgroundColor: colores.surfaceContainerLowest, borderColor: colores.outlineVariant }]}
          onPress={() => navigation.navigate('CentroAyuda', { screen: 'PagosVentas' })}
        >
          <View style={styles.salesBentoLeft}>
            <DollarIcon color={colores.primary} size={26} />
            <View style={styles.salesBentoTexts}>
              <Text style={[styles.salesBentoTitle, { fontSize: getScaledFont(15), color: colores.onSurface }]}>
                Precios e Ingresos del Cacao
              </Text>
              <Text style={[styles.salesBentoDesc, { fontSize: getScaledFont(12), color: colores.onSurfaceVariant }]}>
                Consulta precios al día, tendencias e ingresos estimados.
              </Text>
            </View>
          </View>
          <ChevronRightIcon color={colores.outline} size={18} />
        </TouchableOpacity>

        {/* Health status banner */}
        <TouchableOpacity
          style={[styles.healthBanner, { backgroundColor: colores.primary }]}
          onPress={() => navigation.navigate('DiagnosticosResumen')}
        >
          <View style={styles.healthInfo}>
            <Text style={[styles.healthTitle, { fontSize: getScaledFont(15) }]}>
              Estado de Salud
            </Text>
            <Text style={[styles.healthDesc, { fontSize: getScaledFont(12) }]}>
              Tus cultivos están protegidos. Promedio: {p.estadisticas.estadoSaludPorcentaje}%
            </Text>
          </View>
          <View style={styles.healthBadge}>
            <Text style={[styles.healthBadgeText, { fontSize: getScaledFont(13) }]}>
              {p.estadisticas.estadoSaludEtiqueta}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Navigation list */}
        <View style={[styles.navList, { borderColor: colores.outlineVariant, backgroundColor: colores.surfaceContainerLowest }]}>
          <TouchableOpacity 
            style={[styles.navItem, { height: botonesGrandes ? 64 : 52 }]} 
            onPress={() => navigation.navigate('ChatExperto')}
          >
            <View style={styles.navLeft}>
              <ChatBubbleIcon color={colores.primary} size={20} />
              <Text style={[styles.navText, { fontSize: getScaledFont(15), color: colores.onSurface }]}>
                Asesoría con Expertos
              </Text>
            </View>
            <ChevronRightIcon color={colores.outline} size={18} />
          </TouchableOpacity>

          <View style={[styles.navDivider, { backgroundColor: colores.outlineVariant }]} />

          <TouchableOpacity 
            style={[styles.navItem, { height: botonesGrandes ? 64 : 52 }]} 
            onPress={() => navigation.navigate('Configuracion')}
          >
            <View style={styles.navLeft}>
              <GearIcon color={colores.primary} size={20} />
              <Text style={[styles.navText, { fontSize: getScaledFont(15), color: colores.onSurface }]}>
                Configuración y Accesibilidad
              </Text>
            </View>
            <ChevronRightIcon color={colores.outline} size={18} />
          </TouchableOpacity>

          <View style={[styles.navDivider, { backgroundColor: colores.outlineVariant }]} />

          <TouchableOpacity 
            style={[styles.navItem, { height: botonesGrandes ? 64 : 52 }]} 
            onPress={() => navigation.navigate('CentroAyuda')}
          >
            <View style={styles.navLeft}>
              <HelpCircleIcon color={colores.primary} size={20} />
              <Text style={[styles.navText, { fontSize: getScaledFont(15), color: colores.onSurface }]}>
                Centro de Ayuda
              </Text>
            </View>
            <ChevronRightIcon color={colores.outline} size={18} />
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={[
            styles.logoutBtn,
            { 
              height: botonesGrandes ? 64 : 48,
              borderRadius: botonesGrandes ? 32 : 24,
            }
          ]}
          onPress={handleLogout}
        >
          <LogoutIcon color="#ba1a1a" size={20} />
          <Text style={[styles.logoutText, { fontSize: getScaledFont(16) }]}>
            Cerrar Sesión
          </Text>
        </TouchableOpacity>

        {/* Version label */}
        <View style={{ alignItems: 'center', marginTop: 12 }}>
          <CultivIALogo size={52} />
          <Text style={[styles.versionLabel, { fontSize: getScaledFont(12), color: colores.onSurfaceVariant, marginTop: 4 }]}>
            CultivIA • Versión {p.versionApp}
          </Text>
        </View>
      </ScrollView>

      {/* Modal de Edición de Perfil */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { backgroundColor: colores.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { fontSize: getScaledFont(18), color: colores.onSurface }]}>
                Editar Datos de la Finca
              </Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Text style={[styles.modalCloseText, { color: colores.outline }]}>Cerrar</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll}>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { fontSize: getScaledFont(14), color: colores.onSurfaceVariant }]}>
                  Nombre Completo
                </Text>
                <TextInput
                  style={[styles.input, { borderColor: colores.outlineVariant, color: colores.onSurface, fontSize: getScaledFont(15) }]}
                  value={editNombre}
                  onChangeText={setEditNombre}
                  placeholder="Tu nombre completo"
                  placeholderTextColor={colores.outline}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { fontSize: getScaledFont(14), color: colores.onSurfaceVariant }]}>
                  Teléfono de Contacto
                </Text>
                <TextInput
                  style={[styles.input, { borderColor: colores.outlineVariant, color: colores.onSurface, fontSize: getScaledFont(15) }]}
                  value={editTelefono}
                  onChangeText={setEditTelefono}
                  keyboardType="phone-pad"
                  placeholder="Ej: +57 300 123 4567"
                  placeholderTextColor={colores.outline}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { fontSize: getScaledFont(14), color: colores.onSurfaceVariant }]}>
                  Nombre de la Finca
                </Text>
                <TextInput
                  style={[styles.input, { borderColor: colores.outlineVariant, color: colores.onSurface, fontSize: getScaledFont(15) }]}
                  value={editFincaNombre}
                  onChangeText={setEditFincaNombre}
                  placeholder="Ej: Finca La Esperanza"
                  placeholderTextColor={colores.outline}
                />
              </View>

              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={[styles.inputLabel, { fontSize: getScaledFont(14), color: colores.onSurfaceVariant }]}>
                    Departamento
                  </Text>
                  <TextInput
                    style={[styles.input, { borderColor: colores.outlineVariant, color: colores.onSurface, fontSize: getScaledFont(15) }]}
                    value={editDepartamento}
                    onChangeText={setEditDepartamento}
                    placeholder="Ej: Huila"
                    placeholderTextColor={colores.outline}
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={[styles.inputLabel, { fontSize: getScaledFont(14), color: colores.onSurfaceVariant }]}>
                    Municipio
                  </Text>
                  <TextInput
                    style={[styles.input, { borderColor: colores.outlineVariant, color: colores.onSurface, fontSize: getScaledFont(15) }]}
                    value={editMunicipio}
                    onChangeText={setEditMunicipio}
                    placeholder="Ej: Rivera"
                    placeholderTextColor={colores.outline}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { fontSize: getScaledFont(14), color: colores.onSurfaceVariant }]}>
                  Hectáreas Cultivadas
                </Text>
                <TextInput
                  style={[styles.input, { borderColor: colores.outlineVariant, color: colores.onSurface, fontSize: getScaledFont(15) }]}
                  value={editHectareas}
                  onChangeText={setEditHectareas}
                  keyboardType="numeric"
                  placeholder="Ej: 5.5"
                  placeholderTextColor={colores.outline}
                />
              </View>

              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: colores.primary, height: botonesGrandes ? 64 : 48 }]}
                onPress={handleSavePerfil}
                disabled={guardando}
              >
                {guardando ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={[styles.saveBtnText, { fontSize: getScaledFont(16) }]}>
                    Guardar Cambios
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontWeight: '700' },
  scroll: { paddingHorizontal: 24, paddingBottom: 40 },
  identityCard: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: { fontWeight: '700' },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 4,
  },
  name: { fontWeight: '800' },
  editProfileIconBtn: {
    padding: 4,
  },
  locationText: {
    fontWeight: '600',
    marginTop: 2,
  },
  email: { fontWeight: '500' },
  bentoGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  bentoCard: {
    flex: 1,
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  bentoValue: { fontWeight: '800', marginTop: 8, marginBottom: 2 },
  bentoLabel: { fontWeight: '600' },
  salesBentoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  salesBentoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  salesBentoTexts: {
    flex: 1,
  },
  salesBentoTitle: {
    fontWeight: '700',
    marginBottom: 2,
  },
  salesBentoDesc: {
    fontWeight: '500',
    lineHeight: 16,
  },
  healthBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  healthInfo: { flex: 1, marginRight: 16 },
  healthTitle: { color: '#ffffff', fontWeight: '700', marginBottom: 2 },
  healthDesc: { color: 'rgba(255,255,255,0.85)', fontWeight: '500' },
  healthBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  healthBadgeText: { color: '#ffffff', fontWeight: '700' },
  navList: {
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  navText: { fontWeight: '600' },
  navDivider: { height: 1 },
  logoutBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ffdad6',
    marginBottom: 24,
  },
  logoutText: { color: '#ba1a1a', fontWeight: '700' },
  versionLabel: { textAlign: 'center', fontWeight: '500' },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 16,
    paddingHorizontal: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  modalTitle: {
    fontWeight: '800',
  },
  modalCloseText: {
    fontWeight: '700',
  },
  modalScroll: {
    paddingVertical: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputLabel: {
    fontWeight: '700',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 48,
    fontWeight: '600',
  },
  saveBtn: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  saveBtnText: {
    color: '#ffffff',
    fontWeight: '700',
  },
});
