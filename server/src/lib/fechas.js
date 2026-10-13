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