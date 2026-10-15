export const ETIQUETAS_ESTADO_PEDIDO = {
  acumulando: 'Acumulando',
  empaquetado: 'Empaquetado',
  en_agencia: 'En agencia',
  recibido: 'Recibido',
  cancelado: 'Cancelado',
};

export const ESTILOS_ESTADO_PEDIDO = {
  acumulando: 'bg-amber-100 text-amber-700 hover:bg-amber-100',
  empaquetado: 'bg-blue-100 text-blue-700 hover:bg-blue-100',
  en_agencia: 'bg-purple-100 text-purple-700 hover:bg-purple-100',
  recibido: 'bg-green-100 text-green-700 hover:bg-green-100',
  cancelado: 'bg-gray-100 text-gray-600 hover:bg-gray-100',
};

export const ORDEN_ESTADOS = ['acumulando', 'empaquetado', 'en_agencia', 'recibido'];
export const COLUMNAS_TABLERO = ['acumulando', 'empaquetado', 'en_agencia'];

// ¿Pasar de "desde" a "hacia" es avanzar en el flujo? (cancelar no cuenta como avance)
export const esAvance = (desde, hacia) => ORDEN_ESTADOS.indexOf(hacia) > ORDEN_ESTADOS.indexOf(desde);

export function textoTransicion(desde, hacia) {
  if (hacia === 'cancelado') return 'Cancelar pedido';
  if (esAvance(desde, hacia)) {
    return {
      empaquetado: 'Marcar como empaquetado',
      en_agencia: 'Marcar enviado a agencia',
      recibido: 'Marcar como recibido',
    }[hacia];
  }
  return `Volver a "${ETIQUETAS_ESTADO_PEDIDO[hacia].toLowerCase()}"`;
}

export function descripcionTransicion(desde, hacia) {
  if (hacia === 'cancelado') return 'El pedido quedará cancelado. Es posible porque no tiene ventas activas.';
  if (hacia === 'empaquetado' && desde === 'acumulando') {
    return 'Dejará de recibir ventas nuevas: si el cliente vuelve a comprar, se creará un pedido nuevo.';
  }
  if (hacia === 'en_agencia' && desde === 'empaquetado') return 'Se registrará hoy como fecha de envío.';
  if (hacia === 'recibido') return 'Se registrará hoy como fecha de recepción.';
  if (hacia === 'acumulando') {
    return 'Volverá a recibir ventas nuevas del cliente. Se borrarán las fechas de envío y recepción.';
  }
  if (hacia === 'empaquetado' && desde === 'en_agencia') return 'Se borrará la fecha de envío.';
  if (hacia === 'en_agencia' && desde === 'recibido') return 'Se borrará la fecha de recepción.';
  return '';
}

const DIA_MS = 24 * 60 * 60 * 1000;

export const diasDesde = (fecha) => Math.max(0, Math.floor((Date.now() - new Date(fecha).getTime()) / DIA_MS));

export function textoAntiguedad(dias) {
  if (dias === 0) return 'hoy';
  if (dias === 1) return 'hace 1 día';
  return `hace ${dias} días`;
}