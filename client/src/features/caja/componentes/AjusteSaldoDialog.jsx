import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import CampoFormulario from '@/components/comunes/CampoFormulario';
import { formatearSoles } from '@/lib/formato';
import { aNumero, numero } from '@/features/inventario/schemas';
import { useAjustarSaldo } from '../hooks';

const schema = z.object({
  saldoReal: numero('el saldo real', { min: 0 }),
  motivo: z
    .string()
    .trim()
    .min(3, 'Escribe el motivo (mínimo 3 caracteres)')
    .max(200, 'El motivo no puede superar 200 caracteres'),
});

function Formulario({ cuenta, onCerrar }) {
  const ajustar = useAjustarSaldo();
  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { saldoReal: '', motivo: 'Conteo de caja' },
  });

  const texto = String(watch('saldoReal') ?? '').trim();
  const real = aNumero(texto);
  const hayReal = texto !== '' && Number.isFinite(real) && real >= 0;
  const diferencia = Math.round((real - cuenta.saldo) * 100) / 100;

  async function alEnviar(valores) {
    if (Math.round((valores.saldoReal - cuenta.saldo) * 100) === 0) {
      setError('saldoReal', { message: 'El saldo ya coincide: no hay nada que ajustar' });
      return;
    }
    try {
      await ajustar.mutateAsync({ id: cuenta.id, datos: valores });
      onCerrar();
    } catch {
      // El mensaje de error ya se muestra con un aviso (toast)
    }
  }

  return (
    <form onSubmit={handleSubmit(alEnviar)} className="space-y-4">
      <CampoFormulario
        etiqueta="Saldo real (S/)"
        htmlFor="saldoReal"
        error={errors.saldoReal?.message}
        ayuda="Cuenta el dinero que realmente hay; la diferencia se calcula sola."
      >
        <Input id="saldoReal" inputMode="decimal" className="h-11" {...register('saldoReal')} />
      </CampoFormulario>

      {hayReal && (
        <p className="rounded-lg bg-pink-50 px-3 py-2 text-sm text-pink-800">
          Saldo en la app {formatearSoles(cuenta.saldo)} → {formatearSoles(real)}
          {diferencia !== 0 && ` (${diferencia > 0 ? '+' : ''}${formatearSoles(diferencia)})`}
        </p>
      )}

      <CampoFormulario etiqueta="Motivo" htmlFor="motivo-ajuste" error={errors.motivo?.message}>
        <Input id="motivo-ajuste" className="h-11" {...register('motivo')} />
      </CampoFormulario>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" className="h-11" onClick={onCerrar}>
          Cancelar
        </Button>
        <Button type="submit" className="h-11" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : 'Guardar ajuste'}
        </Button>
      </div>
    </form>
  );
}

export default function AjusteSaldoDialog({ cuenta, onCerrar }) {
  if (!cuenta) return null;
  return (
    <Dialog open onOpenChange={(abrir) => !abrir && onCerrar()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ajustar saldo de {cuenta.nombre}</DialogTitle>
          <DialogDescription>
            Cuadra la cuenta con el dinero real. Se registra un movimiento por la diferencia.
          </DialogDescription>
        </DialogHeader>
        <Formulario cuenta={cuenta} onCerrar={onCerrar} />
      </DialogContent>
    </Dialog>
  );
}