import { useState } from 'react';
import { formatearFechaCorta, formatearSoles } from '@/lib/formato';
import Tarjeta from './Tarjeta';

const inicialDia = (fecha) =>
  new Date(`${fecha}T12:00:00-05:00`).toLocaleDateString('es-PE', { weekday: 'narrow', timeZone: 'America/Lima' });

export default function GraficoVentas({ serie }) {
  const [seleccionado, setSeleccionado] = useState(serie.length - 1);

  const maximo = Math.max(...serie.map((d) => d.total), 1);
  const suma = serie.reduce((s, d) => s + d.total, 0);
  const dia = serie[seleccionado];

  return (
    <Tarjeta titulo="Ventas de los últimos 14 días" className="md:col-span-2">
      <p className="mb-3 text-sm text-gray-600">
        {formatearFechaCorta(`${dia.fecha}T12:00:00-05:00`)} · <strong>{formatearSoles(dia.total)}</strong> ·{' '}
        {dia.cantidad} {dia.cantidad === 1 ? 'venta' : 'ventas'}
      </p>

      <div className="flex h-36 items-end gap-1">
        {serie.map((d, i) => {
          const esHoy = i === serie.length - 1;
          const color = i === seleccionado ? 'bg-pink-600' : esHoy ? 'bg-pink-400' : 'bg-pink-200';
          return (
            <button
              key={d.fecha}
              type="button"
              onClick={() => setSeleccionado(i)}
              className="flex h-full flex-1 flex-col justify-end"
              aria-label={`${d.fecha}: ${formatearSoles(d.total)}`}
            >
              <div
                className={`w-full rounded-t ${color}`}
                style={{ height: `${Math.max((d.total / maximo) * 100, d.total > 0 ? 4 : 1)}%` }}
              />
            </button>
          );
        })}
      </div>

      <div className="mt-1 flex gap-1">
        {serie.map((d) => (
          <span key={d.fecha} className="flex-1 text-center text-[10px] uppercase text-gray-400">
            {inicialDia(d.fecha)}
          </span>
        ))}
      </div>

      <p className="mt-3 text-xs text-gray-500">
        Total de los 14 días: {formatearSoles(suma)} · promedio por día {formatearSoles(suma / serie.length)}
      </p>
    </Tarjeta>
  );
}