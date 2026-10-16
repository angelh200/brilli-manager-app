import { formatearSoles } from '@/lib/formato';
import Tarjeta from './Tarjeta';

export default function ResumenCaja({ caja }) {
  const activas = caja.cuentas.filter((c) => c.activa);

  return (
    <Tarjeta titulo="Dinero disponible" enlace={{ to: '/caja', texto: 'Ver caja' }}>
      <p className={`text-2xl font-bold ${caja.saldoTotal < 0 ? 'text-red-600' : 'text-gray-800'}`}>
        {formatearSoles(caja.saldoTotal)}
      </p>
      <p className="text-xs text-gray-500">Saldo total de las cuentas activas</p>

      {activas.length > 0 && (
        <ul className="mt-3 divide-y divide-gray-100 border-t border-gray-100">
          {activas.map((c) => (
            <li key={c.id} className="flex items-center justify-between py-2 text-sm">
              <span className="text-gray-600">{c.nombre}</span>
              <span className={`font-medium ${c.saldo < 0 ? 'text-red-600' : 'text-gray-800'}`}>
                {formatearSoles(c.saldo)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Tarjeta>
  );
}