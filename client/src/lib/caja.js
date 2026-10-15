export const ETIQUETAS_CATEGORIA = {
  venta: 'Venta',
  compra: 'Compra',
  anulacion_venta: 'Anulación de venta',
  anulacion_compra: 'Anulación de compra',
  transferencia: 'Transferencia',
  retiro_socio: 'Retiro de socio',
  aporte_socio: 'Aporte de socio',
  ajuste_saldo: 'Ajuste de saldo',
};

export const etiquetaMovimiento = (m) =>
  ETIQUETAS_CATEGORIA[m.categoria] ?? m.categoria ?? (m.tipo === 'ingreso' ? 'Ingreso' : 'Egreso');