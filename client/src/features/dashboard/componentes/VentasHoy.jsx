import { Link } from 'react-router-dom';
import { PackagePlus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatearSoles } from '@/lib/formato';

export default function VentasHoy({ serie }) {
  const hoy = serie[serie.length - 1];
  const ayer = serie[serie.length - 2];
  const diferencia = hoy.total - ayer.total;

  let comparacion;
  if (ayer.total === 0) {
    comparacion = hoy.total === 0 ? 'Ayer tampoco hubo ventas' : 'Ayer no hubo ventas';
  } else {
    comparacion = `${diferencia >= 0 ? '+' : '−'}${formatearSoles(Math.abs(diferencia))} frente a ayer (${formatearSoles(ayer.total)})`;
  }

  return (
    <section className="rounded-xl bg-pink-500 p-5 text-white md:col-span-2">
      <p className="text-sm text-pink-100">Vendido hoy</p>
      <p className="mt-1 text-3xl font-bold">{formatearSoles(hoy.total)}</p>
      <p className="mt-1 text-sm text-pink-100">
        {hoy.cantidad} {hoy.cantidad === 1 ? 'venta' : 'ventas'} · margen de productos {formatearSoles(hoy.margen)}
      </p>
      <p className="mt-1 text-xs text-pink-100">{comparacion}</p>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button asChild className="h-11 bg-white text-pink-600 hover:bg-pink-50">
          <Link to="/ventas/nueva">
            <Plus size={16} /> Nueva venta
          </Link>
        </Button>
        <Button asChild className="h-11 bg-pink-600 text-white hover:bg-pink-700">
          <Link to="/compras/nueva">
            <PackagePlus size={16} /> Nueva compra
          </Link>
        </Button>
      </div>
    </section>
  );
}