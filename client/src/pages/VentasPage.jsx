import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Plus, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import EstadoVacio from '@/components/comunes/EstadoVacio';
import Paginacion from '@/components/comunes/Paginacion';
import { useAuth } from '@/context/AuthContext';
import { formatearDia, hoyLima, sumarDias } from '@/lib/formato';
import { useVentas } from '@/features/ventas/hooks';
import ListaVentas from '@/features/ventas/componentes/ListaVentas';
import ResumenVentaDia from '@/features/ventas/componentes/ResumenVentaDia';
import VentaDetalleDialog from '@/features/ventas/componentes/VentaDetalleDialog';

const LIMITE = 30;

export default function VentasPage() {
  const { usuario } = useAuth();
  const esAdmin = usuario.rol === 'admin';
  const hoy = hoyLima();

  const [fecha, setFecha] = useState(hoy);
  const [pagina, setPagina] = useState(1);
  const [seleccionada, setSeleccionada] = useState(null);

  const { data, isLoading, isError, error, refetch } = useVentas({ fecha, pagina, limite: LIMITE });

  function cambiarDia(nuevaFecha) {
    if (!nuevaFecha || nuevaFecha > hoy) return;
    setFecha(nuevaFecha);
    setPagina(1);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Ventas</h1>
          <p className="text-sm capitalize text-gray-500">{formatearDia(fecha)}</p>
        </div>
        <Button asChild className="h-11">
          <Link to="/ventas/nueva">
            <Plus size={16} /> Nueva venta
          </Link>
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" className="size-11 shrink-0" onClick={() => cambiarDia(sumarDias(fecha, -1))} aria-label="Día anterior">
          <ChevronLeft size={18} />
        </Button>
        <Input
          type="date"
          max={hoy}
          value={fecha}
          onChange={(e) => cambiarDia(e.target.value)}
          className="h-11"
          aria-label="Fecha"
        />
        <Button
          variant="outline"
          size="icon"
          className="size-11 shrink-0"
          disabled={fecha >= hoy}
          onClick={() => cambiarDia(sumarDias(fecha, 1))}
          aria-label="Día siguiente"
        >
          <ChevronRight size={18} />
        </Button>
        {fecha !== hoy && (
          <Button variant="outline" className="h-11 shrink-0" onClick={() => cambiarDia(hoy)}>
            Hoy
          </Button>
        )}
      </div>

      <ResumenVentaDia totales={data?.totales} cargando={isLoading} />

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-16 animate-pulse rounded-xl bg-gray-200" />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error.message}{' '}
          <button onClick={() => refetch()} className="font-medium underline">
            Reintentar
          </button>
        </div>
      ) : data.ventas.length === 0 ? (
        <EstadoVacio
          icono={ShoppingCart}
          titulo="No hay ventas este día"
          descripcion={fecha === hoy ? 'Registra la primera venta de hoy.' : 'No se registró ninguna venta en esta fecha.'}
        >
          <Button asChild>
            <Link to="/ventas/nueva">
              <Plus size={16} /> Registrar venta
            </Link>
          </Button>
        </EstadoVacio>
      ) : (
        <>
          <ListaVentas ventas={data.ventas} onSeleccionar={setSeleccionada} />
          <Paginacion pagina={data.pagina} total={data.total} limite={data.limite} onCambiar={setPagina} />
        </>
      )}

      {seleccionada && (
        <VentaDetalleDialog venta={seleccionada} esAdmin={esAdmin} onCerrar={() => setSeleccionada(null)} />
      )}
    </div>
  );
}