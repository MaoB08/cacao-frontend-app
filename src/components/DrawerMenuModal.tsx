import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  ScrollView,
  TouchableWithoutFeedback,
  Image,
  SafeAreaView,
} from 'react-native';
import { usePerfilStore } from '../store/usePerfilStore';
import { useAccesibilidad } from '../contexts/AccesibilidadContext';
import {
  HomeIcon,
  UserIcon,
  ChatBubbleIcon,
  HelpCircleIcon,
  TrendUpIcon,
  BellIcon,
  GearIcon,
  CloseIcon,
  ChevronRightIcon,
} from './Icons';

interface DrawerMenuModalProps {
  visible: boolean;
  onClose: () => void;
  navigation: any;
  currentRoute?: string;
}

export const DrawerMenuModal: React.FC<DrawerMenuModalProps> = ({
  visible,
  onClose,
  navigation,
  currentRoute,
}) => {
  const { perfil } = usePerfilStore();
  const { escalaTexto, colores, botonesGrandes } = useAccesibilidad();

  const getScaledFont = (size: number) => size * escalaTexto;

  const menuItems = [
    {
      id: 'Casa',
      title: 'Inicio',
      icon: (color: string) => <HomeIcon color={color} size={22} />,
      action: () => navigation.navigate('Casa'),
    },
    {
      id: 'PerfilMain',
      title: 'Mi Perfil',
      icon: (color: string) => <UserIcon color={color} size={22} />,
      action: () => navigation.navigate('PerfilMain'),
    },
    {
      id: 'ChatExperto',
      title: 'Asesoría con Expertos',
      icon: (color: string) => <ChatBubbleIcon color={color} size={22} />,
      action: () => navigation.navigate('ChatExperto'),
    },
    {
      id: 'CentroAyuda',
      title: 'Centro de Ayuda',
      icon: (color: string) => <HelpCircleIcon color={color} size={22} />,
      action: () => navigation.navigate('CentroAyuda'),
    },
    {
      id: 'DiagnosticosResumen',
      title: 'Resumen de Diagnósticos',
      icon: (color: string) => <TrendUpIcon color={color} size={22} />,
      action: () => navigation.navigate('DiagnosticosResumen'),
    },
    {
      id: 'Notificaciones',
      title: 'Notificaciones',
      icon: (color: string) => <BellIcon color={color} size={22} />,
      action: () => navigation.navigate('Notificaciones'),
    },
    {
      id: 'Configuracion',
      title: 'Configuración y Accesibilidad',
      icon: (color: string) => <GearIcon color={color} size={22} />,
      action: () => navigation.navigate('Configuracion'),
    },
  ];

  const handleNavigation = (action: () => void) => {
    onClose();
    setTimeout(() => {
      action();
    }, 150);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.drawerContent,
            { backgroundColor: colores.surfaceContainerLowest },
          ]}
        >
          <SafeAreaView style={styles.safeArea}>
            {/* Header del menú */}
            <View style={[styles.header, { borderBottomColor: colores.outlineVariant }]}>
              <View style={styles.userInfo}>
                {perfil?.fotoPerfil ? (
                  <Image source={{ uri: perfil.fotoPerfil }} style={styles.avatar} />
                ) : (
                  <View
                    style={[
                      styles.avatarPlaceholder,
                      { backgroundColor: colores.surfaceContainer },
                    ]}
                  >
                    <Text
                      style={[
                        styles.avatarLetter,
                        { fontSize: getScaledFont(16), color: colores.primary },
                      ]}
                    >
                      {perfil?.nombre ? perfil.nombre.charAt(0).toUpperCase() : 'A'}
                    </Text>
                  </View>
                )}
                <View style={styles.userTextContainer}>
                  <Text
                    style={[
                      styles.userName,
                      { fontSize: getScaledFont(16), color: colores.onSurface },
                    ]}
                    numberOfLines={1}
                  >
                    {perfil?.nombre || 'Agricultor Cacaotero'}
                  </Text>
                  <Text
                    style={[
                      styles.userSub,
                      { fontSize: getScaledFont(12), color: colores.onSurfaceVariant },
                    ]}
                    numberOfLines={1}
                  >
                    {perfil?.finca?.nombre || 'CacaoCare App'}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.closeBtn,
                  { backgroundColor: colores.surfaceContainer, height: 36, width: 36, borderRadius: 18 },
                ]}
                onPress={onClose}
                accessibilityLabel="Cerrar menú"
              >
                <CloseIcon color={colores.onSurface} size={20} />
              </TouchableOpacity>
            </View>

            {/* Opciones del Menú */}
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              <Text
                style={[
                  styles.sectionLabel,
                  { fontSize: getScaledFont(12), color: colores.outline },
                ]}
              >
                NAVEGACIÓN RÁPIDA
              </Text>

              {menuItems.map((item) => {
                const isActive = currentRoute === item.id;
                const activeBg = colores.primary + '1F'; // 12% opacity highlight
                const itemColor = isActive ? colores.primary : colores.onSurface;

                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.menuItem,
                      {
                        height: botonesGrandes ? 56 : 48,
                        backgroundColor: isActive ? activeBg : 'transparent',
                        borderRadius: 12,
                      },
                    ]}
                    onPress={() => handleNavigation(item.action)}
                  >
                    <View style={styles.itemLeft}>
                      <View style={styles.iconContainer}>
                        {item.icon(itemColor)}
                      </View>
                      <Text
                        style={[
                          styles.itemTitle,
                          {
                            fontSize: getScaledFont(14),
                            color: itemColor,
                            fontWeight: isActive ? '700' : '500',
                          },
                        ]}
                      >
                        {item.title}
                      </Text>
                    </View>
                    <ChevronRightIcon
                      color={isActive ? colores.primary : colores.outlineVariant}
                      size={18}
                    />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={[styles.footer, { borderTopColor: colores.outlineVariant }]}>
              <Text
                style={[
                  styles.versionText,
                  { fontSize: getScaledFont(11), color: colores.onSurfaceVariant },
                ]}
              >
                CacaoCare v1.0.0 • Asistencia en Cultivo
              </Text>
            </View>
          </SafeAreaView>
        </View>

        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  drawerContent: {
    width: '80%',
    maxWidth: 320,
    height: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontWeight: '700',
  },
  userTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  userName: {
    fontWeight: '700',
  },
  userSub: {
    marginTop: 2,
  },
  closeBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingVertical: 16,
  },
  sectionLabel: {
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    marginVertical: 3,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: 14,
    width: 24,
    alignItems: 'center',
  },
  itemTitle: {},
  footer: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  versionText: {
    fontWeight: '500',
  },
});
