import { useState, useCallback } from 'react';
import { LoteMapa, LoteDetalle } from '../types/geo';
import { loteService } from '../services/loteService';

/**
 * Hook para gestionar el estado de los lotes en la vista del mapa.
 * Carga los lotes del usuario, maneja la selección y la recarga.
 */
export function useLotes() {
  const [lotes, setLotes] = useState<LoteMapa[]>([]);
  const [loteSeleccionado, setLoteSeleccionado] = useState<LoteDetalle | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Carga todos los lotes del usuario para renderizar en el mapa.
   */
  const cargarLotes = useCallback(async () => {
    try {
      setCargando(true);
      setError(null);
      const data = await loteService.obtenerMapa();
      setLotes(data);
    } catch (err: any) {
      const mensaje = err?.mensaje || err?.message || 'Error al cargar los lotes';
      setError(mensaje);
      console.error('Error cargando lotes:', err);
    } finally {
      setCargando(false);
    }
  }, []);

  /**
   * Selecciona un lote y carga su detalle completo (con estadísticas).
   */
  const seleccionarLote = useCallback(async (loteId: string) => {
    try {
      setCargando(true);
      const detalle = await loteService.obtenerDetalle(loteId);
      setLoteSeleccionado(detalle);
    } catch (err: any) {
      console.error('Error cargando detalle del lote:', err);
    } finally {
      setCargando(false);
    }
  }, []);

  /**
   * Deselecciona el lote actual (cierra el Bottom Sheet).
   */
  const deseleccionarLote = useCallback(() => {
    setLoteSeleccionado(null);
  }, []);

  /**
   * Agrega un lote recién creado a la lista local sin recargar desde el servidor.
   */
  const agregarLoteLocal = useCallback((nuevoLote: LoteMapa) => {
    setLotes((prev) => [nuevoLote, ...prev]);
  }, []);

  return {
    lotes,
    loteSeleccionado,
    cargando,
    error,
    cargarLotes,
    seleccionarLote,
    deseleccionarLote,
    agregarLoteLocal,
  };
}
