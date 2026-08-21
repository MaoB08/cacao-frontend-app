import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useAccesibilidad } from '../../contexts/AccesibilidadContext';

export type MapType = 'standard' | 'satellite' | 'hybrid';

interface MapTypeSelectorProps {
  currentType: MapType;
  onChangeType: (type: MapType) => void;
}

const MAP_TYPES: { key: MapType; label: string; icon: string }[] = [
  { key: 'standard', label: 'Mapa', icon: '🗺️' },
  { key: 'satellite', label: 'Satélite', icon: '🛰️' },
  { key: 'hybrid', label: 'Híbrido', icon: '🌍' },
];

/**
 * Botón flotante que despliega un selector de tipo de mapa
 * (Standard / Satellite / Hybrid).
 */
export const MapTypeSelector: React.FC<MapTypeSelectorProps> = ({
  currentType,
  onChangeType,
}) => {
  const { colores, escalaTexto } = useAccesibilidad();
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.container}>
      {expanded && (
        <View style={[styles.menu, { backgroundColor: colores.surfaceContainerLowest }]}>
          {MAP_TYPES.map((item) => (
            <TouchableOpacity
              key={item.key}
              style={[
                styles.menuItem,
                currentType === item.key && [
                  styles.menuItemActive,
                  { backgroundColor: colores.primary + '18' },
                ],
              ]}
              onPress={() => {
                onChangeType(item.key);
                setExpanded(false);
              }}
            >
              <Text style={{ fontSize: 16 }}>{item.icon}</Text>
              <Text
                style={[
                  styles.menuLabel,
                  {
                    color: currentType === item.key ? colores.primary : colores.onSurfaceVariant,
                    fontSize: 12 * escalaTexto,
                  },
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colores.surfaceContainerLowest }]}
        onPress={() => setExpanded(!expanded)}
      >
        <Text style={{ fontSize: 20 }}>
          {MAP_TYPES.find((t) => t.key === currentType)?.icon || '🗺️'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    right: 16,
    zIndex: 10,
    alignItems: 'flex-end',
  },
  fab: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 6,
  },
  menu: {
    borderRadius: 14,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  menuItemActive: {
    borderRadius: 10,
  },
  menuLabel: {
    fontWeight: '600',
  },
});
