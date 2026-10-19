import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet, Text, View, ScrollView, SafeAreaView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Platform, Image,
} from 'react-native';
import { useAuthStore } from '../store/useAuthStore';
import { api } from '../services/api';
import { Theme } from '../constants/theme';
import {
  AlertTriangleIcon, UsersIcon, ClipboardIcon, ActivityIcon, CameraIcon,
} from '../components/Icons';
import { useShallow } from 'zustand/react/shallow';
import { resolveMediaUrl } from '../utils/mediaUtils';

interface DiagnosticoPendiente {
  id: string;
  agricultor: string;
  finca: string;
  enfermedadDetectada: string;
  severidad: string;
  fecha: string;
  imagenUrl?: string;
}

interface ExpertoDashboardData {
  experto: { nombre: string };
  kpis: { agricultoresAsignados: number; diagnosticosPendientes: number; alertasActivas: number };
  diagnosticosPendientesRevision: DiagnosticoPendiente[];
}

const severityColors: Record<string, { bg: string; text: string }> = {
  ALTA: { bg: '#ffdad6', text: '#ba1a1a' },
  MEDIA: { bg: '#ffddb8', text: '#724700' },
  BAJA: { bg: '#e8f5e9', text: '#2e7d32' },
};

export const DashboardExpertoScreen = ({ navigation }: any) => {
  const { user } = useAuthStore(useShallow((s) => ({ user: s.user })));
  const [data, setData] = useState<ExpertoDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = useCallback(async () => {
    try {
      setError(null);
      const res = await api.get('/expertos/dashboard');
      setData(res.data);
    } catch (e: any) {
      setError(e.mensaje || 'Error al cargar el dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboard();
  }, [fetchDashboard]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Theme.colors.primary} />
          <Text style={styles.loadingText}>Cargando panel de experto...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <AlertTriangleIcon color={Theme.colors.error} size={48} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchDashboard}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const d = data!;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Theme.colors.primary} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Panel de Experto</Text>
          <Text style={styles.expertName}>{d.experto.nombre}</Text>
        </View>

        {/* KPI Cards */}
        <View style={styles.kpiRow}>
          <View style={[styles.kpiCard, { backgroundColor: '#bcf0ae' }]}>
            <UsersIcon color={Theme.colors.primary} size={24} />
            <Text style={styles.kpiValue}>{d.kpis.agricultoresAsignados}</Text>
            <Text style={styles.kpiLabel}>Agricultores</Text>
          </View>
          <View style={[styles.kpiCard, { backgroundColor: '#ffddb8' }]}>
            <ClipboardIcon color="#724700" size={24} />
            <Text style={[styles.kpiValue, { color: '#724700' }]}>{d.kpis.diagnosticosPendientes}</Text>
            <Text style={[styles.kpiLabel, { color: '#724700' }]}>Pendientes</Text>
          </View>
          <View style={[styles.kpiCard, { backgroundColor: '#ffdad6' }]}>
            <AlertTriangleIcon color="#ba1a1a" size={24} />
            <Text style={[styles.kpiValue, { color: '#ba1a1a' }]}>{d.kpis.alertasActivas}</Text>
            <Text style={[styles.kpiLabel, { color: '#93000a' }]}>Alertas</Text>
          </View>
        </View>

        {/* Pending Reviews */}
        <Text style={styles.sectionTitle}>Diagnósticos Pendientes de Revisión</Text>
        {d.diagnosticosPendientesRevision.map((item) => {
          const sev = severityColors[item.severidad] || severityColors.MEDIA;
          const resolvedUri = resolveMediaUrl(item.imagenUrl);
          return (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.8}
              onPress={() => {
                if (navigation) {
                  navigation.navigate('Cámara', {
                    screen: 'ResultadoAnalisis',
                    params: {
                      diagnostico: {
                        id: item.id,
                        imagenUrl: resolvedUri || item.imagenUrl || '',
                        tieneEnfermedad: true,
                        nombreEnfermedad: item.enfermedadDetectada,
                        nombreCientifico: item.enfermedadDetectada.toLowerCase().includes('monilia')
                          ? 'Moniliophthora roreri'
                          : 'Theobroma cacao L.',
                        codigoClase: '',
                        probabilidad: 0.9,
                        confianza: '90.0%',
                        severidad: item.severidad,
                        concluyente: true,
                        recomendaciones: [],
                        createdAt: item.fecha,
                      },
                      imageUri: resolvedUri || item.imagenUrl || '',
                    },
                  });
                }
              }}
              style={styles.reviewCard}
            >
              <View style={styles.reviewCardContent}>
                {resolvedUri ? (
                  <Image source={{ uri: resolvedUri }} style={styles.reviewThumb} resizeMode="cover" />
                ) : (
                  <View style={styles.reviewThumbPlaceholder}>
                    <CameraIcon color={Theme.colors.outline} size={22} />
                  </View>
                )}
                <View style={styles.reviewDetails}>
                  <View style={styles.reviewHeader}>
                    <View style={[styles.severityDot, { backgroundColor: sev.text }]} />
                    <Text style={styles.reviewDisease} numberOfLines={1}>{item.enfermedadDetectada}</Text>
                    <View style={[styles.severityBadge, { backgroundColor: sev.bg }]}>
                      <Text style={[styles.severityText, { color: sev.text }]}>{item.severidad}</Text>
                    </View>
                  </View>
                  <View style={styles.reviewMeta}>
                    <Text style={styles.reviewMetaText}>👤 {item.agricultor}</Text>
                    <Text style={styles.reviewMetaText}>🏡 {item.finca}</Text>
                  </View>
                  <Text style={styles.reviewDate}>
                    {new Date(item.fecha).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: Theme.colors.background,
  },
  scroll: { 
    paddingHorizontal: Theme.spacing.marginMobile, 
    paddingTop: Platform.OS === 'android' ? 24 : 12,
    paddingBottom: 40, 
  },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  loadingText: { marginTop: 16, fontSize: 16, color: Theme.colors.onSurfaceVariant },
  errorText: { marginTop: 16, fontSize: 16, color: Theme.colors.error, textAlign: 'center' },
  retryButton: {
    marginTop: 20, backgroundColor: Theme.colors.primary, paddingHorizontal: 32, paddingVertical: 14,
    borderRadius: Theme.roundness.full,
  },
  retryButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  header: { 
    marginBottom: 24,
    paddingTop: Platform.OS === 'ios' ? 8 : 0,
  },
  greeting: { fontSize: 16, color: Theme.colors.onSurfaceVariant, fontWeight: '600' },
  expertName: { fontSize: 24, fontWeight: '800', color: Theme.colors.primary, marginTop: 4 },

  kpiRow: { flexDirection: 'row', gap: 10, marginBottom: 28 },
  kpiCard: {
    flex: 1, padding: 14, borderRadius: Theme.roundness.default, alignItems: 'center', gap: 6,
  },
  kpiValue: { fontSize: 28, fontWeight: '800', color: Theme.colors.primary },
  kpiLabel: { fontSize: 11, fontWeight: '700', color: Theme.colors.primary, textTransform: 'uppercase', letterSpacing: 0.5 },

  sectionTitle: { fontSize: 20, fontWeight: '700', color: Theme.colors.onSurface, marginBottom: 14 },

  reviewCard: {
    backgroundColor: Theme.colors.surfaceContainerLowest, borderRadius: Theme.roundness.default,
    padding: 14, marginBottom: 12, shadowColor: '#5c403a', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06, shadowRadius: 12, elevation: 3, borderWidth: 1, borderColor: '#e6dedb',
  },
  reviewCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  reviewThumb: {
    width: 68,
    height: 68,
    borderRadius: 10,
    backgroundColor: Theme.colors.surfaceContainer,
  },
  reviewThumbPlaceholder: {
    width: 68,
    height: 68,
    borderRadius: 10,
    backgroundColor: '#efebe9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewDetails: {
    flex: 1,
  },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  severityDot: { width: 10, height: 10, borderRadius: 5 },
  reviewDisease: { flex: 1, fontSize: 15, fontWeight: '700', color: Theme.colors.onSurface },
  severityBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  severityText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  reviewMeta: { flexDirection: 'row', gap: 16, marginBottom: 4 },
  reviewMetaText: { fontSize: 13, color: Theme.colors.onSurfaceVariant },
  reviewDate: { fontSize: 12, color: Theme.colors.outline },
});
