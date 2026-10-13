import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import CampoFormulario from '@/components/comunes/CampoFormulario';
import EstadoPedidoBadge from '@/features/pedidos/componentes/EstadoPedidoBadge';
import { formatearCosto, formatearFechaHora, formatearSoles } from '@/lib/formato';
import { useAnularVenta } from '../hooks';

function Fila({ etiqueta, children }) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="text-gray-500">{etiqueta}</span>
      <span className="text-right font-medium text-gray-800">{children}</span>
    </div>
  );
}

export default function VentaDetalleDialog({ venta, esAdmin, onCerrar }) {
  const [anulando, setAnulando] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [errorMotivo, setErrorMotivo] = useState('');
  const anular = useAnularVenta();

  async function confirmarAnulacion() {
    if (motivo.trim().length < 3) {
      setErrorMotivo('Escribe el motivo (mínimo 3 caracteres)');
      return;
    }
    try {
      await anular.mutateAsync({ id: venta.id, motivo: motivo.trim() });
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
            Venta #{venta.id}
            {venta.anulada && (
              <Badge variant="secondary" className="bg-red-100 text-red-700 hover:bg-red-100">
                Anulada
              </Badge>
            )}
            {!venta.anulada && venta.montoPagado === 0 && (
              <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-100">
                Sin cobro
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            {venta.cliente.nombre}
            {venta.cliente.usuarioTiktok ? ` (@${venta.cliente.usuarioTiktok})` : ''} · {formatearFechaHora(venta.fecha)}
          </DialogDescription>
        </DialogHeader>

        <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
          {venta.items.map((item) => (
            <li key={item.productoId} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
              <span className="min-w-0 truncate text-gray-800">
                <span className="font-semibold">{item.cantidad}×</span> {item.nombre}
              </span>
              {item.costoTotal !== undefined && (
                <span className="shrink-0 text-xs text-gray-500">
                  Costo {formatearCosto(item.costoTotal)}
                </span>
              )}
            </li>
          ))}
        </ul>

        <div className="space-y-1.5">
          <Fila etiqueta="Monto pagado">{formatearSoles(venta.montoPagado)}</Fila>
          {venta.cuenta && <Fila etiqueta="Cuenta">{venta.cuenta.nombre}</Fila>}
          {venta.costoTotal !== undefined && <Fila etiqueta="Costo de productos">{formatearSoles(venta.costoTotal)}</Fila>}
          {venta.utilidad !== undefined && (
            <Fila etiqueta="Utilidad">
              <span className={venta.utilidad >= 0 ? 'text-green-600' : 'text-red-600'}>
                {formatearSoles(venta.utilidad)}
              </span>
            </Fila>
          )}
          {venta.pedido && (
            <Fila etiqueta="Pedido">
              #{venta.pedido.id} <EstadoPedidoBadge estado={venta.pedido.estado} />
            </Fila>
          )}
          {venta.creadoPor && <Fila etiqueta="Registrada por">{venta.creadoPor}</Fila>}
        </div>

        {venta.notas && (
          <p className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700">
            <span className="text-xs text-gray-500">Notas: </span>
            {venta.notas}
          </p>
        )}

        {venta.anulada && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            Anulada el {formatearFechaHora(venta.anuladaEn)}. Motivo: {venta.motivoAnulacion}
          </p>
        )}

        {esAdmin && !venta.anulada && (
          <div className="border-t border-gray-100 pt-3">
            {!anulando ? (
              <Button variant="outline" className="h-11 w-full text-red-600" onClick={() => setAnulando(true)}>
                Anular venta
              </Button>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  Se repondrá el stock y se revertirá el ingreso en caja. Si te equivocaste en algo, anula y vuelve a
                  registrar la venta.
                </p>
                <CampoFormulario etiqueta="Motivo de la anulación" htmlFor="motivo-anulacion" error={errorMotivo}>
                  <Input
                    id="motivo-anulacion"
                    className="h-11"
                    value={motivo}
                    onChange={(e) => {
                      setMotivo(e.target.value);
                      setErrorMotivo('');
                    }}
                    placeholder="Ej: error al registrar el producto"
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