import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import CampoFormulario from '@/components/comunes/CampoFormulario';
import { etiquetaMes } from '@/lib/finanzas';
import { aNumero } from '@/features/inventario/schemas';
import { useRegistrarPendientes } from '../hooks';

function Contenido({ pendiente, onCerrar }) {
  const registrar = useRegistrarPendientes();
  const [monto, setMonto] = useState(String(pendiente.monto));
  const [error, setError] = useState('');

  async function confirmar() {
    const valor = aNumero(monto);
    if (!Number.isFinite(valor) || valor <= 0) {
      setError('El monto debe ser un número mayor que 0');
      return;
    }
    const resultado = await registrar.mutateAsync([
      { recurrenteId: pendiente.recurrenteId, periodo: pendiente.periodo, monto: valor },
    ]);
    if (resultado.registrados > 0) onCerrar();
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-600">
        <p>
          Categoría: <strong>{pendiente.categoria.nombre}</strong>
        </p>
        <p>
          Sale de: <strong>{pendiente.cuenta.nombre}</strong>
          {pendiente.empleado && (
            <>
              {' '}
              · Empleado: <strong>{pendiente.empleado.nombre}</strong>
            </>
          )}
        </p>
        <p>
          Se registra con fecha <strong>{pendiente.fechaPrevista}</strong>.
        </p>
      </div>

      <CampoFormulario
        etiqueta="Monto (S/)"
        htmlFor="monto-pendiente"
        error={error}
        ayuda="Cámbialo si este mes pagaste un monto distinto, por ejemplo en la luz."
      >
        <Input
          id="monto-pendiente"
          inputMode="decimal"
          className="h-11"
          value={monto}
          onChange={(e) => {
            setMonto(e.target.value);
            setError('');
          }}
        />
      </CampoFormulario>

      <div className="flex justify-end gap-2">
        <Button variant="outline" className="h-11" onClick={onCerrar} disabled={registrar.isPending}>
          Cancelar
        </Button>
        <Button className="h-11" onClick={confirmar} disabled={registrar.isPending}>
          {registrar.isPending ? 'Registrando...' : 'Registrar pago'}
        </Button>
      </div>
    </div>
  );
}

export default function PagoPendienteDialog({ pendiente, onCerrar }) {
  if (!pendiente) return null;
  return (
    <Dialog open onOpenChange={(abrir) => !abrir && onCerrar()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{pendiente.nombre}</DialogTitle>
          <DialogDescription>Pago de {etiquetaMes(pendiente.periodo)}</DialogDescription>
        </DialogHeader>
        <Contenido pendiente={pendiente} onCerrar={onCerrar} />
      </DialogContent>
    </Dialog>
  );
}