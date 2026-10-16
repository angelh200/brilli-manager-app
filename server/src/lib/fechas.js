const ZONA = 'America/Lima';

// Fecha de hoy en Lima, formato AAAA-MM-DD
export function hoyLima() {
  return new Date().toLocaleDateString('en-CA', { timeZone: ZONA });
}

// Rango [00:00, 24:00) de un día en hora de Lima (Perú no usa horario de verano)
export function rangoDia(fecha) {
  const inicio = new Date(`${fecha}T00:00:00-05:00`);
  const fin = new Date(inicio.getTime() + 24 * 60 * 60 * 1000);
  return { gte: inicio, lt: fin };
}

// Periodo actual en Lima, formato AAAA-MM
export const periodoActual = () => hoyLima().slice(0, 7);

// Rango [primer día 00:00, primer día del mes siguiente 00:00) en hora de Lima
export function rangoMes(periodo) {
  const [anio, mes] = periodo.split('-').map(Number);
  const siguiente = mes === 12 ? `${anio + 1}-01` : `${anio}-${String(mes + 1).padStart(2, '0')}`;
  return {
    gte: new Date(`${periodo}-01T00:00:00-05:00`),
    lt: new Date(`${siguiente}-01T00:00:00-05:00`),
  };
}

// Suma (o resta, con n negativo) meses a un periodo AAAA-MM
export function sumarMeses(periodo, n) {
  const [anio, mes] = periodo.split('-').map(Number);
  const total = anio * 12 + (mes - 1) + n;
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, '0')}`;
}

// Fecha AAAA-MM-DD de un día concreto dentro de un periodo
export const fechaDePeriodo = (periodo, dia) => `${periodo}-${String(dia).padStart(2, '0')}`;

// Día (AAAA-MM-DD) en hora de Lima al que pertenece una fecha y hora
export const diaLima = (fecha) => new Date(fecha).toLocaleDateString('en-CA', { timeZone: ZONA });

// Suma (o resta, con n negativo) días a una fecha AAAA-MM-DD
export function sumarDias(aaaammdd, dias) {
  const base = new Date(`${aaaammdd}T12:00:00-05:00`);
  return new Date(base.getTime() + dias * 24 * 60 * 60 * 1000).toLocaleDateString('en-CA', { timeZone: ZONA });
}