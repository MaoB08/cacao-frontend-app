import React, { useEffect, useState, useCallback } from 'react';
import { 
  StyleSheet, Text, View, TouchableOpacity, Image, 
  TextInput, ScrollView, RefreshControl, Alert 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useExpertosStore } from '../store/useExpertosStore';
import { usePerfilStore } from '../store/usePerfilStore';
import { useAccesibilidad } from '../contexts/AccesibilidadContext';
import { 
  MenuIcon, SearchIcon, StarIcon, CameraIcon, ChevronRightIcon 
} from '../components/Icons';
import { ExpertosListSkeleton } from '../components/SkeletonLoader';
import { DrawerMenuModal } from '../components/DrawerMenuModal';

export const ChatExpertoScreen = ({ route, navigation }: any) => {
  const { expertos, especialidades, loading, fetchExpertos, fetchEspecialidades, iniciarChat } = useExpertosStore();
  const { perfil } = usePerfilStore();
  const { escalaTexto, escalaBoton, colores, botonesGrandes } = useAccesibilidad();

  const diagnosticoAdjunto = route?.params?.diagnosticoAdjunto;

  const [search, setSearch] = useState('');
  const [selectedSpec, setSelectedSpec] = useState('Todos');
  const [refreshing, setRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  // Debounced search logic locally
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchExpertos(selectedSpec, search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, selectedSpec, fetchExpertos]);

  const loadData = useCallback(async () => {
    await Promise.all([
      fetchExpertos(selectedSpec, search),
      fetchEspecialidades()
    ]);
  }, [fetchExpertos, fetchEspecialidades, selectedSpec, search]);

  useEffect(() => {
    loadData();
  }, [fetchEspecialidades]); // Run once on mount to get specialties

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleStartChat = async (expertoId: string, nombre: string, disponible: boolean, tiempoEspera: number | null) => {
    if (!disponible) {
      Alert.alert(
        'Asesor Ocupado',
        `El Ing. ${nombre} se encuentra en asesoría actualmente. El tiempo de espera estimado es de ${tiempoEspera || 15} minutos. ¿Deseas encolar tu consulta?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { 
            text: 'Encolar consulta', 
            onPress: () => Alert.alert('Consulta encolada', 'Te notificaremos en cuanto el experto esté libre.') 
          }
        ]
      );
      return;
    }

    try {
      await iniciarChat(expertoId);
      Alert.alert(
        '¡Chat Iniciado!',
        `Te has conectado con el Ing. ${nombre}. Ya puedes enviarle tus dudas sobre tu cultivo.`
      );
    } catch (err: any) {
      if (err.response?.status === 423 || err.error === 'experto_no_disponible') {
        const wait = err.tiempoEspera || 15;
        Alert.alert(
          'No Disponible',
          `El experto no está disponible. Tiempo de espera estimado: ${wait} minutos.`
        );
      } else {
        Alert.alert('Error', 'No se pudo iniciar el chat en este momento.');
      }
    }
  };

  const getScaledFont = (size: number) => size * escalaTexto;

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.container, { backgroundColor: colores.background }]}>
      <DrawerMenuModal 
        visible={menuVisible} 
        onClose={() => setMenuVisible(false)} 
        navigation={navigation} 
        currentRoute="ChatExperto" 
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={[styles.headerBtn, { backgroundColor: colores.surfaceContainer }]}
          onPress={() => setMenuVisible(true)}
          accessibilityLabel="Abrir menú de navegación"
        >
          <MenuIcon color={colores.primary} size={24} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { fontSize: getScaledFont(18), color: colores.onSurface }]}>
          Asesoría Técnica
        </Text>
        {perfil?.fotoPerfil ? (
          <Image source={{ uri: perfil.fotoPerfil }} style={styles.headerAvatar} />
        ) : (
          <View style={[styles.headerAvatarPlaceholder, { backgroundColor: colores.surfaceContainer }]}>
            <Text style={[styles.avatarLetter, { fontSize: getScaledFont(12), color: colores.primary }]}>
              {perfil?.nombre ? perfil.nombre.charAt(0).toUpperCase() : 'A'}
            </Text>
          </View>
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colores.primary} />
        }
      >
        {/* Search */}
        <View style={[styles.searchContainer, { backgroundColor: colores.surfaceContainerLowest, borderColor: colores.outlineVariant }]}>
          <SearchIcon color={colores.outline} size={20} />
          <TextInput
            placeholder="Buscar experto o especialidad..."
            placeholderTextColor={colores.onSurfaceVariant}
            value={search}
            onChangeText={setSearch}
            style={[styles.searchInput, { fontSize: getScaledFont(14), color: colores.onSurface }]}
          />
        </View>

        {/* Categories Horizontal Chips */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsScroll}
        >
          {especialidades.map((spec) => {
            const isSelected = selectedSpec === spec;
            return (
              <TouchableOpacity
                key={spec}
                style={[
                  styles.chip,
                  isSelected ? { backgroundColor: colores.primary } : { backgroundColor: colores.surfaceContainer, borderColor: colores.outlineVariant },
                ]}
                onPress={() => setSelectedSpec(spec)}
              >
                <Text 
                  style={[
                    styles.chipText, 
                    { fontSize: getScaledFont(13) },
                    isSelected ? { color: '#ffffff', fontWeight: '700' } : { color: colores.onSurface }
                  ]}
                >
                  {spec}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Experts List */}
        {loading && expertos.length === 0 ? (
          <ExpertosListSkeleton />
        ) : (
          <View style={styles.expertList}>
            {expertos.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { fontSize: getScaledFont(15), color: colores.onSurfaceVariant }]}>
                  No se encontraron asesores disponibles.
                </Text>
              </View>
            ) : (
              expertos.map((exp) => (
                <View 
                  key={exp.id} 
                  style={[
                    styles.expertCard, 
                    { backgroundColor: colores.surfaceContainerLowest, borderColor: colores.outlineVariant }
                  ]}
                >
                  <View style={styles.cardHeader}>
                    {exp.fotoPerfil ? (
                      <Image source={{ uri: exp.fotoPerfil }} style={styles.expertAvatar} />
                    ) : (
                      <View style={[styles.expertAvatarPlaceholder, { backgroundColor: colores.surfaceContainer }]}>
                        <Text style={[styles.avatarLetter, { fontSize: getScaledFont(20), color: colores.primary }]}>
                          {exp.nombre.replace('Ing. ', '').replace('Dra. ', '').charAt(0)}
                        </Text>
                      </View>
                    )}
                    <View style={styles.expertInfo}>
                      <Text style={[styles.expertName, { fontSize: getScaledFont(16), color: colores.onSurface }]}>
                        {exp.nombre}
                      </Text>
                      <View style={styles.specialtyRow}>
                        <Text style={[styles.expertSpec, { fontSize: getScaledFont(13), color: colores.primary }]}>
                          {exp.especialidad}
                        </Text>
                        <View style={styles.ratingRow}>
                          <StarIcon size={14} />
                          <Text style={[styles.ratingVal, { fontSize: getScaledFont(12), color: colores.onSurface }]}>
                            {exp.rating.toFixed(1)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  <Text style={[styles.expertDesc, { fontSize: getScaledFont(13), color: colores.onSurfaceVariant }]} numberOfLines={3}>
                    {exp.descripcion}
                  </Text>

                  <View style={styles.cardFooter}>
                    <View style={styles.statusSection}>
                      <View 
                        style={[
                          styles.statusDot, 
                          { backgroundColor: exp.disponible ? '#10b981' : '#f59e0b' }
                        ]} 
                      />
                      <Text style={[styles.statusText, { fontSize: getScaledFont(12), color: colores.onSurfaceVariant }]}>
                        {exp.disponible ? 'Disponible ahora' : `En asesoría (espera: ${exp.tiempoEspera || 15}m)`}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.chatBtn,
                        { 
                          backgroundColor: exp.disponible ? colores.primary : '#ffd7ce',
                          height: botonesGrandes ? 52 : 36,
                          borderRadius: botonesGrandes ? 26 : 18,
                        }
                      ]}
                      onPress={() => handleStartChat(exp.id, exp.nombre, exp.disponible, exp.tiempoEspera)}
                    >
                      <Text 
                        style={[
                          styles.chatBtnText, 
                          { fontSize: getScaledFont(13) },
                          exp.disponible ? { color: '#ffffff', fontWeight: '700' } : { color: '#755750', fontWeight: '700' }
                        ]}
                      >
                        {exp.disponible ? 'Iniciar Chat' : 'Encolar'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* IA banner */}
        <View style={[styles.iaBanner, { backgroundColor: colores.surfaceContainer, borderColor: colores.outlineVariant }]}>
          <View style={styles.iaBannerHeader}>
            <CameraIcon color={colores.primary} size={24} />
            <Text style={[styles.iaBannerTitle, { fontSize: getScaledFont(15), color: colores.primary }]}>
              ¿Problema Urgente?
            </Text>
          </View>
          <Text style={[styles.iaBannerDesc, { fontSize: getScaledFont(12), color: colores.onSurfaceVariant }]}>
            Escanea tu mazorca con nuestra cámara IA para obtener un diagnóstico clínico inmediato en segundos.
          </Text>
          <TouchableOpacity 
            style={[styles.iaBannerBtn, { backgroundColor: colores.primary, height: botonesGrandes ? 56 : 40, borderRadius: botonesGrandes ? 28 : 20 }]}
            onPress={() => navigation.navigate('Cámara')}
          >
            <Text style={[styles.iaBannerBtnText, { fontSize: getScaledFont(13) }]}>
              Tomar Foto Diagnóstica
            </Text>
          </TouchableOpacity>
        </View>
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
  headerAvatar: { width: 36, height: 36, borderRadius: 18 },
  headerAvatarPlaceholder: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { fontWeight: '700' },
  scroll: { paddingHorizontal: 24, paddingBottom: 40 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    marginTop: 12,
    marginBottom: 16,
  },
  searchInput: { flex: 1, marginLeft: 8, padding: 0 },
  chipsScroll: { paddingBottom: 16, gap: 8 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipText: { fontWeight: '600' },
  expertList: { gap: 16, marginBottom: 24 },
  emptyContainer: { padding: 40, alignItems: 'center' },
  emptyText: { textAlign: 'center', fontWeight: '500' },
  expertCard: {
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  expertAvatar: { width: 56, height: 56, borderRadius: 28 },
  expertAvatarPlaceholder: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  expertInfo: { flex: 1, marginLeft: 12 },
  expertName: { fontWeight: '700' },
  specialtyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
  expertSpec: { fontWeight: '600' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingVal: { fontWeight: '700' },
  expertDesc: { marginTop: 12, lineHeight: 18, fontWeight: '400' },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  statusSection: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontWeight: '500' },
  chatBtn: {
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatBtnText: { fontWeight: '700' },
  iaBanner: {
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 20,
  },
  iaBannerHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  iaBannerTitle: { fontWeight: '700' },
  iaBannerDesc: { lineHeight: 16, fontWeight: '500', marginBottom: 12 },
  iaBannerBtn: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iaBannerBtnText: { color: '#ffffff', fontWeight: '700' },
});
