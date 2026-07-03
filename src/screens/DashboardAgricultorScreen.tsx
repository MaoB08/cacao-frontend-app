import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet, Text, View, ScrollView, SafeAreaView, TouchableOpacity,
  ActivityIndicator, Image, RefreshControl, Platform,
} from 'react-native';
import { useAuthStore } from '../store/useAuthStore';
import { api } from '../services/api';
import { Theme } from '../constants/theme';
import {
  CacaoIcon, CameraIcon, AlertTriangleIcon, ActivityIcon,
  ThermometerIcon, LeafIcon,
} from '../components/Icons';
import { useShallow } from 'zustand/react/shallow';

interface DiagnosticoInfo {
  id: string;
  imagenUrl: string;
  enfermedadDetectada: string;
  nivelConfianza: number;
  severidad: 'ALTA' | 'MEDIA' | 'BAJA' | 'SALUDABLE';
  fecha: string;
}

interface DashboardData {
  agricultor: { nombre: string; nombreFinca: string };
  resumen: { totalDiagnosticos: number; alertasActivas: number; ultimoAnalisis: string | null };
  diagnosticosRecientes: DiagnosticoInfo[];
}

const severityColors: Record<string, { bg: string; text: string }> = {
  ALTA: { bg: '#ffdad6', text: '#ba1a1a' },
  MEDIA: { bg: '#ffddb8', text: '#724700' },
  BAJA: { bg: '#e8f5e9', text: '#2e7d32' },
  SALUDABLE: { bg: '#bcf0ae', text: '#154212' },
};

export const DashboardAgricultorScreen = ({ navigation }: any) => {
  const { user } = useAuthStore(useShallow((s) => ({ user: s.user })));
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = useCallback(async () => {
    try {
      setError(null);
      const res = await api.get('/agricultores/dashboard');
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
          <Text style={styles.loadingText}>Cargando tu finca...</Text>
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
          <View style={styles.headerLeft}>
            <Text style={styles.farmerName}>{d.agricultor.nombre} 🌿</Text>
            <Text style={styles.fincaName}>{d.agricultor.nombreFinca}</Text>
          </View>
          <View style={styles.headerIcon}>
            <CacaoIcon color={Theme.colors.primary} size={36} />
          </View>
        </View>

        {/* Temperature Card */}
        <View style={styles.tempCard}>
          <ThermometerIcon color="#ffffff" size={22} />
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.tempLabel}>Temperatura actual</Text>
            <Text style={styles.tempValue}>28°C — Soleado</Text>
          </View>
        </View>

        {/* Stats Bento Grid */}
        <View style={styles.bentoGrid}>
          <View style={[styles.statCard, { backgroundColor: '#bcf0ae' }]}>
            <ActivityIcon color={Theme.colors.primary} size={24} />
            <Text style={styles.statValue}>{d.resumen.totalDiagnosticos}</Text>
            <Text style={styles.statLabel}>Diagnósticos</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#ffddb8' }]}>
            <AlertTriangleIcon color="#724700" size={24} />
            <Text style={[styles.statValue, { color: '#724700' }]}>{d.resumen.alertasActivas}</Text>
            <Text style={[styles.statLabel, { color: '#724700' }]}>Alertas Activas</Text>
          </View>
          <View style={[styles.statCardWide, { backgroundColor: Theme.colors.surfaceContainerLowest }]}>
            <LeafIcon color={Theme.colors.primary} size={20} />
            <Text style={styles.statLabelWide}>
              Último análisis:{' '}
              <Text style={{ fontWeight: '700' }}>
                {d.resumen.ultimoAnalisis
                  ? new Date(d.resumen.ultimoAnalisis).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })
                  : 'Sin análisis'}
              </Text>
            </Text>
          </View>
        </View>

        {/* Quick Action */}
        <TouchableOpacity style={styles.scanButton} onPress={() => navigation.navigate('Cámara')}>
          <CameraIcon color="#ffffff" size={22} />
          <Text style={styles.scanButtonText}>Escanear Mazorca</Text>
        </TouchableOpacity>

        {/* Recent Diagnoses */}
        <Text style={styles.sectionTitle}>Diagnósticos Recientes</Text>
        {d.diagnosticosRecientes.map((diag) => {
          const sev = severityColors[diag.severidad] || severityColors.BAJA;
          return (
            <View key={diag.id} style={styles.diagCard}>
              <Image source={{ uri: diag.imagenUrl }} style={styles.diagImage} />
              <View style={styles.diagInfo}>
                <Text style={styles.diagDisease} numberOfLines={1}>{diag.enfermedadDetectada}</Text>
                <Text style={styles.diagDate}>
                  {new Date(diag.fecha).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  <View style={[styles.severityBadge, { backgroundColor: sev.bg }]}>
                    <Text style={[styles.severityText, { color: sev.text }]}>{diag.severidad}</Text>
                  </View>
                  <Text style={styles.confidence}>{Math.round(diag.nivelConfianza * 100)}%</Text>
                </View>
              </View>
            </View>
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
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 24,
  },
  headerLeft: {
    flex: 1,
    paddingRight: 16,
  },
  farmerName: { fontSize: 24, fontWeight: '800', color: Theme.colors.primary },
  fincaName: { fontSize: 14, color: Theme.colors.secondary, fontWeight: '600', marginTop: 2 },
  headerIcon: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: '#bcf0ae',
    alignItems: 'center', justifyContent: 'center',
  },

  tempCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Theme.colors.primaryContainer,
    borderRadius: Theme.roundness.md, padding: 16, marginBottom: 20,
  },
  tempLabel: { fontSize: 12, color: '#a1d494', fontWeight: '600' },
  tempValue: { fontSize: 18, color: '#ffffff', fontWeight: '700' },

  bentoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  statCard: {
    flex: 1, minWidth: '45%', padding: 16, borderRadius: Theme.roundness.default,
    alignItems: 'flex-start', gap: 8,
  },
  statValue: { fontSize: 28, fontWeight: '800', color: Theme.colors.primary },
  statLabel: { fontSize: 13, fontWeight: '600', color: Theme.colors.primary },
  statCardWide: {
    width: '100%', flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 14, borderRadius: Theme.roundness.default,
    borderWidth: 1, borderColor: Theme.colors.outlineVariant,
  },
  statLabelWide: { fontSize: 14, color: Theme.colors.onSurfaceVariant },

  scanButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: Theme.colors.primary, borderRadius: Theme.roundness.full,
    height: Theme.spacing.touchTargetMin, marginBottom: 28,
    shadowColor: Theme.colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 8, elevation: 4,
  },
  scanButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  sectionTitle: { fontSize: 20, fontWeight: '700', color: Theme.colors.onSurface, marginBottom: 14 },

  diagCard: {
    flexDirection: 'row', backgroundColor: Theme.colors.surfaceContainerLowest,
    borderRadius: Theme.roundness.default, padding: 12, marginBottom: 12,
    shadowColor: '#5c403a', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06,
    shadowRadius: 12, elevation: 3,
  },
  diagImage: { width: 68, height: 68, borderRadius: 12, backgroundColor: Theme.colors.surfaceContainer },
  diagInfo: { flex: 1, marginLeft: 12, justifyContent: 'center' },
  diagDisease: { fontSize: 15, fontWeight: '700', color: Theme.colors.onSurface },
  diagDate: { fontSize: 12, color: Theme.colors.outline, marginTop: 2 },
  severityBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  severityText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  confidence: { fontSize: 13, fontWeight: '700', color: Theme.colors.primary },
});
