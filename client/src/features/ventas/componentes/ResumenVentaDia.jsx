import { formatearSoles } from '@/lib/formato';

function Tarjeta({ titulo, valor, color = 'text-gray-800' }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <p className="text-xs text-gray-500">{titulo}</p>
      <p className={`mt-1 text-xl font-bold md:text-2xl ${color}`}>{valor}</p>
    </div>
  );
}

export default function ResumenVentaDia({ totales, cargando }) {
  if (cargando || !totales) {
    return (
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[1, 2].map((n) => (
          <div key={n} className="h-20 animate-pulse rounded-xl bg-gray-200" />
        ))}
      </div>
    );
  }

  // El costo y la utilidad solo los envía la API para admin
  const verCostos = totales.utilidad !== undefined;

  return (
    <div className={`grid grid-cols-2 gap-3 ${verCostos ? 'md:grid-cols-4' : 'md:grid-cols-2'}`}>
      <Tarjeta titulo="Ventas" valor={totales.cantidadVentas} />
      <Tarjeta titulo="Total vendido" valor={formatearSoles(totales.totalVendido)} />
      {verCostos && (
        <>
          <Tarjeta titulo="Costo de productos" valor={formatearSoles(totales.costoTotal)} />
          <Tarjeta
            titulo="Utilidad"
            valor={formatearSoles(totales.utilidad)}
            color={totales.utilidad >= 0 ? 'text-green-600' : 'text-red-600'}
          />
        </>
      )}
    </div>
  );
}