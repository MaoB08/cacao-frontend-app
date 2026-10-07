export const Theme = {
  colors: {
    primary: '#154212', // Deep Natural Green
    primaryContainer: '#2d5a27',
    secondary: '#755750', // Cocoa Brown
    secondaryContainer: '#ffd7ce',
    tertiary: '#ffb95f', // Vibrant Amber
    background: '#fbfbe2', // Earthy Beige
    surface: '#fbfbe2',
    surfaceContainer: '#efefd7',
    surfaceContainerLowest: '#ffffff',
    onPrimary: '#ffffff',
    onSecondary: '#ffffff',
    onBackground: '#1b1d0e',
    onSurface: '#1b1d0e',
    onSurfaceVariant: '#42493e',
    outline: '#72796e',
    outlineVariant: '#c2c9bb',
    error: '#ba1a1a',
    errorContainer: '#ffdad6',
    success: '#10b981', // Emerald Success
  },
  roundness: {
    sm: 8,
    default: 16,
    md: 24,
    lg: 32,
    full: 9999,
  },
  spacing: {
    base: 8,
    stackSm: 8,
    stackMd: 16,
    stackLg: 32,
    marginMobile: 24,
    gutterMobile: 16,
    touchTargetMin: 48,
  },
  fonts: {
    // We fall back to standard fonts on Android/iOS but map styling weights
    headline: {
      fontFamily: 'System', // Montserrat in design, fallback System
      fontWeight: '700' as const,
    },
    body: {
      fontFamily: 'System', // Inter in design, fallback System
      fontWeight: '400' as const,
    },
    label: {
      fontFamily: 'System',
      fontWeight: '600' as const,
    },
  }
};
