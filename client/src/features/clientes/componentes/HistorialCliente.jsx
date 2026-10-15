import { useState } from 'react';
import { ShoppingBag } from 'lucide-react';
import EstadoVacio from '@/components/comunes/EstadoVacio';
import Paginacion from '@/components/comunes/Paginacion';
import { useVentas } from '@/features/ventas/hooks';
import ListaVentas from '@/features/ventas/componentes/ListaVentas';
import ResumenVentaDia from '@/features/ventas/componentes/ResumenVentaDia';
import VentaDetalleDialog from '@/features/ventas/componentes/VentaDetalleDialog';

export default function HistorialCliente({ clienteId, esAdmin }) {
  const [pagina, setPagina] = useState(1);
  const [seleccionada, setSeleccionada] = useState(null);
  // Con clienteId y sin fechas, la API devuelve todo su historial y los totales de toda su vida
  const { data, isLoading, isError, error, refetch } = useVentas({ clienteId, pagina, limite: 10 });

  if (isError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error.message}{' '}
        <button onClick={() => refetch()} className="font-medium underline">
          Reintentar
        </button>
      </div>
    );
  }

  if (!isLoading && data.ventas.length === 0) {
    return (
      <EstadoVacio
        icono={ShoppingBag}
        titulo="Sin compras todavía"
        descripcion="Cuando registres ventas para este cliente aparecerán aquí."
      />
    );
  }

  return (
    <div className="space-y-4">
      <ResumenVentaDia totales={data?.totales} cargando={isLoading} />
      {data && (
        <>
          <ListaVentas ventas={data.ventas} onSeleccionar={setSeleccionada} mostrarFecha />
          <Paginacion pagina={data.pagina} total={data.total} limite={data.limite} onCambiar={setPagina} />
        </>
      )}
      {seleccionada && (
        <VentaDetalleDialog venta={seleccionada} esAdmin={esAdmin} onCerrar={() => setSeleccionada(null)} />
      )}
    </div>
  );
}