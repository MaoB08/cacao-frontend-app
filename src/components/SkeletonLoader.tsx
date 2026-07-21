import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, ViewStyle } from 'react-native';
import { Theme } from '../constants/theme';

interface SkeletonProps {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export const SkeletonLoader = ({ width, height, borderRadius = 8, style }: SkeletonProps) => {
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: Theme.colors.surfaceContainer,
          opacity: pulseAnim,
        },
        style,
      ]}
    />
  );
};

// Pre-built skeleton layouts for common patterns
export const ProfileSkeleton = () => (
  <View style={skeletonStyles.container}>
    <View style={skeletonStyles.header}>
      <SkeletonLoader width={60} height={60} borderRadius={30} />
      <View style={{ marginLeft: 16, flex: 1 }}>
        <SkeletonLoader width="70%" height={20} />
        <SkeletonLoader width="50%" height={14} style={{ marginTop: 8 }} />
      </View>
    </View>
    <View style={skeletonStyles.statsRow}>
      <SkeletonLoader width="47%" height={90} borderRadius={16} />
      <SkeletonLoader width="47%" height={90} borderRadius={16} />
    </View>
    <SkeletonLoader width="100%" height={70} borderRadius={16} style={{ marginTop: 16 }} />
    <SkeletonLoader width="100%" height={56} borderRadius={16} style={{ marginTop: 24 }} />
    <SkeletonLoader width="100%" height={56} borderRadius={16} style={{ marginTop: 12 }} />
    <SkeletonLoader width="100%" height={56} borderRadius={16} style={{ marginTop: 12 }} />
  </View>
);

export const ExpertoCardSkeleton = () => (
  <View style={skeletonStyles.expertoCard}>
    <SkeletonLoader width={56} height={56} borderRadius={28} />
    <View style={{ marginLeft: 12, flex: 1 }}>
      <SkeletonLoader width="60%" height={16} />
      <SkeletonLoader width="40%" height={12} style={{ marginTop: 6 }} />
      <SkeletonLoader width="80%" height={12} style={{ marginTop: 6 }} />
      <SkeletonLoader width={90} height={32} borderRadius={16} style={{ marginTop: 8 }} />
    </View>
  </View>
);

export const ExpertosListSkeleton = () => (
  <View>
    <SkeletonLoader width="100%" height={44} borderRadius={22} style={{ marginBottom: 16 }} />
    <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
      <SkeletonLoader width={70} height={32} borderRadius={16} />
      <SkeletonLoader width={70} height={32} borderRadius={16} />
      <SkeletonLoader width={70} height={32} borderRadius={16} />
    </View>
    <ExpertoCardSkeleton />
    <ExpertoCardSkeleton />
    <ExpertoCardSkeleton />
  </View>
);

const skeletonStyles = StyleSheet.create({
  container: { padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  expertoCard: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: Theme.colors.surfaceContainerLowest,
    borderRadius: 16,
    marginBottom: 12,
  },
});
