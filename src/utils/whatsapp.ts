import { Linking, Alert } from 'react-native';

/**
 * Normaliza un número telefónico para formato internacional de WhatsApp.
 * Por defecto asume código de país +57 (Colombia) si tiene 10 dígitos y empieza por 3.
 */
export const formatearTelefonoWhatsApp = (telefono: string): string => {
  // Remover caracteres no numéricos
  const clean = telefono.replace(/\D/g, '');

  // Si ya tiene código de país (ej. 573001234567 con 12 dígitos)
  if (clean.length === 12 && clean.startsWith('57')) {
    return clean;
  }

  // Si es celular colombiano estándar de 10 dígitos (ej. 3001234567)
  if (clean.length === 10 && clean.startsWith('3')) {
    return `57${clean}`;
  }

  return clean;
};

/**
 * Abre la app de WhatsApp con un número y mensaje predeterminado.
 * Si falla o WhatsApp no está instalado, ofrece llamar por teléfono normal.
 */
export const abrirWhatsApp = async (
  telefono: string,
  mensaje: string = 'Hola, te escribo desde la aplicación CacaoScan.'
): Promise<void> => {
  if (!telefono || telefono.trim() === '') {
    Alert.alert('Contacto no disponible', 'No se ha registrado un número telefónico para este contacto.');
    return;
  }

  const numeroWhatsApp = formatearTelefonoWhatsApp(telefono);
  const mensajeEncoded = encodeURIComponent(mensaje);
  const url = `https://wa.me/${numeroWhatsApp}?text=${mensajeEncoded}`;

  try {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      // Intento directo en caso de que canOpenURL devuelva false en algunos Android modernos sin queries en manifest
      await Linking.openURL(url);
    }
  } catch (error) {
    Alert.alert(
      'No se pudo abrir WhatsApp',
      `¿Deseas realizar una llamada telefónica convencional al número ${telefono}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Llamar', onPress: () => llamarTelefono(telefono) },
      ]
    );
  }
};

/**
 * Inicia una llamada telefónica convencional.
 */
export const llamarTelefono = async (telefono: string): Promise<void> => {
  if (!telefono || telefono.trim() === '') {
    Alert.alert('Contacto no disponible', 'No se ha registrado un número telefónico para este contacto.');
    return;
  }

  const clean = telefono.replace(/\D/g, '');
  const url = `tel:${clean}`;

  try {
    await Linking.openURL(url);
  } catch (error) {
    Alert.alert('Error', 'No se pudo iniciar la llamada en este dispositivo.');
  }
};
