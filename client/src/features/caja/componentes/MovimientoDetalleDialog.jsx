import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import CampoFormulario from '@/components/comunes/CampoFormulario';
import { etiquetaMovimiento } from '@/lib/caja';
import { formatearFechaHora, formatearSoles } from '@/lib/formato';
import { useAnularMovimiento } from '../hooks';

function Fila({ etiqueta, children }) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="text-gray-500">{etiqueta}</span>
      <span className="text-right font-medium text-gray-800">{children}</span>
    </div>
  );
}

export default function MovimientoDetalleDialog({ movimiento, onCerrar }) {
  const [anulando, setAnulando] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [errorMotivo, setErrorMotivo] = useState('');
  const anular = useAnularMovimiento();

  if (!movimiento) return null;
  const m = movimiento;

  async function confirmar() {
    if (motivo.trim().length < 3) {
      setErrorMotivo('Escribe el motivo (mínimo 3 caracteres)');
      return;
    }
    try {
      await anular.mutateAsync({ id: m.id, motivo: motivo.trim() });
      onCerrar();
    } catch {
      // El mensaje de error ya se muestra con un aviso (toast)
    }
  }

  return (
    <Dialog open onOpenChange={(abrir) => !abrir && onCerrar()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2">
            {etiquetaMovimiento(m)}
            {m.anulado && (
              <Badge variant="secondary" className="bg-red-100 text-red-700 hover:bg-red-100">
                Anulado
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>Movimiento #{m.id} · {formatearFechaHora(m.fecha)}</DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5">
          <Fila etiqueta="Monto">{formatearSoles(m.monto)}</Fila>
          <Fila etiqueta={m.tipo === 'transferencia' ? 'Desde' : 'Cuenta'}>{m.cuenta.nombre}</Fila>
          {m.cuentaDestino && <Fila etiqueta="Hacia">{m.cuentaDestino.nombre}</Fila>}
          {m.ventaId && <Fila etiqueta="Origen">Venta #{m.ventaId}</Fila>}
          {m.compraId && <Fila etiqueta="Origen">Compra #{m.compraId}</Fila>}
        </div>

        {m.descripcion && (
          <p className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700">{m.descripcion}</p>
        )}

        {m.anulado && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            Anulado el {formatearFechaHora(m.anuladoEn)}. Motivo: {m.motivoAnulacion}
          </p>
        )}

        {!m.anulado && !m.anulable && (
          <p className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600">
            Este movimiento nace de una venta, compra o gasto. Para corregirlo, anula esa operación desde su módulo.
          </p>
        )}

        {m.anulable && (
          <div className="border-t border-gray-100 pt-3">
            {!anulando ? (
              <Button variant="outline" className="h-11 w-full text-red-600" onClick={() => setAnulando(true)}>
                Anular movimiento
              </Button>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  Los saldos se recalculan sin este movimiento. No se puede anular si una cuenta quedaría en negativo.
                </p>
                <CampoFormulario etiqueta="Motivo de la anulación" htmlFor="motivo-anulacion-mov" error={errorMotivo}>
                  <Input
                    id="motivo-anulacion-mov"
                    className="h-11"
                    value={motivo}
                    onChange={(e) => {
                      setMotivo(e.target.value);
                      setErrorMotivo('');
                    }}
                    placeholder="Ej: monto mal digitado"
                  />
                </CampoFormulario>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" className="h-11" onClick={() => setAnulando(false)} disabled={anular.isPending}>
                    Cancelar
                  </Button>
                  <Button variant="destructive" className="h-11" onClick={confirmar} disabled={anular.isPending}>
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