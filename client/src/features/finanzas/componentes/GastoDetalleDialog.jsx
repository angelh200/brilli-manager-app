import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import CampoFormulario from '@/components/comunes/CampoFormulario';
import { ESTILOS_TIPO_GASTO, ETIQUETAS_TIPO_GASTO } from '@/lib/finanzas';
import { formatearFechaHora, formatearSoles } from '@/lib/formato';
import { useAnularGasto } from '../hooks';

function Fila({ etiqueta, children }) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="text-gray-500">{etiqueta}</span>
      <span className="text-right font-medium text-gray-800">{children}</span>
    </div>
  );
}

export default function GastoDetalleDialog({ gasto, onCerrar }) {
  const [anulando, setAnulando] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [errorMotivo, setErrorMotivo] = useState('');
  const anular = useAnularGasto();

  if (!gasto) return null;

  async function confirmar() {
    if (motivo.trim().length < 3) {
      setErrorMotivo('Escribe el motivo (mínimo 3 caracteres)');
      return;
    }
    try {
      await anular.mutateAsync({ id: gasto.id, motivo: motivo.trim() });
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
            Gasto #{gasto.id}
            <Badge variant="secondary" className={ESTILOS_TIPO_GASTO[gasto.tipo]}>
              {ETIQUETAS_TIPO_GASTO[gasto.tipo]}
            </Badge>
            {gasto.anulado && (
              <Badge variant="secondary" className="bg-red-100 text-red-700 hover:bg-red-100">
                Anulado
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>{formatearFechaHora(gasto.fecha)}</DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5">
          <Fila etiqueta="Categoría">{gasto.categoria.nombre}</Fila>
          <Fila etiqueta="Monto">{formatearSoles(gasto.monto)}</Fila>
          <Fila etiqueta="Pagado desde">{gasto.cuenta.nombre}</Fila>
          {gasto.empleado && <Fila etiqueta="Empleado">{gasto.empleado.nombre}</Fila>}
          {gasto.periodo && <Fila etiqueta="Periodo">{gasto.periodo}</Fila>}
          {gasto.creadoPor && <Fila etiqueta="Registrado por">{gasto.creadoPor}</Fila>}
        </div>

        {gasto.descripcion && (
          <p className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700">{gasto.descripcion}</p>
        )}

        {gasto.anulado && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            Anulado el {formatearFechaHora(gasto.anuladoEn)}. Motivo: {gasto.motivoAnulacion}
          </p>
        )}

        {!gasto.anulado && (
          <div className="border-t border-gray-100 pt-3">
            {!anulando ? (
              <Button variant="outline" className="h-11 w-full text-red-600" onClick={() => setAnulando(true)}>
                Anular gasto
              </Button>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  El dinero vuelve a la cuenta y el gasto deja de contarse en el resultado del mes. Si te equivocaste en
                  algo, anula y vuelve a registrarlo.
                </p>
                <CampoFormulario etiqueta="Motivo de la anulación" htmlFor="motivo-anulacion-gasto" error={errorMotivo}>
                  <Input
                    id="motivo-anulacion-gasto"
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