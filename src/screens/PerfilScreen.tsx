import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, ScrollView, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { usePerfilStore } from '../store/usePerfilStore';
import { useAccesibilidad } from '../contexts/AccesibilidadContext';
import { 
  SyncIcon, BellIcon, PencilIcon, GridIcon, TrendUpIcon, 
  ChevronRightIcon, GearIcon, HelpCircleIcon, LogoutIcon, ChatBubbleIcon
} from '../components/Icons';
import { ProfileSkeleton } from '../components/SkeletonLoader';

export const PerfilScreen = ({ navigation }: any) => {
  const { perfil, loading, fetchPerfil, updateFoto, logout } = usePerfilStore();
  const { escalaTexto, escalaBoton, colores, botonesGrandes } = useAccesibilidad();
  const [refreshing, setRefreshing] = useState(false);

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

  const handleChangePhoto = async () => {
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
      '¿Estás seguro de que deseas salir de CacaoCare?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Sí, salir', 
          style: 'destructive',
          onPress: async () => {
            await logout();
            // La navegación se reseteará automáticamente en App.tsx al ver user = null
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
              <PencilIcon color="#ffffff" size={14} />
            </View>
          </TouchableOpacity>

          <Text style={[styles.name, { fontSize: getScaledFont(22), color: colores.onSurface }]}>
            {p.nombre}
          </Text>
          <Text style={[styles.email, { fontSize: getScaledFont(14), color: colores.onSurfaceVariant }]}>
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
        <Text style={[styles.versionLabel, { fontSize: getScaledFont(12), color: colores.onSurfaceVariant }]}>
          Versión {p.versionApp}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
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
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
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
  name: { fontWeight: '800', marginBottom: 4 },
  email: { fontWeight: '500' },
  bentoGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
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
});
