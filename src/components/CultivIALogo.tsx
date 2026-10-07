import React from 'react';
import { Image, ImageStyle, StyleProp, View } from 'react-native';

interface CultivIALogoProps {
  size?: number;
  width?: number;
  height?: number;
  style?: StyleProp<ImageStyle>;
}

export const CultivIALogo: React.FC<CultivIALogoProps> = ({
  size = 80,
  width,
  height,
  style,
}) => {
  const w = width ?? size;
  const h = height ?? size;

  return (
    <View style={{ width: w, height: h, overflow: 'hidden' }}>
      <Image
        source={require('../../assets/logo.png')}
        style={[
          {
            width: w * 2,
            height: h * 2,
            left: -w / 2,
            top: -h / 2,
          },
          style,
        ]}
        resizeMode="contain"
        accessibilityLabel="Logo CultivIA"
      />
    </View>
  );
};

export default CultivIALogo;
