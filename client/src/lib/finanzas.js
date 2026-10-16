import { hoyLima } from './formato';

export const ETIQUETAS_TIPO_GASTO = { fijo: 'Fijo', variable: 'Variable', sueldo: 'Sueldo', otro: 'Otro' };

export const ESTILOS_TIPO_GASTO = {
  fijo: 'bg-blue-100 text-blue-700 hover:bg-blue-100',
  variable: 'bg-amber-100 text-amber-700 hover:bg-amber-100',
  sueldo: 'bg-purple-100 text-purple-700 hover:bg-purple-100',
  otro: 'bg-gray-100 text-gray-600 hover:bg-gray-100',
};

// Periodo "AAAA-MM"
export const periodoActual = () => hoyLima().slice(0, 7);

export function sumarMeses(periodo, n) {
  const [anio, mes] = periodo.split('-').map(Number);
  const total = anio * 12 + (mes - 1) + n;
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, '0')}`;
}

const formatoMes = new Intl.DateTimeFormat('es-PE', { month: 'long', year: 'numeric', timeZone: 'America/Lima' });
// "octubre de 2026"
export const etiquetaMes = (periodo) => formatoMes.format(new Date(`${periodo}-15T12:00:00-05:00`));

// Primer y último día del mes en formato AAAA-MM-DD, para filtrar listas
export function limitesDeMes(periodo) {
  const [anio, mes] = periodo.split('-').map(Number);
  const ultimo = new Date(Date.UTC(anio, mes, 0)).getUTCDate();
  return { desde: `${periodo}-01`, hasta: `${periodo}-${String(ultimo).padStart(2, '0')}` };
}