import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import CampoFormulario from '@/components/comunes/CampoFormulario';
import { numero } from '@/features/inventario/schemas';
import { useActualizarCuenta, useCrearCuenta } from '../hooks';

const schema = z.object({
  nombre: z
    .string()
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(40, 'El nombre no puede superar 40 caracteres'),
  saldoInicial: numero('el saldo inicial', { min: 0, opcional: true }),
  activa: z.boolean(),
});

function Formulario({ cuenta, onCerrar }) {
  const esEdicion = Boolean(cuenta);
  const crear = useCrearCuenta();
  const actualizar = useActualizarCuenta();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      nombre: cuenta?.nombre ?? '',
      saldoInicial: String(cuenta?.saldoInicial ?? 0),
      activa: cuenta?.activa ?? true,
    },
  });

  async function alEnviar(valores) {
    try {
      if (esEdicion) {
        await actualizar.mutateAsync({ id: cuenta.id, datos: valores });
      } else {
        await crear.mutateAsync({ nombre: valores.nombre, saldoInicial: valores.saldoInicial });
      }
      onCerrar();
    } catch {
      // El mensaje de error ya se muestra con un aviso (toast)
    }
  }

  return (
    <form onSubmit={handleSubmit(alEnviar)} className="space-y-4">
      <CampoFormulario etiqueta="Nombre" htmlFor="nombre-cuenta" error={errors.nombre?.message}>
        <Input id="nombre-cuenta" className="h-11" placeholder="Ej: Yape, Efectivo, BCP" {...register('nombre')} />
      </CampoFormulario>

      <CampoFormulario
        etiqueta="Saldo inicial (S/)"
        htmlFor="saldoInicial"
        error={errors.saldoInicial?.message}
        ayuda={
          esEdicion
            ? 'Es el dinero con el que empezó la cuenta. Cambiarlo modifica el saldo actual.'
            : 'El dinero que ya tiene la cuenta hoy. Después solo se mueve con ventas, compras y movimientos.'
        }
      >
        <Input id="saldoInicial" inputMode="decimal" className="h-11" {...register('saldoInicial')} />
      </CampoFormulario>

      {esEdicion && (
        <div className="flex items-center gap-2">
          <Controller
            control={control}
            name="activa"
            render={({ field }) => (
              <Switch id="activa" checked={field.value} onCheckedChange={field.onChange} />
            )}
          />
          <Label htmlFor="activa">Cuenta activa</Label>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" className="h-11" onClick={onCerrar}>
          Cancelar
        </Button>
        <Button type="submit" className="h-11" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : esEdicion ? 'Guardar cambios' : 'Crear cuenta'}
        </Button>
      </div>
    </form>
  );
}

// `cuenta`: null = crear, objeto = editar. `abierto` controla si se muestra.
export default function CuentaFormDialog({ abierto, cuenta = null, onCerrar }) {
  if (!abierto) return null;
  return (
    <Dialog open onOpenChange={(abrir) => !abrir && onCerrar()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{cuenta ? 'Editar cuenta' : 'Nueva cuenta'}</DialogTitle>
          <DialogDescription>
            {cuenta ? 'Una cuenta solo se desactiva si su saldo es 0.' : 'Por ejemplo: Efectivo, Yape o una cuenta bancaria.'}
          </DialogDescription>
        </DialogHeader>
        <Formulario cuenta={cuenta} onCerrar={onCerrar} />
      </DialogContent>
    </Dialog>
  );
}