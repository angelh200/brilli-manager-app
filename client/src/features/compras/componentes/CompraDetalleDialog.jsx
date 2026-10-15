import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import CampoFormulario from '@/components/comunes/CampoFormulario';
import { formatearCosto, formatearFechaHora, formatearSoles } from '@/lib/formato';
import { useAnularCompra } from '../hooks';

function Fila({ etiqueta, children }) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="text-gray-500">{etiqueta}</span>
      <span className="text-right font-medium text-gray-800">{children}</span>
    </div>
  );
}

export default function CompraDetalleDialog({ compra, onCerrar }) {
  const [anulando, setAnulando] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [errorMotivo, setErrorMotivo] = useState('');
  const anular = useAnularCompra();

  async function confirmarAnulacion() {
    if (motivo.trim().length < 3) {
      setErrorMotivo('Escribe el motivo (mínimo 3 caracteres)');
      return;
    }
    try {
      await anular.mutateAsync({ id: compra.id, motivo: motivo.trim() });
      onCerrar();
    } catch {
      // El mensaje de error ya se muestra con un aviso (toast)
    }
  }

  return (
    <Dialog open onOpenChange={(abrir) => !abrir && onCerrar()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2">
            Compra #{compra.id}
            {compra.anulada && (
              <Badge variant="secondary" className="bg-red-100 text-red-700 hover:bg-red-100">
                Anulada
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            {compra.proveedor?.nombre ?? 'Sin proveedor'} · {formatearFechaHora(compra.fecha)}
          </DialogDescription>
        </DialogHeader>

        <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
          {compra.items.map((item) => (
            <li key={item.productoId} className="px-3 py-2 text-sm">
              <div className="flex items-start justify-between gap-3">
                <span className="min-w-0 text-gray-800">
                  <span className="font-semibold">{item.cantidad}×</span> {item.nombre}
                </span>
                <span className="shrink-0 font-medium text-gray-800">{formatearSoles(item.subtotal)}</span>
              </div>
              <p className="text-xs text-gray-500">
                {formatearCosto(item.costoUnitario)} c/u · costo final {formatearCosto(item.costoUnitarioFinal)} c/u
              </p>
            </li>
          ))}
        </ul>

        <div className="space-y-1.5">
          <Fila etiqueta="Subtotal de productos">{formatearSoles(compra.subtotalProductos)}</Fila>
          <Fila etiqueta="Gastos adicionales">{formatearSoles(compra.gastosAdicionales)}</Fila>
          <Fila etiqueta="Total pagado">{formatearSoles(compra.total)}</Fila>
          {compra.cuenta && <Fila etiqueta="Pagado desde">{compra.cuenta.nombre}</Fila>}
          {compra.creadoPor && <Fila etiqueta="Registrada por">{compra.creadoPor}</Fila>}
        </div>

        {compra.notas && (
          <p className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700">
            <span className="text-xs text-gray-500">Notas: </span>
            {compra.notas}
          </p>
        )}

        {compra.anulada && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            Anulada el {formatearFechaHora(compra.anuladaEn)}. Motivo: {compra.motivoAnulacion}
          </p>
        )}

        {!compra.anulada && (
          <div className="border-t border-gray-100 pt-3">
            {!anulando ? (
              <Button variant="outline" className="h-11 w-full text-red-600" onClick={() => setAnulando(true)}>
                Anular compra
              </Button>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  Se restará el stock, se devolverá el dinero a la cuenta y se recalculará el costo promedio. Solo es
                  posible si no se vendieron las unidades que trajo la compra.
                </p>
                <CampoFormulario etiqueta="Motivo de la anulación" htmlFor="motivo-anulacion-compra" error={errorMotivo}>
                  <Input
                    id="motivo-anulacion-compra"
                    className="h-11"
                    value={motivo}
                    onChange={(e) => {
                      setMotivo(e.target.value);
                      setErrorMotivo('');
                    }}
                    placeholder="Ej: error al digitar el costo"
                  />
                </CampoFormulario>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" className="h-11" onClick={() => setAnulando(false)} disabled={anular.isPending}>
                    Cancelar
                  </Button>
                  <Button variant="destructive" className="h-11" onClick={confirmarAnulacion} disabled={anular.isPending}>
                    {anular.isPending ? 'Anulando...' : 'Confirmar anulación'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}