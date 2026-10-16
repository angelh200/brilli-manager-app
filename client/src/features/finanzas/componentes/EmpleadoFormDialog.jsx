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
import { useActualizarEmpleado, useCrearEmpleado } from '../hooks';

const schema = z.object({
  nombre: z
    .string()
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(80, 'El nombre no puede superar 80 caracteres'),
  cargo: z.string().trim().max(60, 'El cargo no puede superar 60 caracteres'),
  sueldoBase: numero('el sueldo base', { min: 0 }).refine((n) => n > 0, 'El sueldo debe ser mayor que 0'),
  activo: z.boolean(),
});

function Formulario({ empleado, onCerrar }) {
  const esEdicion = Boolean(empleado);
  const crear = useCrearEmpleado();
  const actualizar = useActualizarEmpleado();
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      nombre: empleado?.nombre ?? '',
      cargo: empleado?.cargo ?? '',
      sueldoBase: empleado ? String(empleado.sueldoBase) : '',
      activo: empleado?.activo ?? true,
    },
  });

  async function alEnviar(valores) {
    const datos = { nombre: valores.nombre, cargo: valores.cargo, sueldoBase: valores.sueldoBase };
    try {
      if (esEdicion) await actualizar.mutateAsync({ id: empleado.id, datos: { ...datos, activo: valores.activo } });
      else await crear.mutateAsync(datos);
      onCerrar();
    } catch {
      // El mensaje de error ya se muestra con un aviso (toast)
    }
  }

  return (
    <form onSubmit={handleSubmit(alEnviar)} className="space-y-4">
      <CampoFormulario etiqueta="Nombre" htmlFor="emp-nombre" error={errors.nombre?.message}>
        <Input id="emp-nombre" className="h-11" autoComplete="off" {...register('nombre')} />
      </CampoFormulario>

      <CampoFormulario etiqueta="Cargo (opcional)" htmlFor="emp-cargo" error={errors.cargo?.message}>
        <Input id="emp-cargo" className="h-11" placeholder="Ej: Ayudante de empaque" {...register('cargo')} />
      </CampoFormulario>

      <CampoFormulario
        etiqueta="Sueldo base mensual (S/)"
        htmlFor="emp-sueldo"
        error={errors.sueldoBase?.message}
        ayuda="Es el monto que se propone al pagar; puedes cambiarlo en cada pago."
      >
        <Input id="emp-sueldo" inputMode="decimal" className="h-11" {...register('sueldoBase')} />
      </CampoFormulario>

      {esEdicion && (
        <div className="flex items-center gap-2">
          <Controller
            control={control}
            name="activo"
            render={({ field }) => (
              <Switch id="emp-activo" checked={field.value} onCheckedChange={field.onChange} />
            )}
          />
          <Label htmlFor="emp-activo">Empleado activo</Label>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" className="h-11" onClick={onCerrar}>
          Cancelar
        </Button>
        <Button type="submit" className="h-11" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : esEdicion ? 'Guardar cambios' : 'Crear empleado'}
        </Button>
      </div>
    </form>
  );
}

export default function EmpleadoFormDialog({ abierto, empleado = null, onCerrar }) {
  if (!abierto) return null;
  return (
    <Dialog open onOpenChange={(abrir) => !abrir && onCerrar()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{empleado ? 'Editar empleado' : 'Nuevo empleado'}</DialogTitle>
          <DialogDescription>
            Los socios no se registran aquí: lo que retiran va en Caja como retiro de socio.
          </DialogDescription>
        </DialogHeader>
        <Formulario empleado={empleado} onCerrar={onCerrar} />
      </DialogContent>
    </Dialog>
  );
}