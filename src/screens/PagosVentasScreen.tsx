import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { safeStorage } from '../utils/safeStorage';
import { api } from '../services/api';
import { useAccesibilidad } from '../contexts/AccesibilidadContext';
import {
  ChevronLeftIcon,
  DollarIcon,
  TrendUpIcon,
  CheckIcon,
  SyncIcon,
  MapPinIcon,
  PhoneIcon,
} from '../components/Icons';
import { fetchCacaoPrices, CacaoPriceData } from '../services/cacaoPriceService';

interface VentaRegistrada {
  id: string;
  fecha: string;
  cantidad: number;
  unidad: string;
  tipoGrano: string;
  totalEstimado: number;
}

const STORAGE_KEY_VENTAS = '@cultivia_ventas_registradas';

export const PagosVentasScreen = ({ navigation }: any) => {
  const { escalaTexto, colores, botonesGrandes } = useAccesibilidad();

  // Estados de datos de mercado
  const [priceData, setPriceData] = useState<CacaoPriceData | null>(null);
  const [loadingPrice, setLoadingPrice] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Estados de la Calculadora
  const [cantidadInput, setCantidadInput] = useState('100');
  const [unidadSeleccionada, setUnidadSeleccionada] = useState<'kg' | 'arroba' | 'carga'>('kg');
  const [tipoGrano, setTipoGrano] = useState<'seco' | 'baba' | 'pasilla'>('seco');
  const [humedad, setHumedad] = useState<'7' | '9' | '12'>('7');

  // Historial de ventas guardadas
  const [ventasGuardadas, setVentasGuardadas] = useState<VentaRegistrada[]>([]);

  const getScaledFont = (size: number) => size * escalaTexto;

  const loadMarketPrices = useCallback(async () => {
    try {
      const data = await fetchCacaoPrices();
      setPriceData(data);
    } catch (e) {
      console.warn('Error cargando precios de cacao', e);
    } finally {
      setLoadingPrice(false);
      setRefreshing(false);
    }
  }, []);

  const loadVentasGuardadas = useCallback(async () => {
    try {
      const res = await api.get('/ventas');
      if (Array.isArray(res.data)) {
        const backendVentas: VentaRegistrada[] = res.data.map((item: any) => ({
          id: item.id,
          fecha: item.fecha || new Date().toLocaleDateString('es-CO'),
          cantidad: Number(item.cantidad),
          unidad: item.unidad,
          tipoGrano: item.tipoGrano,
          totalEstimado: Number(item.totalEstimado),
        }));
        setVentasGuardadas(backendVentas);
        await safeStorage.setItem(STORAGE_KEY_VENTAS, JSON.stringify(backendVentas));
        return;
      }
    } catch (e) {
      console.log('Backend offline o no autenticado, cargando historial de ventas desde safeStorage');
    }

    try {
      let saved = await safeStorage.getItem(STORAGE_KEY_VENTAS);
      if (!saved) {
        saved = await safeStorage.getItem('@cacaocare_ventas_registradas');
      }
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setVentasGuardadas(parsed);
        }
      }
    } catch (e) {
      console.warn('Error cargando historial de ventas local:', e);
    }
  }, []);

  useEffect(() => {
    loadMarketPrices();
    loadVentasGuardadas();
  }, [loadMarketPrices, loadVentasGuardadas]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadMarketPrices(), loadVentasGuardadas()]);
  };

  // Lógica de cálculo de la calculadora
  const calcularEstimacion = () => {
    const rawStr = (cantidadInput || '').toString().replace(',', '.').trim();
    const kilosBase = parseFloat(rawStr) || 0;
    if (kilosBase <= 0 || isNaN(kilosBase)) return { subtotal: 0, totalFinal: 0, kilosEquivalentes: 0 };

    // Convertir todo a kilogramos equivalentes
    let totalKg = kilosBase;
    if (unidadSeleccionada === 'arroba') totalKg = kilosBase * 12.5;
    if (unidadSeleccionada === 'carga') totalKg = kilosBase * 125;

    const precioBaseKg = priceData?.precioHoyKg || 14850;

    // Factor por tipo de grano
    let factorGrano = 1.0;
    if (tipoGrano === 'baba') factorGrano = 0.40; // rendimiento de secado ~40%
    if (tipoGrano === 'pasilla') factorGrano = 0.80; // pasilla ~80% del valor base

    // Factor por humedad
    let factorHumedad = 1.0;
    if (humedad === '9') factorHumedad = 0.97; // 3% descuento
    if (humedad === '12') factorHumedad = 0.93; // 7% descuento

    const valorBruto = totalKg * precioBaseKg * factorGrano;
    const totalFinal = Math.round(valorBruto * factorHumedad);
    const subtotalBruto = Math.round(totalKg * precioBaseKg);

    return {
      subtotal: isNaN(subtotalBruto) ? 0 : subtotalBruto,
      totalFinal: isNaN(totalFinal) ? 0 : totalFinal,
      kilosEquivalentes: isNaN(totalKg) ? 0 : Number(totalKg.toFixed(2)),
    };
  };

  const estimacion = calcularEstimacion();

  // Guardar cotización/venta estimada en backend & local
  const handleGuardarVenta = async () => {
    const rawStr = (cantidadInput || '').toString().replace(',', '.').trim();
    const cantNum = parseFloat(rawStr);

    if (isNaN(cantNum) || cantNum <= 0 || estimacion.totalFinal <= 0) {
      Alert.alert('Atención', 'Ingresa una cantidad válida mayor a 0 para calcular y guardar la venta.');
      return;
    }

    const unidadTexto = unidadSeleccionada === 'kg' ? 'Kg' : unidadSeleccionada === 'arroba' ? 'Arrobas (@)' : 'Cargas';
    const tipoGranoTexto = tipoGrano === 'seco' ? 'Seco Fermentado' : tipoGrano === 'baba' ? 'En Baba' : 'Pasilla';

    let ventaGuardadaRes: VentaRegistrada = {
      id: Date.now().toString() + '_' + Math.random().toString(36).substring(2, 6),
      fecha: new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }),
      cantidad: cantNum,
      unidad: unidadTexto,
      tipoGrano: tipoGranoTexto,
      totalEstimado: estimacion.totalFinal,
    };

    let savedOnBackend = false;
    let backendErrDetails = '';

    try {
      const res = await api.post('/ventas', {
        cantidad: cantNum,
        unidad: unidadTexto,
        tipoGrano: tipoGranoTexto,
        humedad: `${humedad}%`,
        totalEstimado: estimacion.totalFinal,
      });

      if (res.data && res.data.id) {
        savedOnBackend = true;
        ventaGuardadaRes = {
          id: res.data.id,
          fecha: res.data.fecha || ventaGuardadaRes.fecha,
          cantidad: Number(res.data.cantidad || cantNum),
          unidad: res.data.unidad || unidadTexto,
          tipoGrano: res.data.tipoGrano || tipoGranoTexto,
          totalEstimado: Number(res.data.totalEstimado || estimacion.totalFinal),
        };
      }
    } catch (err: any) {
      console.log('❌ Petición al backend falló:', JSON.stringify(err, null, 2));
      backendErrDetails = err?.detalles || err?.mensaje || err?.error || err?.message || 'Error desconocido';
      if (err?.tipo) {
        backendErrDetails += ` [${err.tipo}]`;
      }
    }

    try {
      const previas = Array.isArray(ventasGuardadas) ? ventasGuardadas : [];
      const actualizadas = [ventaGuardadaRes, ...previas];
      setVentasGuardadas(actualizadas);
      await safeStorage.setItem(STORAGE_KEY_VENTAS, JSON.stringify(actualizadas));

      if (savedOnBackend) {
        Alert.alert(
          '¡Venta Registrada en Base de Datos! ☁️',
          'El registro de la venta se ha guardado correctamente en la base de datos de CultivIA.'
        );
      } else {
        const motivo = backendErrDetails ? ` (${backendErrDetails})` : '';
        Alert.alert(
          '¡Venta Guardada Localmente! 📱',
          `La estimación se ha guardado en la memoria de tu dispositivo${motivo}. Se sincronizará con la base de datos al estar conectado y autenticado.`
        );
      }
    } catch (e: any) {
      console.error('Error al guardar registro local:', e);
      Alert.alert('Error', `No se pudo guardar la venta: ${e?.message || 'Error en memoria local'}`);
    }
  };

  const handleBorrarHistorial = async () => {
    Alert.alert(
      'Limpiar Historial',
      '¿Deseas eliminar todos los registros de ventas guardados?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí, eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete('/ventas');
            } catch (e) {
              console.log('Eliminando ventas localmente...');
            }
            setVentasGuardadas([]);
            await safeStorage.removeItem(STORAGE_KEY_VENTAS);
          },
        },
      ]
    );
  };

  const formatCOP = (val: number) => {
    if (val === undefined || val === null || isNaN(val)) return '$0';
    return '$' + Math.round(val).toLocaleString('es-CO');
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.container, { backgroundColor: colores.background }]}>
      {/* Header */}
      <View style={styles.header}>
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
          accessibilityLabel="Volver"
        >
          <ChevronLeftIcon color={colores.primary} size={24} />
        </TouchableOpacity>
        <Text style={[styles.title, { fontSize: getScaledFont(18), color: colores.onSurface }]}>
          Pagos y Ventas de Cacao
        </Text>
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
          onPress={loadMarketPrices}
          accessibilityLabel="Actualizar precios"
        >
          <SyncIcon color={colores.primary} size={20} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colores.primary} />}
      >
        {/* ======================================================== */}
        {/* SECCIÓN 1: PRECIO DEL CACAO AL DÍA Y MÁXIMO DEL MES */}
        {/* ======================================================== */}
        <View style={styles.sectionHeader}>
          <DollarIcon color={colores.primary} size={22} />
          <Text style={[styles.sectionTitle, { fontSize: getScaledFont(16), color: colores.onSurface }]}>
            Precio de Mercado al Día
          </Text>
        </View>

        {loadingPrice ? (
          <View style={[styles.card, { backgroundColor: colores.surfaceContainerLowest, padding: 24, alignItems: 'center' }]}>
            <ActivityIndicator size="small" color={colores.primary} />
            <Text style={{ marginTop: 8, color: colores.onSurfaceVariant, fontSize: getScaledFont(13) }}>
              Obteniendo precios de mercado en tiempo real...
            </Text>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            {/* Tarjeta de Precio del Día */}
            <View style={[styles.priceHeroCard, { backgroundColor: colores.primary }]}>
              <View style={styles.priceHeroHeader}>
                <Text style={[styles.priceHeroTag, { fontSize: getScaledFont(12) }]}>PRECIO DE REFERENCIA (HOY)</Text>
                <View
                  style={[
                    styles.badgeVariation,
                    { backgroundColor: priceData?.esPositiva ? 'rgba(255,255,255,0.25)' : 'rgba(255,100,100,0.3)' },
                  ]}
                >
                  <Text style={[styles.badgeVariationText, { fontSize: getScaledFont(12) }]}>
                    {priceData?.esPositiva ? '▲ +' : '▼ -'} {priceData?.variacionPorcentaje}%
                  </Text>
                </View>
              </View>

              <Text style={[styles.priceHeroMain, { fontSize: getScaledFont(32) }]}>
                {formatCOP(priceData?.precioHoyKg || 14850)} <Text style={{ fontSize: getScaledFont(16) }}>/ kg</Text>
              </Text>

              <View style={styles.priceHeroGrid}>
                <View style={styles.priceHeroGridItem}>
                  <Text style={[styles.priceHeroGridLabel, { fontSize: getScaledFont(11) }]}>Arroba (12.5 kg)</Text>
                  <Text style={[styles.priceHeroGridVal, { fontSize: getScaledFont(14) }]}>
                    {formatCOP(priceData?.precioHoyArroba || 185625)}
                  </Text>
                </View>
                <View style={styles.priceHeroGridItem}>
                  <Text style={[styles.priceHeroGridLabel, { fontSize: getScaledFont(11) }]}>Carga (125 kg)</Text>
                  <Text style={[styles.priceHeroGridVal, { fontSize: getScaledFont(14) }]}>
                    {formatCOP(priceData?.precioHoyCarga || 1856250)}
                  </Text>
                </View>
              </View>

              <Text style={[styles.priceHeroFooter, { fontSize: getScaledFont(10) }]}>
                Actualizado: {priceData?.fechaActualizacion} • Fuente: Mercado Internacional & Fedecacao
              </Text>
            </View>

            {/* Tarjeta de Máximo Histórico del Mes */}
            <View style={[styles.card, styles.maxRecordCard, { backgroundColor: colores.surfaceContainerLowest, borderColor: colores.outlineVariant }]}>
              <View style={styles.maxRecordIconBg}>
                <TrendUpIcon color="#2e7d32" size={24} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.maxRecordLabel, { fontSize: getScaledFont(12), color: colores.onSurfaceVariant }]}>
                  Máximo Histórico en el Mes
                </Text>
                <Text style={[styles.maxRecordVal, { fontSize: getScaledFont(20), color: colores.onSurface }]}>
                  {formatCOP(priceData?.maximoMesKg || 15600)} / kg
                </Text>
                <Text style={[styles.maxRecordSub, { fontSize: getScaledFont(11), color: colores.outline }]}>
                  Alcanzado el {priceData?.maximoFecha}
                </Text>
              </View>
            </View>

            {/* Gráfica / Tendencia Visual de los Últimos 30 días */}
            <View style={[styles.card, { backgroundColor: colores.surfaceContainerLowest, borderColor: colores.outlineVariant }]}>
              <Text style={[styles.chartTitle, { fontSize: getScaledFont(14), color: colores.onSurface }]}>
                📈 Tendencia del Precio en el Último Mes
              </Text>
              <View style={styles.chartBarsContainer}>
                {priceData?.historico30Dias.map((item, idx) => {
                  const maxVal = priceData.maximoMesKg || 16000;
                  const heightPct = Math.max(25, Math.round((item.precioKg / maxVal) * 100));
                  const isMax = item.precioKg === priceData.maximoMesKg;

                  return (
                    <View key={idx} style={styles.chartBarCol}>
                      <Text style={[styles.chartBarPrice, { fontSize: getScaledFont(9), color: isMax ? '#2e7d32' : colores.outline }]}>
                        ${(item.precioKg / 1000).toFixed(1)}k
                      </Text>
                      <View style={styles.chartBarTrack}>
                        <View
                          style={[
                            styles.chartBarFill,
                            {
                              height: `${heightPct}%`,
                              backgroundColor: isMax ? '#2e7d32' : colores.primary,
                            },
                          ]}
                        />
                      </View>
                      <Text style={[styles.chartBarLabel, { fontSize: getScaledFont(10), color: colores.onSurfaceVariant }]}>
                        {item.diaNombre}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>
        )}

        {/* ======================================================== */}
        {/* SECCIÓN 2: CALCULADORA INTERACTIVA DE INGRESO */}
        {/* ======================================================== */}
        <View style={[styles.sectionHeader, { marginTop: 24 }]}>
          <Text style={[styles.sectionTitle, { fontSize: getScaledFont(16), color: colores.onSurface }]}>
            🧮 Calculadora Estimada de Venta
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: colores.surfaceContainerLowest, borderColor: colores.outlineVariant }]}>
          {/* Input Cantidad */}
          <Text style={[styles.inputLabel, { fontSize: getScaledFont(13), color: colores.onSurface }]}>
            1. Cantidad a Vender:
          </Text>
          <View style={[styles.inputRow, { borderColor: colores.outlineVariant }]}>
            <TextInput
              style={[styles.numericInput, { fontSize: getScaledFont(18), color: colores.onSurface }]}
              keyboardType="numeric"
              value={cantidadInput}
              onChangeText={setCantidadInput}
              placeholder="0"
              placeholderTextColor={colores.outline}
            />
            <View style={styles.unitSelector}>
              {(['kg', 'arroba', 'carga'] as const).map((u) => {
                const isSelected = unidadSeleccionada === u;
                const label = u === 'kg' ? 'Kg' : u === 'arroba' ? '@ (12.5k)' : 'Carga (125k)';
                return (
                  <TouchableOpacity
                    key={u}
                    style={[
                      styles.unitChip,
                      isSelected && { backgroundColor: colores.primary, borderColor: colores.primary },
                    ]}
                    onPress={() => setUnidadSeleccionada(u)}
                  >
                    <Text style={[styles.unitChipText, isSelected && { color: '#ffffff', fontWeight: '700' }]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Tipo de Grano */}
          <Text style={[styles.inputLabel, { fontSize: getScaledFont(13), color: colores.onSurface, marginTop: 16 }]}>
            2. Estado / Tipo de Grano:
          </Text>
          <View style={styles.chipsGroup}>
            {[
              { key: 'seco', label: 'Seco Fermentado (100%)' },
              { key: 'baba', label: 'En Baba (~40% secado)' },
              { key: 'pasilla', label: 'Pasilla / Segunda (~80%)' },
            ].map((t) => {
              const isSel = tipoGrano === t.key;
              return (
                <TouchableOpacity
                  key={t.key}
                  style={[
                    styles.optionChip,
                    { backgroundColor: isSel ? colores.primary + '1A' : colores.surfaceContainer, borderColor: isSel ? colores.primary : colores.outlineVariant },
                  ]}
                  onPress={() => setTipoGrano(t.key as any)}
                >
                  <Text style={[styles.optionChipText, { fontSize: getScaledFont(12), color: isSel ? colores.primary : colores.onSurface }]}>
                    {isSel ? '✓ ' : ''}{t.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Humedad */}
          <Text style={[styles.inputLabel, { fontSize: getScaledFont(13), color: colores.onSurface, marginTop: 16 }]}>
            3. Humedad Estimada:
          </Text>
          <View style={styles.chipsGroup}>
            {[
              { key: '7', label: '7% Ideal (Sin desc.)' },
              { key: '9', label: '9% Húmedo (-3%)' },
              { key: '12', label: '12% Muy Húmedo (-7%)' },
            ].map((h) => {
              const isSel = humedad === h.key;
              return (
                <TouchableOpacity
                  key={h.key}
                  style={[
                    styles.optionChip,
                    { backgroundColor: isSel ? colores.primary + '1A' : colores.surfaceContainer, borderColor: isSel ? colores.primary : colores.outlineVariant },
                  ]}
                  onPress={() => setHumedad(h.key as any)}
                >
                  <Text style={[styles.optionChipText, { fontSize: getScaledFont(12), color: isSel ? colores.primary : colores.onSurface }]}>
                    {isSel ? '✓ ' : ''}{h.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Resultado de la Estimación */}
          <View style={[styles.resultBox, { backgroundColor: colores.primary + '0D', borderColor: colores.primary + '33' }]}>
            <Text style={[styles.resultLabel, { fontSize: getScaledFont(12), color: colores.onSurfaceVariant }]}>
              PAGO ESTIMADO A RECIBIR POR EL AGRICULTOR:
            </Text>
            <Text style={[styles.resultValue, { fontSize: getScaledFont(28), color: colores.primary }]}>
              {formatCOP(estimacion.totalFinal)}
            </Text>
            <Text style={[styles.resultSub, { fontSize: getScaledFont(11), color: colores.outline }]}>
              Equivalente a {estimacion.kilosEquivalentes} Kg • Precio Ref. {formatCOP(priceData?.precioHoyKg || 14850)}/kg
            </Text>

            <TouchableOpacity
              style={[styles.saveCalcBtn, { backgroundColor: colores.primary, height: botonesGrandes ? 52 : 44 }]}
              onPress={handleGuardarVenta}
            >
              <CheckIcon color="#ffffff" size={18} />
              <Text style={[styles.saveCalcBtnText, { fontSize: getScaledFont(14) }]}>
                Guardar Registro de Venta
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ======================================================== */}
        {/* SECCIÓN 3: HISTORIAL DE VENTAS REGISTRADAS */}
        {/* ======================================================== */}
        {ventasGuardadas.length > 0 && (
          <View style={{ marginTop: 24 }}>
            <View style={[styles.sectionHeader, { justifyContent: 'space-between' }]}>
              <Text style={[styles.sectionTitle, { fontSize: getScaledFont(16), color: colores.onSurface }]}>
                📋 Mis Ventas Registradas ({ventasGuardadas.length})
              </Text>
              <TouchableOpacity onPress={handleBorrarHistorial}>
                <Text style={{ fontSize: getScaledFont(12), color: colores.error, fontWeight: '600' }}>Limpiar</Text>
              </TouchableOpacity>
            </View>

            <View style={{ gap: 8 }}>
              {ventasGuardadas.map((v) => (
                <View
                  key={v.id}
                  style={[styles.saleHistoryCard, { backgroundColor: colores.surfaceContainerLowest, borderColor: colores.outlineVariant }]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.saleHistoryTitle, { fontSize: getScaledFont(14), color: colores.onSurface }]}>
                      {v.cantidad} {v.unidad} ({v.tipoGrano})
                    </Text>
                    <Text style={[styles.saleHistoryDate, { fontSize: getScaledFont(11), color: colores.onSurfaceVariant }]}>
                      Registrado el {v.fecha}
                    </Text>
                  </View>
                  <Text style={[styles.saleHistoryTotal, { fontSize: getScaledFont(15), color: colores.primary }]}>
                    {formatCOP(v.totalEstimado)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ======================================================== */}
        {/* SECCIÓN 4: PUNTOS DE ACOPIO Y COMPRADORES AUTORIZADOS */}
        {/* ======================================================== */}
        <View style={[styles.sectionHeader, { marginTop: 24 }]}>
          <Text style={[styles.sectionTitle, { fontSize: getScaledFont(16), color: colores.onSurface }]}>
            🏢 Puntos de Acopio & Cooperativas
          </Text>
        </View>

        <View style={{ gap: 10 }}>
          {[
            {
              nombre: 'Comité de Cacaoteros (Fedecacao)',
              ubicacion: 'Centro de Acopio Regional',
              telefono: '+57 310 555 0192',
              horario: 'Lun - Vie: 7:00 AM - 4:00 PM',
            },
            {
              nombre: 'Compañía Nacional de Chocolates',
              ubicacion: 'Agencia de Compra Directa',
              telefono: '+57 318 444 9800',
              horario: 'Lun - Sáb: 6:30 AM - 5:00 PM',
            },
            {
              nombre: 'Cooperativa de Agricultores CasaLuker',
              ubicacion: 'Punto de Recepción de Cacao Fino',
              telefono: '+57 312 888 3421',
              horario: 'Lun - Vie: 7:30 AM - 4:30 PM',
            },
          ].map((item, index) => (
            <View
              key={index}
              style={[styles.card, styles.acopioCard, { backgroundColor: colores.surfaceContainerLowest, borderColor: colores.outlineVariant }]}
            >
              <Text style={[styles.acopioName, { fontSize: getScaledFont(14), color: colores.onSurface }]}>
                {item.nombre}
              </Text>
              <View style={styles.acopioRow}>
                <MapPinIcon color={colores.outline} size={16} />
                <Text style={[styles.acopioText, { fontSize: getScaledFont(12), color: colores.onSurfaceVariant }]}>
                  {item.ubicacion}
                </Text>
              </View>
              <View style={styles.acopioRow}>
                <PhoneIcon color={colores.primary} size={16} />
                <Text style={[styles.acopioText, { fontSize: getScaledFont(12), color: colores.primary, fontWeight: '600' }]}>
                  {item.telefono} ({item.horario})
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* ======================================================== */}
        {/* SECCIÓN 5: CONSEJOS DE COMERCIALIZACIÓN */}
        {/* ======================================================== */}
        <View style={[styles.sectionHeader, { marginTop: 24 }]}>
          <Text style={[styles.sectionTitle, { fontSize: getScaledFont(16), color: colores.onSurface }]}>
            💡 Consejos para la Venta
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: colores.surfaceContainerLowest, borderColor: colores.outlineVariant, marginBottom: 40 }]}>
          {[
            'Asegúrate de fermentar el grano entre 5 y 6 días en cajones de madera para lograr el aroma óptimo.',
            'Seca el cacao al sol hasta alcanzar una humedad máxima del 7% para evitar castigos en el precio.',
            'Clasifica y separa el grano pasilla o dañado antes de llevarlo al centro de acopio.',
          ].map((tip, idx) => (
            <View key={idx} style={styles.tipItem}>
              <Text style={{ fontSize: getScaledFont(14), color: colores.primary, marginRight: 8 }}>•</Text>
              <Text style={[styles.tipText, { fontSize: getScaledFont(12), color: colores.onSurfaceVariant }]}>
                {tip}
              </Text>
            </View>
          ))}
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
  backBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontWeight: '700',
  },
  scroll: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 8,
  },
  sectionTitle: {
    fontWeight: '700',
    marginLeft: 6,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  priceHeroCard: {
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  priceHeroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceHeroTag: {
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  badgeVariation: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeVariationText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  priceHeroMain: {
    color: '#ffffff',
    fontWeight: '800',
    marginVertical: 8,
  },
  priceHeroGrid: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
    paddingTop: 12,
    marginTop: 4,
  },
  priceHeroGridItem: {
    flex: 1,
  },
  priceHeroGridLabel: {
    color: 'rgba(255,255,255,0.75)',
  },
  priceHeroGridVal: {
    color: '#ffffff',
    fontWeight: '700',
    marginTop: 2,
  },
  priceHeroFooter: {
    color: 'rgba(255,255,255,0.65)',
    marginTop: 12,
  },
  maxRecordCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  maxRecordIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e8f5e9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  maxRecordLabel: {
    fontWeight: '600',
  },
  maxRecordVal: {
    fontWeight: '800',
    marginVertical: 2,
  },
  maxRecordSub: {},
  chartTitle: {
    fontWeight: '700',
    marginBottom: 16,
  },
  chartBarsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 120,
    paddingTop: 10,
  },
  chartBarCol: {
    alignItems: 'center',
    flex: 1,
  },
  chartBarPrice: {
    fontWeight: '700',
    marginBottom: 4,
  },
  chartBarTrack: {
    width: 14,
    height: 80,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 7,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  chartBarFill: {
    width: '100%',
    borderRadius: 7,
  },
  chartBarLabel: {
    marginTop: 6,
    fontWeight: '500',
  },
  inputLabel: {
    fontWeight: '700',
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  numericInput: {
    flex: 1,
    fontWeight: '700',
    paddingVertical: 4,
  },
  unitSelector: {
    flexDirection: 'row',
    gap: 4,
  },
  unitChip: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  unitChipText: {
    fontSize: 11,
  },
  chipsGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  optionChipText: {
    fontWeight: '600',
  },
  resultBox: {
    marginTop: 20,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  resultLabel: {
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  resultValue: {
    fontWeight: '800',
    marginVertical: 4,
  },
  resultSub: {
    marginBottom: 16,
  },
  saveCalcBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingHorizontal: 20,
    width: '100%',
    gap: 8,
  },
  saveCalcBtnText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  saleHistoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  saleHistoryTitle: {
    fontWeight: '700',
  },
  saleHistoryDate: {
    marginTop: 2,
  },
  saleHistoryTotal: {
    fontWeight: '800',
  },
  acopioCard: {
    gap: 4,
  },
  acopioName: {
    fontWeight: '700',
  },
  acopioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  acopioText: {},
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 4,
  },
  tipText: {
    flex: 1,
  },
});
