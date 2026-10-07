import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Switch, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAccesibilidad, TamanoTextoType } from '../contexts/AccesibilidadContext';
import { usePerfilStore } from '../store/usePerfilStore';
import { ChevronLeftIcon } from '../components/Icons';
import { Toast } from '../components/Toast';

export const ConfiguracionScreen = ({ navigation }: any) => {
  const {
    tamanoTexto,
    altoContraste,
    lectorPantalla,
    botonesGrandes,
    escalaTexto,
    colores,
    setTamanoTexto,
    setAltoContraste,
    setLectorPantalla,
    setBotonesGrandes,
  } = useAccesibilidad();

  const { perfil, updatePerfil } = usePerfilStore();
  const [notif, setNotif] = useState(perfil ? perfil.notificacionesActivas : true);
  const [toastVisible, setToastVisible] = useState(false);

  const handleSave = async () => {
    try {
      await updatePerfil({ notificacionesActivas: notif });
      setToastVisible(true);
    } catch (err) {
      console.warn('Error al guardar notificaciones', err);
    }
  };

  // Base font sizing helper
  const getScaledFont = (size: number) => size * escalaTexto;

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.container, { backgroundColor: colores.background }]}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={[styles.backBtn, { backgroundColor: colores.surfaceContainer }]} 
          onPress={() => navigation.goBack()}
        >
          <ChevronLeftIcon color={colores.primary} size={24} />
        </TouchableOpacity>
        <Text style={[styles.title, { fontSize: getScaledFont(18), color: colores.onSurface }]}>
          Configuración
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.sectionTitle, { fontSize: getScaledFont(16), color: colores.secondary, marginTop: 12 }]}>
          Accesibilidad Visual
        </Text>
        <Text style={[styles.sectionDesc, { fontSize: getScaledFont(13), color: colores.onSurfaceVariant }]}>
          Ajusta la apariencia de la aplicación para facilitar su lectura en exteriores.
        </Text>

        <View style={[styles.card, { backgroundColor: colores.surfaceContainerLowest, borderColor: colores.outlineVariant }]}>
          <View style={styles.rowBetween}>
            <View style={{ flex: 1, marginRight: 16 }}>
              <Text style={[styles.settingLabel, { fontSize: getScaledFont(15), color: colores.onSurface }]}>
                Tamaño del Texto
              </Text>
              <Text style={[styles.settingDesc, { fontSize: getScaledFont(12), color: colores.onSurfaceVariant }]}>
                Aumenta el tamaño de la letra para verla mejor.
              </Text>
            </View>
          </View>
          
          <View style={styles.selectorRow}>
            {(['pequeno', 'normal', 'grande'] as TamanoTextoType[]).map((t) => (
              <TouchableOpacity
                key={t}
                style={[
                  styles.selectorBtn,
                  tamanoTexto === t && { backgroundColor: colores.primary },
                  { borderColor: colores.outlineVariant }
                ]}
                onPress={() => setTamanoTexto(t)}
              >
                <Text
                  style={[
                    styles.selectorText,
                    { fontSize: getScaledFont(13) },
                    tamanoTexto === t ? { color: '#ffffff', fontWeight: '700' } : { color: colores.onSurface }
                  ]}
                >
                  {t.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Toggles */}
        <View style={[styles.card, { backgroundColor: colores.surfaceContainerLowest, borderColor: colores.outlineVariant }]}>
          <View style={styles.toggleRow}>
            <View style={{ flex: 1, marginRight: 16 }}>
              <Text style={[styles.settingLabel, { fontSize: getScaledFont(15), color: colores.onSurface }]}>
                Alto Contraste
              </Text>
              <Text style={[styles.settingDesc, { fontSize: getScaledFont(12), color: colores.onSurfaceVariant }]}>
                Optimiza colores para legibilidad bajo luz solar directa.
              </Text>
            </View>
            <Switch
              value={altoContraste}
              onValueChange={setAltoContraste}
              trackColor={{ false: '#dcdcdc', true: colores.primary }}
              thumbColor={altoContraste ? '#ffffff' : '#f4f3f4'}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.toggleRow}>
            <View style={{ flex: 1, marginRight: 16 }}>
              <Text style={[styles.settingLabel, { fontSize: getScaledFont(15), color: colores.onSurface }]}>
                Botones Grandes
              </Text>
              <Text style={[styles.settingDesc, { fontSize: getScaledFont(12), color: colores.onSurfaceVariant }]}>
                Aumenta las áreas táctiles para evitar toques erróneos.
              </Text>
            </View>
            <Switch
              value={botonesGrandes}
              onValueChange={setBotonesGrandes}
              trackColor={{ false: '#dcdcdc', true: colores.primary }}
              thumbColor={botonesGrandes ? '#ffffff' : '#f4f3f4'}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.toggleRow}>
            <View style={{ flex: 1, marginRight: 16 }}>
              <Text style={[styles.settingLabel, { fontSize: getScaledFont(15), color: colores.onSurface }]}>
                Lector de Pantalla
              </Text>
              <Text style={[styles.settingDesc, { fontSize: getScaledFont(12), color: colores.onSurfaceVariant }]}>
                Activa descripciones de audio para personas con visión reducida.
              </Text>
            </View>
            <Switch
              value={lectorPantalla}
              onValueChange={setLectorPantalla}
              trackColor={{ false: '#dcdcdc', true: colores.primary }}
              thumbColor={lectorPantalla ? '#ffffff' : '#f4f3f4'}
            />
          </View>
        </View>

        <Text style={[styles.sectionTitle, { fontSize: getScaledFont(16), color: colores.secondary, marginTop: 24 }]}>
          Notificaciones y Finca
        </Text>

        <View style={[styles.card, { backgroundColor: colores.surfaceContainerLowest, borderColor: colores.outlineVariant }]}>
          <View style={styles.toggleRow}>
            <View style={{ flex: 1, marginRight: 16 }}>
              <Text style={[styles.settingLabel, { fontSize: getScaledFont(15), color: colores.onSurface }]}>
                Notificaciones de Diagnóstico
              </Text>
              <Text style={[styles.settingDesc, { fontSize: getScaledFont(12), color: colores.onSurfaceVariant }]}>
                Recibe alertas cuando un experto valide el estado de tu cultivo.
              </Text>
            </View>
            <Switch
              value={notif}
              onValueChange={setNotif}
              trackColor={{ false: '#dcdcdc', true: colores.primary }}
              thumbColor={notif ? '#ffffff' : '#f4f3f4'}
            />
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.saveBtn,
            {
              backgroundColor: colores.primary,
              height: botonesGrandes ? 64 : 48,
              borderRadius: botonesGrandes ? 32 : 24,
            }
          ]}
          onPress={handleSave}
        >
          <Text style={[styles.saveBtnText, { fontSize: getScaledFont(16) }]}>
            Guardar Cambios
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <Toast
        message="Configuración guardada exitosamente"
        visible={toastVisible}
        onHide={() => setToastVisible(false)}
      />
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
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontWeight: '700' },
  scroll: { paddingHorizontal: 24, paddingBottom: 40 },
  sectionTitle: { fontWeight: '700', marginBottom: 4 },
  sectionDesc: { marginBottom: 16, lineHeight: 18 },
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  settingLabel: { fontWeight: '700', marginBottom: 2 },
  settingDesc: { lineHeight: 16 },
  selectorRow: { flexDirection: 'row', gap: 8, marginTop: 16 },
  selectorBtn: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  selectorText: { fontWeight: '600' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  divider: { height: 1, backgroundColor: '#f0f0f0', marginVertical: 14 },
  saveBtn: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  saveBtnText: { color: '#ffffff', fontWeight: '700' },
});
