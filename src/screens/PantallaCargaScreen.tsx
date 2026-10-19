import React, { useEffect, useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAccesibilidad } from '../contexts/AccesibilidadContext';
import { useDiagnosticoStore } from '../store/useDiagnosticoStore';
import { useAuthStore } from '../store/useAuthStore';
import { EcoIcon } from '../components/Icons';
import { CultivIALogo } from '../components/CultivIALogo';

export const PantallaCargaScreen = ({ route, navigation }: any) => {
  const { imageUri } = route.params || {};
  const { colores, escalaTexto } = useAccesibilidad();
  const { ejecutarAnalisis } = useDiagnosticoStore();
  const user = useAuthStore((state) => state.user);

  const nombreFinca = user?.nombreFinca ? user.nombreFinca.toUpperCase() : 'MI FINCA CACAOTERA';
  const getScaledFont = (size: number) => size * escalaTexto;

  const messages = [
    'Estableciendo conexión segura...',
    'Sincronizando datos del cultivo...',
    'Cargando modelos de IA...',
    'Analizando red neuronal...',
    'Generando diagnóstico de precisión...',
  ];

  const [messageIndex, setMessageIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Animación del Halo Resplandeciente y de la Barra de Carga
  useEffect(() => {
    // Animación de pulso continuo
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 1500,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.95,
          duration: 1500,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
      ])
    ).start();

    // Animación de la Barra de Progreso a 3.5 segundos
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 3500,
      useNativeDriver: false,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    }).start();

    // Rotación de Mensajes Secuenciales
    const interval = setInterval(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setMessageIndex((prev) => (prev + 1) % messages.length);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    }, 750);

    // Ejecutar el Análisis vía Store/Backend y navegar al finalizar la carga
    let isMounted = true;
    const run = async () => {
      try {
        const result = await ejecutarAnalisis(imageUri);
        setTimeout(() => {
          if (isMounted) {
            navigation.replace('ResultadoAnalisis', { diagnostico: result, imageUri });
          }
        }, 3200);
      } catch (err: any) {
        setTimeout(() => {
          if (isMounted) {
            navigation.replace('ErrorAnalisis', {
              errorMessage: err?.response?.data?.message || err?.message || 'El servicio de análisis neuronal no está disponible actualmente.',
              imageUri,
            });
          }
        }, 2000);
      }
    };
    run();

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const progressBarWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colores.background }]}>
      {/* Área Superior / Logo Animado & Marca */}
      <View style={styles.centerContainer}>
        {/* Wrapper Alineado para Halo e Ícono */}
        <View style={styles.logoWrapper}>
          {/* Glowing Halo perfectly centered */}
          <Animated.View
            style={[
              styles.halo,
              {
                backgroundColor: '#bcf0ae',
                transform: [{ scale: pulseAnim }],
              },
            ]}
          />

          {/* Contenedor de Logo */}
          <View style={[styles.logoCard, { backgroundColor: '#ffffff', overflow: 'hidden' }]}>
            <CultivIALogo size={96} />
          </View>
        </View>

        {/* Tipografía CultivIA */}
        <Text style={[styles.brandTitle, { fontSize: getScaledFont(32), color: colores.primary }]}>
          CultivIA
        </Text>
        <Text style={[styles.brandSubtitle, { fontSize: getScaledFont(13), color: colores.onSurfaceVariant }]}>
          INTELIGENCIA AGRÍCOLA
        </Text>
      </View>

      {/* Área Inferior / Estado y Barra de Progreso */}
      <View style={styles.bottomArea}>
        <Animated.View style={[styles.statusWrapper, { opacity: fadeAnim }]}>
          <Text style={[styles.statusMessage, { fontSize: getScaledFont(15), color: colores.onSurfaceVariant }]}>
            {messages[messageIndex]}
          </Text>
        </Animated.View>

        {/* Puntos Rebotantes Animados */}
        <View style={styles.dotsRow}>
          <View style={[styles.dot, { backgroundColor: colores.primary }]} />
          <View style={[styles.dot, { backgroundColor: colores.primary }]} />
          <View style={[styles.dot, { backgroundColor: colores.primary }]} />
        </View>

        {/* Contenedor de Barra de Progreso */}
        <View style={[styles.progressTrack, { backgroundColor: colores.surfaceContainer }]}>
          <Animated.View
            style={[
              styles.progressBar,
              {
                backgroundColor: colores.primary,
                width: progressBarWidth,
              },
            ]}
          />
        </View>

        {/* Meta Info */}
        <View style={styles.metaRow}>
          <Text style={[styles.metaText, { fontSize: getScaledFont(10), color: colores.outline }]}>
            FINCA: {nombreFinca}
          </Text>
          <Text style={[styles.metaText, { fontSize: getScaledFont(10), color: colores.outline }]}>
            v1.0.0
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  logoWrapper: {
    position: 'relative',
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  halo: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    opacity: 0.4,
  },
  logoCard: {
    width: 110,
    height: 110,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#154212',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
  },
  brandTitle: {
    fontFamily: 'Montserrat',
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontFamily: 'Inter',
    fontWeight: '600',
    letterSpacing: 2,
    marginTop: 6,
  },
  bottomArea: {
    width: '100%',
    maxWidth: 320,
    marginBottom: 24,
  },
  statusWrapper: {
    minHeight: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusMessage: {
    fontFamily: 'Inter',
    textAlign: 'center',
    fontWeight: '500',
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 16,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  progressTrack: {
    height: 6,
    width: '100%',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  metaText: {
    fontFamily: 'Montserrat',
    fontWeight: '700',
    letterSpacing: 1,
  },
});
