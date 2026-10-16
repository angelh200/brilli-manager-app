import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import CampoFormulario from '@/components/comunes/CampoFormulario';
import { ETIQUETAS_TIPO_GASTO } from '@/lib/finanzas';
import { hoyLima } from '@/lib/formato';
import { numero } from '@/features/inventario/schemas';
import { useCuentas } from '@/features/ventas/hooks';
import { useCategoriasGasto, useEmpleados, useRegistrarGasto } from '../hooks';

const schema = z.object({
  categoriaId: z.string().min(1, 'Elige la categoría'),
  cuentaId: z.string().min(1, 'Elige la cuenta de la que salió el dinero'),
  monto: numero('el monto', { min: 0 }).refine((n) => n > 0, 'El monto debe ser mayor que 0'),
  descripcion: z.string().trim().max(200, 'No puede superar 200 caracteres'),
  empleadoId: z.string(),
  fecha: z
    .string()
    .min(1, 'Elige la fecha')
    .refine((f) => f <= hoyLima(), 'La fecha no puede ser futura'),
});

function Formulario({ inicial, onCerrar, onAbrirCategorias }) {
  const hoy = hoyLima();
  const { data: categorias = [] } = useCategoriasGasto();
  const { data: cuentas = [] } = useCuentas();
  const { data: empleados = [] } = useEmpleados();
  const registrar = useRegistrarGasto();

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      categoriaId: inicial?.categoriaId ?? '',
      cuentaId: '',
      monto: inicial?.monto ?? '',
      descripcion: inicial?.descripcion ?? '',
      empleadoId: inicial?.empleadoId ?? 'ninguno',
      fecha: hoy,
    },
  });

  const activas = categorias.filter((c) => c.activa);
  const categoria = activas.find((c) => String(c.id) === watch('categoriaId'));
  const esSueldo = categoria?.tipo === 'sueldo';

  async function alEnviar(valores) {
    try {
      await registrar.mutateAsync({
        categoriaId: Number(valores.categoriaId),
        cuentaId: Number(valores.cuentaId),
        monto: valores.monto,
        descripcion: valores.descripcion,
        empleadoId: esSueldo && valores.empleadoId !== 'ninguno' ? Number(valores.empleadoId) : null,
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
      <CampoFormulario etiqueta="Categoría" htmlFor="categoriaId" error={errors.categoriaId?.message}>
        <Controller
          control={control}
          name="categoriaId"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="categoriaId" className="h-11 w-full">
                <SelectValue placeholder="Elige la categoría" />
              </SelectTrigger>
              <SelectContent>
                {activas.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.nombre} · {ETIQUETAS_TIPO_GASTO[c.tipo]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </CampoFormulario>
      {activas.length === 0 && (
        <p className="-mt-2 text-xs text-amber-700">
          No hay categorías activas.{' '}
          <button type="button" onClick={onAbrirCategorias} className="font-medium underline">
            Crea una primero
          </button>
          .
        </p>
      )}

      {esSueldo && (
        <CampoFormulario etiqueta="Empleado" htmlFor="empleadoId" error={errors.empleadoId?.message}>
          <Controller
            control={control}
            name="empleadoId"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="empleadoId" className="h-11 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ninguno">Sin empleado</SelectItem>
                  {empleados.map((e) => (
                    <SelectItem key={e.id} value={String(e.id)}>
                      {e.nombre}
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

      <CampoFormulario etiqueta="Cuenta de la que salió el dinero" htmlFor="cuentaId" error={errors.cuentaId?.message}>
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

      <CampoFormulario etiqueta="Descripción (opcional)" htmlFor="descripcion" error={errors.descripcion?.message}>
        <Input id="descripcion" className="h-11" placeholder="Ej: alquiler de octubre" {...register('descripcion')} />
      </CampoFormulario>

      <CampoFormulario etiqueta="Fecha" htmlFor="fecha" error={errors.fecha?.message}>
        <Input id="fecha" type="date" max={hoy} className="h-11" {...register('fecha')} />
      </CampoFormulario>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" className="h-11" onClick={onCerrar}>
          Cancelar
        </Button>
        <Button type="submit" className="h-11" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : 'Registrar gasto'}
        </Button>
      </div>
    </form>
  );
}

// `inicial` (opcional): { titulo, categoriaId, monto, empleadoId, descripcion }, todos en texto
export default function GastoFormDialog({ abierto, onCerrar, onAbrirCategorias, inicial = null }) {
  if (!abierto) return null;
  return (
    <Dialog open onOpenChange={(abrir) => !abrir && onCerrar()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{inicial?.titulo ?? 'Nuevo gasto'}</DialogTitle>
          <DialogDescription>Sale de la cuenta que elijas y se refleja en Caja.</DialogDescription>
        </DialogHeader>
        <Formulario
          inicial={inicial}
          onCerrar={onCerrar}
          onAbrirCategorias={() => {
            onCerrar();
            onAbrirCategorias();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}