const moneda = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' });
const costo = new Intl.NumberFormat('es-PE', {
  style: 'currency',
  currency: 'PEN',
  minimumFractionDigits: 2,
  maximumFractionDigits: 4,
});
const fechaHora = new Intl.DateTimeFormat('es-PE', { dateStyle: 'short', timeStyle: 'short' });

// S/ 1,234.50
export const formatearSoles = (n) => moneda.format(n ?? 0);
// Hasta 4 decimales, para costos promedio como S/ 3.3333
export const formatearCosto = (n) => costo.format(n ?? 0);
export const formatearFechaHora = (f) => fechaHora.format(new Date(f));

const ZONA = 'America/Lima';
const DIA_MS = 24 * 60 * 60 * 1000;

// Fecha de hoy en Lima, formato AAAA-MM-DD
export const hoyLima = () => new Date().toLocaleDateString('en-CA', { timeZone: ZONA });

const formatoHora = new Intl.DateTimeFormat('es-PE', { hour: '2-digit', minute: '2-digit', timeZone: ZONA });
export const formatearHora = (fecha) => formatoHora.format(new Date(fecha));

const formatoDia = new Intl.DateTimeFormat('es-PE', { dateStyle: 'full', timeZone: ZONA });
// "lunes, 12 de octubre de 2026"
export const formatearDia = (aaaammdd) => formatoDia.format(new Date(`${aaaammdd}T12:00:00-05:00`));

// Suma o resta días a una fecha AAAA-MM-DD
export function sumarDias(aaaammdd, dias) {
  const base = new Date(`${aaaammdd}T12:00:00-05:00`);
  return new Date(base.getTime() + dias * DIA_MS).toLocaleDateString('en-CA', { timeZone: ZONA });
}