import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Theme } from '../constants/theme';

export type TamanoTextoType = 'pequeno' | 'normal' | 'grande';

interface AccesibilidadConfig {
  tamanoTexto: TamanoTextoType;
  altoContraste: boolean;
  lectorPantalla: boolean;
  botonesGrandes: boolean;
}

interface AccesibilidadContextData extends AccesibilidadConfig {
  escalaTexto: number;
  escalaBoton: number;
  colores: typeof Theme.colors;
  setTamanoTexto: (val: TamanoTextoType) => void;
  setAltoContraste: (val: boolean) => void;
  setLectorPantalla: (val: boolean) => void;
  setBotonesGrandes: (val: boolean) => void;
}

const STORAGE_KEY = 'cacao_accesibilidad';

const AccesibilidadContext = createContext<AccesibilidadContextData | undefined>(undefined);

export const AccesibilidadProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<AccesibilidadConfig>({
    tamanoTexto: 'normal',
    altoContraste: false,
    lectorPantalla: false,
    botonesGrandes: false,
  });

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          setConfig(JSON.parse(stored));
        }
      } catch (e) {
        console.warn('Error al cargar accesibilidad', e);
      }
    };
    loadConfig();
  }, []);

  const saveConfig = async (newConfig: AccesibilidadConfig) => {
    try {
      setConfig(newConfig);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
    } catch (e) {
      console.warn('Error al guardar accesibilidad', e);
    }
  };

  const setTamanoTexto = (tamanoTexto: TamanoTextoType) => {
    saveConfig({ ...config, tamanoTexto });
  };

  const setAltoContraste = (altoContraste: boolean) => {
    saveConfig({ ...config, altoContraste });
  };

  const setLectorPantalla = (lectorPantalla: boolean) => {
    saveConfig({ ...config, lectorPantalla });
  };

  const setBotonesGrandes = (botonesGrandes: boolean) => {
    saveConfig({ ...config, botonesGrandes });
  };

  // Factores de escala
  let escalaTexto = 1.0;
  if (config.tamanoTexto === 'pequeno') escalaTexto = 0.85;
  if (config.tamanoTexto === 'grande') escalaTexto = 1.25;

  let escalaBoton = config.botonesGrandes ? 1.25 : 1.0;

  // Colores dinámicos para alto contraste
  const colores = { ...Theme.colors };
  if (config.altoContraste) {
    colores.background = '#ffffff';
    colores.surface = '#ffffff';
    colores.surfaceContainerLowest = '#ffffff';
    colores.surfaceContainer = '#f5f5f5';
    colores.onSurface = '#000000';
    colores.onSurfaceVariant = '#222222';
    colores.primary = '#002201'; // Más oscuro
    colores.secondary = '#2b1611'; // Más oscuro
    colores.outline = '#000000';
    colores.outlineVariant = '#888888';
  }

  return (
    <AccesibilidadContext.Provider
      value={{
        ...config,
        escalaTexto,
        escalaBoton,
        colores,
        setTamanoTexto,
        setAltoContraste,
        setLectorPantalla,
        setBotonesGrandes,
      }}
    >
      {children}
    </AccesibilidadContext.Provider>
  );
};

export const useAccesibilidad = () => {
  const context = useContext(AccesibilidadContext);
  if (!context) {
    throw new Error('useAccesibilidad debe usarse dentro de AccesibilidadProvider');
  }
  return context;
};
