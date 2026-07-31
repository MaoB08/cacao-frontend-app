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
import { useAccesibilidad } from '../contexts/AccesibilidadContext';
import { useDiagnosticoStore } from '../store/useDiagnosticoStore';
import { DiagnosticoResult } from '../types/diagnostico';
import {
  ArrowLeftIcon,
  CheckIcon,
  WarningIcon,
  AlertTriangleIcon,
  HistoryIcon,
  ShareIcon,
  SparklesIcon,
} from '../components/Icons';

export const ResultadoAnalisisScreen = ({ route, navigation }: any) => {
  const { colores, escalaTexto, botonesGrandes } = useAccesibilidad();
  const { currentDiagnosis, guardarEnHistorial } = useDiagnosticoStore();

  const [guardado, setGuardado] = useState(false);

  // Recibir diagnóstico desde parámetros de navegación o del Store
  const diagnostico: DiagnosticoResult = route.params?.diagnostico || currentDiagnosis || {
    imagenUrl: 'https://images.unsplash.com/photo-1587132137056-bfbf0166836e?auto=format&fit=crop&q=80&w=800',
    tieneEnfermedad: true,
    nombreEnfermedad: 'Moniliasis del Cacao',
    nombreCientifico: 'Moniliophthora roreri',
    confianza: '96.8%',
    severidad: 'Alta (75%)',
    recomendaciones: [
      { id: '1', tipo: 'rojo', titulo: 'Retirar fruto afectado', descripcion: 'Corte el fruto con herramientas desinfectadas.' },
      { id: '2', tipo: 'naranja', titulo: 'Enterrar bajo hojarasca', descripcion: 'Evite la dispersión de esporas en el suelo.' },
      { id: '3', tipo: 'cafe', titulo: 'Contactar experto', descripcion: 'Reciba asesoría técnica especializada.' },
    ],
  };

  const getScaledFont = (size: number) => size * escalaTexto;

  // Guardar Diagnóstico en la BD
  const handleGuardarHistorial = async () => {
    const success = await guardarEnHistorial(diagnostico);
    if (success) {
      setGuardado(true);
      Alert.alert('Éxito', '¡Diagnóstico guardado exitosamente en su historial de la finca!');
    } else {
      Alert.alert('Guardado', 'El diagnóstico fue guardado en el dispositivo.');
    }
  };

  // Compartir con Experto
  const handleCompartirExperto = () => {
    navigation.navigate('ChatExperto', { diagnosticoAdjunto: diagnostico });
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.container, { backgroundColor: colores.background }]}>
      {/* Header Fijo */}
      <View style={[styles.header, { backgroundColor: colores.surface, borderBottomColor: colores.outlineVariant }]}>
        <TouchableOpacity
          style={[
            styles.backBtn,
            {
              backgroundColor: colores.surfaceContainer,
              height: botonesGrandes ? 48 : 40,
              width: botonesGrandes ? 48 : 40,
              borderRadius: botonesGrandes ? 24 : 20,
            },
          ]}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <ArrowLeftIcon color={colores.primary} size={22} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { fontSize: getScaledFont(18), color: colores.primary }]}>
          Mi Finca Cacaotera
        </Text>

        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Imagen del Análisis (Ancho Completo) */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: diagnostico.imagenUrl }}
            style={styles.fullWidthImage}
            resizeMode="cover"
          />

          {/* Badge Sobre la Imagen (Esquina Superior Izquierda) */}
          <View style={styles.iaBadge}>
            <SparklesIcon color="#ffffff" size={14} />
            <Text style={styles.iaBadgeText}>Detección IA</Text>
          </View>
        </View>

        <View style={styles.contentPadding}>
          {/* Card de Resultado en caso de Enfermedad vs Sana */}
          <View style={[styles.resultCard, { backgroundColor: colores.surfaceContainerLowest, borderColor: colores.outlineVariant }]}>
            <View style={styles.resultCardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.resultLabel, { fontSize: getScaledFont(11), color: colores.outline }]}>
                  RESULTADO DEL ANÁLISIS
                </Text>
                <Text style={[styles.diseaseTitle, { fontSize: getScaledFont(20), color: colores.onSurface }]}>
                  {diagnostico.nombreEnfermedad}
                </Text>
                <Text style={[styles.scientificName, { fontSize: getScaledFont(14), color: colores.onSurfaceVariant }]}>
                  {diagnostico.nombreCientifico}
                </Text>
              </View>

              {/* Badge de Alerta a la derecha en caso de enfermedad */}
              {diagnostico.tieneEnfermedad ? (
                <View style={styles.alertBadge}>
                  <AlertTriangleIcon color="#ba1a1a" size={16} />
                  <Text style={styles.alertBadgeText}>Alerta</Text>
                </View>
              ) : (
                <View style={styles.healthyBadge}>
                  <CheckIcon color="#154212" size={16} />
                  <Text style={styles.healthyBadgeText}>
                    La mazorca de cacao se encuentra en buen estado
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Dos Métricas en Tarjetas Lado a Lado */}
          <View style={styles.metricsRow}>
            {/* Tarjeta Izquierda: Confianza (Fondo Verde Oscuro) */}
            <View style={[styles.metricCard, { backgroundColor: '#154212' }]}>
              <View style={styles.metricHeader}>
                <View style={styles.metricIconBgGreen}>
                  <CheckIcon color="#ffffff" size={16} />
                </View>
                <Text style={[styles.metricLabel, { fontSize: getScaledFont(12), color: '#9dd090' }]}>
                  Confianza
                </Text>
              </View>
              <Text style={[styles.metricValue, { fontSize: getScaledFont(22), color: '#ffffff' }]}>
                {diagnostico.confianza}
              </Text>
            </View>

            {/* Tarjeta Derecha: Severidad (Fondo Naranja/Ocre) */}
            <View style={[styles.metricCard, { backgroundColor: '#724700' }]}>
              <View style={styles.metricHeader}>
                <View style={styles.metricIconBgAmber}>
                  <WarningIcon color="#ffffff" size={16} />
                </View>
                <Text style={[styles.metricLabel, { fontSize: getScaledFont(12), color: '#ffb451' }]}>
                  Severidad
                </Text>
              </View>
              <Text style={[styles.metricValue, { fontSize: getScaledFont(22), color: '#ffffff' }]}>
                {diagnostico.severidad}
              </Text>
            </View>
          </View>

          {/* Sección Recomendaciones */}
          <View style={styles.recomendacionesSection}>
            <Text style={[styles.sectionTitle, { fontSize: getScaledFont(16), color: colores.primary }]}>
              Recomendaciones
            </Text>

            <View style={styles.recomendacionesList}>
              {diagnostico.recomendaciones.map((rec) => (
                <View
                  key={rec.id}
                  style={[styles.recomendacionItem, { backgroundColor: colores.surfaceContainer, borderColor: colores.outlineVariant }]}
                >
                  {/* Ícono Circular de Color */}
                  <View
                    style={[
                      styles.colorDot,
                      rec.tipo === 'rojo' && { backgroundColor: '#ba1a1a' },
                      rec.tipo === 'naranja' && { backgroundColor: '#f59e0b' },
                      rec.tipo === 'cafe' && { backgroundColor: '#755750' },
                      rec.tipo === 'verde' && { backgroundColor: '#154212' },
                    ]}
                  />

                  <View style={styles.recomendacionTextCol}>
                    <Text style={[styles.recomendacionTitle, { fontSize: getScaledFont(14), color: colores.onSurface }]}>
                      {rec.titulo}
                    </Text>
                    <Text style={[styles.recomendacionDesc, { fontSize: getScaledFont(13), color: colores.onSurfaceVariant }]}>
                      "{rec.descripcion}"
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Botones de Acción (Parte Inferior) */}
          <View style={styles.actionsContainer}>
            {/* Botón Primario Verde Oscuro */}
            <TouchableOpacity
              style={[
                styles.primaryActionBtn,
                {
                  backgroundColor: '#154212',
                  minHeight: botonesGrandes ? 56 : 48,
                },
                guardado && { backgroundColor: '#2d5a27' },
              ]}
              onPress={handleGuardarHistorial}
              activeOpacity={0.85}
            >
              <HistoryIcon color="#ffffff" size={20} />
              <Text style={[styles.primaryActionText, { fontSize: getScaledFont(15) }]}>
                {guardado ? '✓ Guardado en Historial' : 'Guardar en Historial'}
              </Text>
            </TouchableOpacity>

            {/* Botón Secundario Outline */}
            <TouchableOpacity
              style={[
                styles.secondaryActionBtn,
                {
                  borderColor: '#154212',
                  backgroundColor: colores.surfaceContainerLowest,
                  minHeight: botonesGrandes ? 56 : 48,
                },
              ]}
              onPress={handleCompartirExperto}
              activeOpacity={0.85}
            >
              <ShareIcon color="#154212" size={20} />
              <Text style={[styles.secondaryActionText, { fontSize: getScaledFont(15), color: '#154212' }]}>
                Compartir con experto
              </Text>
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
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  backBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'Montserrat',
    fontWeight: '800',
    textAlign: 'center',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  imageContainer: {
    width: '100%',
    height: 400,
    position: 'relative',
    backgroundColor: '#000',
  },
  fullWidthImage: {
    width: '100%',
    height: '100%',
  },
  iaBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2d5a27',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  iaBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Montserrat',
  },
  contentPadding: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  resultCard: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  resultCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  resultLabel: {
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 4,
  },
  diseaseTitle: {
    fontFamily: 'Montserrat',
    fontWeight: '800',
    lineHeight: 26,
  },
  scientificName: {
    fontStyle: 'italic',
    marginTop: 2,
  },
  alertBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffdad6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 4,
  },
  alertBadgeText: {
    color: '#ba1a1a',
    fontWeight: '800',
    fontSize: 13,
  },
  healthyBadge: {
    backgroundColor: '#bcf0ae',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    maxWidth: 140,
  },
  healthyBadgeText: {
    color: '#002201',
    fontWeight: '700',
    fontSize: 11,
    lineHeight: 14,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  metricCard: {
    flex: 1,
    padding: 16,
    borderRadius: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  metricIconBgGreen: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricIconBgAmber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricLabel: {
    fontWeight: '700',
    fontFamily: 'Montserrat',
  },
  metricValue: {
    fontFamily: 'Montserrat',
    fontWeight: '800',
  },
  recomendacionesSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: 'Montserrat',
    fontWeight: '800',
    marginBottom: 12,
  },
  recomendacionesList: {
    gap: 10,
  },
  recomendacionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  colorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  recomendacionTextCol: {
    flex: 1,
  },
  recomendacionTitle: {
    fontWeight: '700',
    marginBottom: 2,
  },
  recomendacionDesc: {
    fontStyle: 'italic',
    lineHeight: 18,
  },
  actionsContainer: {
    gap: 12,
    marginTop: 8,
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    gap: 10,
    elevation: 3,
    shadowColor: '#154212',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  primaryActionText: {
    color: '#ffffff',
    fontWeight: '800',
    fontFamily: 'Montserrat',
  },
  secondaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    borderWidth: 2,
    gap: 10,
  },
  secondaryActionText: {
    fontWeight: '800',
    fontFamily: 'Montserrat',
  },
});
