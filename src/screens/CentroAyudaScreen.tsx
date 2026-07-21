import React, { useEffect, useState, useCallback } from 'react';
import { 
  StyleSheet, Text, View, TouchableOpacity, Image, 
  TextInput, ScrollView, RefreshControl, LayoutAnimation, Platform, UIManager, Alert 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../services/api';
import { usePerfilStore } from '../store/usePerfilStore';
import { useAccesibilidad } from '../contexts/AccesibilidadContext';
import { 
  MenuIcon, SearchIcon, ChevronDownIcon, ChevronRightIcon, 
  CameraIcon, GridIcon, WifiIcon, DollarIcon, ShieldIcon 
} from '../components/Icons';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { DrawerMenuModal } from '../components/DrawerMenuModal';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface Categoria {
  id: string;
  nombre: string;
  icono: string;
  color: string;
  descripcion: string;
  orden: number;
}

interface FAQ {
  id: string;
  pregunta: string;
  respuesta: string;
  categoria: string;
  orden: number;
}

const getCategoryIcon = (icono: string, color: string, size = 24) => {
  switch (icono?.toLowerCase()) {
    case 'camera':
      return <CameraIcon color={color} size={size} />;
    case 'grid':
      return <GridIcon color={color} size={size} />;
    case 'wifi':
      return <WifiIcon color={color} size={size} />;
    case 'dollar':
      return <DollarIcon color={color} size={size} />;
    case 'shield':
      return <ShieldIcon color={color} size={size} />;
    default:
      return <GridIcon color={color} size={size} />;
  }
};

export const CentroAyudaScreen = ({ navigation }: any) => {
  const { perfil } = usePerfilStore();
  const { escalaTexto, escalaBoton, colores, botonesGrandes } = useAccesibilidad();

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [openFaqId, setOpenFaqId] = useState<string | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const [catsRes, faqsRes] = await Promise.all([
        api.get('/ayuda/categorias'),
        api.get('/ayuda/preguntas'),
      ]);
      setCategorias(catsRes.data);
      setFaqs(faqsRes.data);
    } catch (e) {
      console.warn('Error loading help data', e);
      setError('Error al cargar la ayuda');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
  };

  const toggleFaq = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (openFaqId === id) {
      setOpenFaqId(null);
    } else {
      setOpenFaqId(id);
    }
  };

  const handleSupportAction = (type: string) => {
    Alert.alert(
      'Soporte Técnico',
      `¿Deseas contactar a soporte vía ${type}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Contactar', 
          onPress: () => Alert.alert('Redirección', 'Aquí se abriría el canal de comunicación correspondiente.') 
        }
      ]
    );
  };

  const getScaledFont = (size: number) => size * escalaTexto;

  // Filter FAQs based on search
  const filteredFaqs = faqs.filter(
    (faq) =>
      faq.pregunta.toLowerCase().includes(search.toLowerCase()) ||
      faq.respuesta.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.container, { backgroundColor: colores.background }]}>
      <DrawerMenuModal 
        visible={menuVisible} 
        onClose={() => setMenuVisible(false)} 
        navigation={navigation} 
        currentRoute="CentroAyuda" 
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
          Centro de Ayuda
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
        <View style={styles.heroSection}>
          <Text style={[styles.heroTitle, { fontSize: getScaledFont(24), color: colores.primary }]}>
            ¿Cómo podemos ayudarte?
          </Text>
        </View>

        {/* Search */}
        <View style={[styles.searchContainer, { backgroundColor: colores.surfaceContainerLowest, borderColor: colores.outlineVariant }]}>
          <SearchIcon color={colores.outline} size={20} />
          <TextInput
            placeholder="Buscar en preguntas frecuentes..."
            placeholderTextColor={colores.onSurfaceVariant}
            value={search}
            onChangeText={setSearch}
            style={[styles.searchInput, { fontSize: getScaledFont(14), color: colores.onSurface }]}
          />
        </View>

        {loading ? (
          <View style={{ gap: 16 }}>
            <SkeletonLoader width="100%" height={100} borderRadius={16} />
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <SkeletonLoader width="47%" height={80} borderRadius={16} />
              <SkeletonLoader width="47%" height={80} borderRadius={16} />
            </View>
          </View>
        ) : (
          <>
            {/* Category Grid */}
            <Text style={[styles.sectionTitle, { fontSize: getScaledFont(16), color: colores.onSurface }]}>
              Categorías de Soporte
            </Text>
            <View style={styles.grid}>
              {categorias.map((cat) => {
                const isWide = cat.nombre.toLowerCase().includes('cámara');
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.gridCard,
                      isWide ? styles.wideCard : styles.narrowCard,
                      { backgroundColor: colores.surfaceContainerLowest, borderColor: colores.outlineVariant }
                    ]}
                    onPress={() => navigation.navigate('AyudaCategoria', { categoriaNombre: cat.nombre })}
                  >
                    <View style={styles.cardHeader}>
                      <View style={[styles.iconWrapper, { backgroundColor: cat.color + '1A' }]}>
                        {getCategoryIcon(cat.icono, cat.color)}
                      </View>
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={[styles.cardTitle, { fontSize: getScaledFont(14), color: colores.onSurface }]} numberOfLines={1}>
                          {cat.nombre}
                        </Text>
                        <Text style={[styles.cardDesc, { fontSize: getScaledFont(11), color: colores.onSurfaceVariant }]} numberOfLines={2}>
                          {cat.descripcion}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Accordion FAQ */}
            <Text style={[styles.sectionTitle, { fontSize: getScaledFont(16), color: colores.onSurface, marginTop: 24 }]}>
              Preguntas Frecuentes
            </Text>
            <View style={styles.faqList}>
              {filteredFaqs.length === 0 ? (
                <Text style={[styles.emptyText, { fontSize: getScaledFont(13), color: colores.onSurfaceVariant }]}>
                  No se encontraron preguntas para tu búsqueda.
                </Text>
              ) : (
                filteredFaqs.map((faq) => {
                  const isOpen = openFaqId === faq.id;
                  return (
                    <View 
                      key={faq.id} 
                      style={[
                        styles.faqItem, 
                        { backgroundColor: colores.surfaceContainerLowest, borderColor: colores.outlineVariant }
                      ]}
                    >
                      <TouchableOpacity 
                        style={[styles.faqHeader, { height: botonesGrandes ? 64 : 48 }]} 
                        onPress={() => toggleFaq(faq.id)}
                      >
                        <Text style={[styles.faqQuestion, { fontSize: getScaledFont(14), color: colores.onSurface }]} numberOfLines={2}>
                          {faq.pregunta}
                        </Text>
                        <View style={{ transform: [{ rotate: isOpen ? '180deg' : '0deg' }] }}>
                          <ChevronDownIcon color={colores.outline} size={18} />
                        </View>
                      </TouchableOpacity>
                      {isOpen && (
                        <View style={styles.faqAnswerContainer}>
                          <Text style={[styles.faqAnswer, { fontSize: getScaledFont(13), color: colores.onSurfaceVariant }]}>
                            {faq.respuesta}
                          </Text>
                        </View>
                      )}
                    </View>
                  );
                })
              )}
            </View>
          </>
        )}

        {/* Support Banner */}
        <View style={[styles.supportBanner, { backgroundColor: colores.surfaceContainer, borderColor: colores.outlineVariant }]}>
          <Text style={[styles.supportTitle, { fontSize: getScaledFont(15), color: colores.primary }]}>
            ¿No encuentras lo que buscas?
          </Text>
          <Text style={[styles.supportDesc, { fontSize: getScaledFont(12), color: colores.onSurfaceVariant }]}>
            Nuestro equipo de ingenieros y soporte técnico está listo para ayudarte directamente.
          </Text>
          
          <View style={styles.supportActions}>
            <TouchableOpacity 
              style={[styles.supportBtn, { backgroundColor: colores.primary, height: botonesGrandes ? 56 : 40, borderRadius: botonesGrandes ? 28 : 20 }]}
              onPress={() => handleSupportAction('WhatsApp')}
            >
              <Text style={[styles.supportBtnText, { fontSize: getScaledFont(13) }]}>WhatsApp</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.supportBtnOutline, { borderColor: colores.primary, height: botonesGrandes ? 56 : 40, borderRadius: botonesGrandes ? 28 : 20 }]}
              onPress={() => handleSupportAction('Llamada')}
            >
              <Text style={[styles.supportBtnOutlineText, { fontSize: getScaledFont(13), color: colores.primary }]}>Llamar</Text>
            </TouchableOpacity>
          </View>
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
  headerAvatar: { width: 36, height: 36, borderRadius: 18 },
  headerAvatarPlaceholder: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { fontWeight: '700' },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  heroSection: { marginTop: 16, marginBottom: 12 },
  heroTitle: { fontWeight: '800' },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 20,
  },
  searchInput: { flex: 1, marginLeft: 8, padding: 0 },
  sectionTitle: { fontWeight: '700', marginBottom: 12 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridCard: {
    padding: 12,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  wideCard: {
    width: '100%',
  },
  narrowCard: {
    flex: 1,
    minWidth: '45%',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { fontWeight: '700' },
  cardDesc: { marginTop: 2, lineHeight: 14 },
  faqList: { gap: 10 },
  emptyText: { textAlign: 'center', marginVertical: 12 },
  faqItem: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  faqQuestion: { fontWeight: '700', flex: 1, marginRight: 16 },
  faqAnswerContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  faqAnswer: { lineHeight: 18 },
  supportBanner: {
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
    marginTop: 28,
  },
  supportTitle: { fontWeight: '700', marginBottom: 4 },
  supportDesc: { lineHeight: 16, marginBottom: 16 },
  supportActions: { flexDirection: 'row', gap: 10 },
  supportBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  supportBtnText: { color: '#ffffff', fontWeight: '700' },
  supportBtnOutline: {
    flex: 1,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  supportBtnOutlineText: { fontWeight: '700' },
});
