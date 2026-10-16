import { etiquetaMes } from '@/lib/finanzas';
import { formatearSoles } from '@/lib/formato';
import Tarjeta from './Tarjeta';

export default function ResumenMes({ mes }) {
  const e = mes.equilibrio;
  const positiva = mes.utilidadNeta >= 0;
  const porcentaje = Math.min(100, Math.round((e.avance ?? 0) * 100));

  return (
    <Tarjeta
      titulo={`Resultado de ${etiquetaMes(mes.periodo)}`}
      enlace={{ to: '/finanzas', texto: 'Ver detalle' }}
    >
      <p className={`text-2xl font-bold ${positiva ? 'text-green-600' : 'text-red-600'}`}>
        {formatearSoles(mes.utilidadNeta)}
      </p>
      <p className="text-xs text-gray-500">
        Utilidad neta · ventas del mes {formatearSoles(mes.ventas)}
      </p>
      <p className="mt-1 text-xs text-gray-400">
        Mes anterior completo: ventas {formatearSoles(mes.anterior.ventas)} · utilidad{' '}
        {formatearSoles(mes.anterior.utilidadNeta)}
      </p>

      <div className="mt-4 border-t border-gray-100 pt-3">
        {e.puntoEquilibrio === null ? (
          <p className="text-sm text-gray-500">
            El punto de equilibrio se calcula cuando haya ventas con margen positivo este mes.
          </p>
        ) : (
          <>
            <p className="text-sm text-gray-600">
              Punto de equilibrio: <strong>{formatearSoles(e.puntoEquilibrio)}</strong>
              {e.ventasNecesarias && ` (≈ ${e.ventasNecesarias} ventas)`}
            </p>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-gray-100">
              <div
                className={`h-full rounded-full ${e.alcanzado ? 'bg-green-500' : 'bg-pink-500'}`}
                style={{ width: `${porcentaje}%` }}
              />
            </div>
            <p className={`mt-1 text-xs ${e.alcanzado ? 'text-green-700' : 'text-gray-500'}`}>
              {e.alcanzado
                ? 'Ya superaste el punto de equilibrio este mes.'
                : `Llevas el ${porcentaje}%: te faltan ${formatearSoles(Math.max(0, e.puntoEquilibrio - mes.ventas))}.`}
            </p>
          </>
        )}
      </div>
    </Tarjeta>
  );
}