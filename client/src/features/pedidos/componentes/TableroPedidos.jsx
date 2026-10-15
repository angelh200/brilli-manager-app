import { useState } from 'react';
import { COLUMNAS_TABLERO, ETIQUETAS_ESTADO_PEDIDO } from '@/lib/pedidos';
import TarjetaPedido from './TarjetaPedido';

export default function TableroPedidos({ pedidos }) {
  const [activa, setActiva] = useState('acumulando'); // solo se usa en celular

  const porColumna = Object.fromEntries(
    COLUMNAS_TABLERO.map((estado) => [estado, pedidos.filter((p) => p.estado === estado)])
  );

  return (
    <div className="space-y-3">
      {/* Celular: selector de columna con contadores */}
      <div className="grid grid-cols-3 gap-2 md:hidden">
        {COLUMNAS_TABLERO.map((estado) => (
          <button
            key={estado}
            type="button"
            onClick={() => setActiva(estado)}
            className={`rounded-lg border px-2 py-2 text-center ${
              activa === estado ? 'border-pink-400 bg-pink-50 text-pink-700' : 'border-gray-200 bg-white text-gray-600'
            }`}
          >
            <span className="block text-xs">{ETIQUETAS_ESTADO_PEDIDO[estado]}</span>
            <span className="text-lg font-bold">{porColumna[estado].length}</span>
          </button>
        ))}
      </div>

      <div className="md:grid md:grid-cols-3 md:items-start md:gap-4">
        {COLUMNAS_TABLERO.map((estado) => (
          <section
            key={estado}
            className={`${activa === estado ? 'block' : 'hidden'} space-y-2 md:block md:rounded-xl md:bg-gray-100 md:p-3`}
          >
            <h2 className="hidden items-center justify-between font-semibold text-gray-700 md:flex">
              {ETIQUETAS_ESTADO_PEDIDO[estado]}
              <span className="rounded-full bg-white px-2 py-0.5 text-sm">{porColumna[estado].length}</span>
            </h2>

            {porColumna[estado].length === 0 ? (
              <p className="rounded-lg border border-dashed border-gray-300 px-3 py-6 text-center text-sm text-gray-500">
                Sin pedidos
              </p>
            ) : (
              porColumna[estado].map((p) => <TarjetaPedido key={p.id} pedido={p} />)
            )}
          </section>
        ))}
      </div>
    </div>
  );
}