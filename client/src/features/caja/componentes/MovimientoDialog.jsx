import { useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import CampoFormulario from '@/components/comunes/CampoFormulario';
import { formatearSoles, hoyLima } from '@/lib/formato';
import { numero } from '@/features/inventario/schemas';
import { useRegistrarMovimiento } from '../hooks';

const CONFIG = {
  transferencia: {
    titulo: 'Transferir entre cuentas',
    descripcion: 'Mueve dinero de una cuenta a otra, por ejemplo de Yape al banco. El saldo total no cambia.',
    cuenta: 'Desde la cuenta',
    nota: 'Nota (opcional)',
    boton: 'Transferir',
  },
  retiro_socio: {
    titulo: 'Retiro de socio',
    descripcion: 'Dinero que un socio retira del negocio. No cuenta como gasto.',
    cuenta: 'Cuenta de la que sale',
    nota: 'Socio o motivo (opcional)',
    boton: 'Registrar retiro',
  },
  aporte_socio: {
    titulo: 'Aporte de socio',
    descripcion: 'Dinero que un socio pone en el negocio.',
    cuenta: 'Cuenta que lo recibe',
    nota: 'Socio o motivo (opcional)',
    boton: 'Registrar aporte',
  },
};

function crearSchema(operacion) {
  return z
    .object({
      cuentaId: z.string().min(1, 'Elige la cuenta'),
      cuentaDestinoId: z.string(),
      monto: numero('el monto', { min: 0 }).refine((n) => n > 0, 'El monto debe ser mayor que 0'),
      descripcion: z.string().trim().max(200, 'No puede superar 200 caracteres'),
      fecha: z
        .string()
        .min(1, 'Elige la fecha')
        .refine((f) => f <= hoyLima(), 'La fecha no puede ser futura'),
    })
    .superRefine((d, ctx) => {
      if (operacion !== 'transferencia') return;
      if (!d.cuentaDestinoId) {
        ctx.addIssue({ code: 'custom', path: ['cuentaDestinoId'], message: 'Elige la cuenta de destino' });
      } else if (d.cuentaDestinoId === d.cuentaId) {
        ctx.addIssue({
          code: 'custom',
          path: ['cuentaDestinoId'],
          message: 'La cuenta de destino debe ser distinta de la de origen',
        });
      }
    });
}

function Formulario({ operacion, cuentas, onCerrar }) {
  const config = CONFIG[operacion];
  const esTransferencia = operacion === 'transferencia';
  const hoy = hoyLima();
  const registrar = useRegistrarMovimiento();
  const schema = useMemo(() => crearSchema(operacion), [operacion]);

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { cuentaId: '', cuentaDestinoId: '', monto: '', descripcion: '', fecha: hoy },
  });

  const cuentaId = watch('cuentaId');
  const origen = cuentas.find((c) => String(c.id) === cuentaId);

  async function alEnviar(valores) {
    try {
      await registrar.mutateAsync({
        operacion,
        cuentaId: Number(valores.cuentaId),
        cuentaDestinoId: esTransferencia ? Number(valores.cuentaDestinoId) : null,
        monto: valores.monto,
        descripcion: valores.descripcion,
        // Si es hoy, el servidor usa la hora actual; otro día se registra al mediodía de Lima
        fecha: valores.fecha === hoy ? undefined : `${valores.fecha}T12:00:00-05:00`,
      });
      onCerrar();
    } catch {
      // El mensaje de error ya se muestra con un aviso (toast)
    }
  }

  return (
    <form onSubmit={handleSubmit(alEnviar)} className="space-y-4">
      <CampoFormulario etiqueta={config.cuenta} htmlFor="cuentaId" error={errors.cuentaId?.message}>
        <Controller
          control={control}
          name="cuentaId"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="cuentaId" className="h-11 w-full">
                <SelectValue placeholder="Elige la cuenta" />
              </SelectTrigger>
              <SelectContent>
                {cuentas.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </CampoFormulario>
      {origen && operacion !== 'aporte_socio' && (
        <p className="-mt-2 text-xs text-gray-500">Saldo disponible: {formatearSoles(origen.saldo)}</p>
      )}

      {esTransferencia && (
        <CampoFormulario etiqueta="Hacia la cuenta" htmlFor="cuentaDestinoId" error={errors.cuentaDestinoId?.message}>
          <Controller
            control={control}
            name="cuentaDestinoId"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="cuentaDestinoId" className="h-11 w-full">
                  <SelectValue placeholder="Elige la cuenta de destino" />
                </SelectTrigger>
                <SelectContent>
                  {cuentas
                    .filter((c) => String(c.id) !== cuentaId)
                    .map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.nombre}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            )}
          />
        </CampoFormulario>
      )}

      <CampoFormulario etiqueta="Monto (S/)" htmlFor="monto" error={errors.monto?.message}>
        <Input id="monto" inputMode="decimal" className="h-11" placeholder="0.00" {...register('monto')} />
      </CampoFormulario>

      <CampoFormulario etiqueta={config.nota} htmlFor="descripcion" error={errors.descripcion?.message}>
        <Input id="descripcion" className="h-11" {...register('descripcion')} />
      </CampoFormulario>

      <CampoFormulario etiqueta="Fecha" htmlFor="fecha" error={errors.fecha?.message}>
        <Input id="fecha" type="date" max={hoy} className="h-11" {...register('fecha')} />
      </CampoFormulario>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" className="h-11" onClick={onCerrar}>
          Cancelar
        </Button>
        <Button type="submit" className="h-11" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : config.boton}
        </Button>
      </div>
    </form>
  );
}

export default function MovimientoDialog({ operacion, cuentas, onCerrar }) {
  if (!operacion) return null;
  const config = CONFIG[operacion];

  return (
    <Dialog open onOpenChange={(abrir) => !abrir && onCerrar()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{config.titulo}</DialogTitle>
          <DialogDescription>{config.descripcion}</DialogDescription>
        </DialogHeader>
        <Formulario operacion={operacion} cuentas={cuentas} onCerrar={onCerrar} />
      </DialogContent>
    </Dialog>
  );
}