import React from 'react';
import { StyleSheet, Text, View, Animated } from 'react-native';
import { useAuthStore } from '../store/useAuthStore';
import { Theme } from '../constants/theme';
import { WarningIcon } from '../components/Icons';

export const OfflineBanner = () => {
  const isConnected = useAuthStore((state) => state.isConnected);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: isConnected ? 0 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isConnected, fadeAnim]);

  if (isConnected) return null;

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.banner}>
        <View style={{ marginRight: 8 }}>
          <WarningIcon color="#ffffff" size={18} />
        </View>
        <Text style={styles.text}>Modo sin conexión activo (Señal limitada en Catatumbo)</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: Theme.spacing.marginMobile,
    right: Theme.spacing.marginMobile,
    zIndex: 1000,
  },
  banner: {
    backgroundColor: Theme.colors.secondary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: Theme.roundness.default,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  icon: {
    marginRight: 8,
    fontSize: 16,
  },
  text: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    flex: 1,
  },
});
