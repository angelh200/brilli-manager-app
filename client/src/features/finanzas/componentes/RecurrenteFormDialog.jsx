import { useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import CampoFormulario from '@/components/comunes/CampoFormulario';
import { ETIQUETAS_TIPO_GASTO, etiquetaMes, periodoActual, sumarMeses } from '@/lib/finanzas';
import { numero } from '@/features/inventario/schemas';
import { useCuentas } from '@/features/ventas/hooks';
import {
  useActualizarRecurrente,
  useCategoriasGasto,
  useCrearRecurrente,
  useEmpleados,
} from '../hooks';

const schema = z.object({
  nombre: z
    .string()
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(80, 'El nombre no puede superar 80 caracteres'),
  categoriaId: z.string().min(1, 'Elige la categoría'),
  cuentaId: z.string().min(1, 'Elige la cuenta'),
  empleadoId: z.string(),
  monto: numero('el monto', { min: 0 }).refine((n) => n > 0, 'El monto debe ser mayor que 0'),
  diaDelMes: numero('el día', { entero: true, min: 1 }).refine((n) => n <= 28, 'El día debe estar entre 1 y 28'),
  desdePeriodo: z.string().min(1, 'Elige desde cuándo'),
  activo: z.boolean(),
});

function Formulario({ recurrente, onCerrar }) {
  const esEdicion = Boolean(recurrente);
  const actual = periodoActual();

  const { data: categorias = [] } = useCategoriasGasto();
  const { data: cuentas = [] } = useCuentas();
  const { data: empleados = [] } = useEmpleados();
  const crear = useCrearRecurrente();
  const actualizar = useActualizarRecurrente();

  // Del mes pasado hacia atrás hasta 5 meses, y el próximo mes
  const periodos = useMemo(() => {
    const lista = [-5, -4, -3, -2, -1, 0, 1].map((i) => sumarMeses(actual, i));
    if (recurrente && !lista.includes(recurrente.desdePeriodo)) lista.unshift(recurrente.desdePeriodo);
    return lista;
  }, [actual, recurrente]);

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      nombre: recurrente?.nombre ?? '',
      categoriaId: recurrente ? String(recurrente.categoria.id) : '',
      cuentaId: recurrente ? String(recurrente.cuenta.id) : '',
      empleadoId: recurrente?.empleado ? String(recurrente.empleado.id) : 'ninguno',
      monto: recurrente ? String(recurrente.monto) : '',
      diaDelMes: recurrente ? String(recurrente.diaDelMes) : '',
      desdePeriodo: recurrente?.desdePeriodo ?? actual,
      activo: recurrente?.activo ?? true,
    },
  });

  const categoriasActivas = categorias.filter((c) => c.activa);
  const categoria = categoriasActivas.find((c) => String(c.id) === watch('categoriaId'));
  const esSueldo = categoria?.tipo === 'sueldo';

  async function alEnviar(valores) {
    const datos = {
      nombre: valores.nombre,
      categoriaId: Number(valores.categoriaId),
      cuentaId: Number(valores.cuentaId),
      empleadoId: esSueldo && valores.empleadoId !== 'ninguno' ? Number(valores.empleadoId) : null,
      monto: valores.monto,
      diaDelMes: valores.diaDelMes,
      desdePeriodo: valores.desdePeriodo,
    };
    try {
      if (esEdicion) await actualizar.mutateAsync({ id: recurrente.id, datos: { ...datos, activo: valores.activo } });
      else await crear.mutateAsync(datos);
      onCerrar();
    } catch {
      // El mensaje de error ya se muestra con un aviso (toast)
    }
  }

  return (
    <form onSubmit={handleSubmit(alEnviar)} className="space-y-4">
      <CampoFormulario etiqueta="Nombre" htmlFor="rec-nombre" error={errors.nombre?.message}>
        <Input id="rec-nombre" className="h-11" placeholder="Ej: Alquiler del local" {...register('nombre')} />
      </CampoFormulario>

      <CampoFormulario etiqueta="Categoría" htmlFor="rec-categoria" error={errors.categoriaId?.message}>
        <Controller
          control={control}
          name="categoriaId"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="rec-categoria" className="h-11 w-full">
                <SelectValue placeholder="Elige la categoría" />
              </SelectTrigger>
              <SelectContent>
                {categoriasActivas.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.nombre} · {ETIQUETAS_TIPO_GASTO[c.tipo]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </CampoFormulario>

      {esSueldo && (
        <CampoFormulario etiqueta="Empleado" htmlFor="rec-empleado" error={errors.empleadoId?.message}>
          <Controller
            control={control}
            name="empleadoId"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="rec-empleado" className="h-11 w-full">
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

      <div className="grid grid-cols-2 gap-3">
        <CampoFormulario etiqueta="Monto (S/)" htmlFor="rec-monto" error={errors.monto?.message}>
          <Input id="rec-monto" inputMode="decimal" className="h-11" {...register('monto')} />
        </CampoFormulario>
        <CampoFormulario etiqueta="Día del mes" htmlFor="rec-dia" error={errors.diaDelMes?.message}>
          <Input id="rec-dia" inputMode="numeric" className="h-11" placeholder="1 a 28" {...register('diaDelMes')} />
        </CampoFormulario>
      </div>

      <CampoFormulario etiqueta="Cuenta de la que sale" htmlFor="rec-cuenta" error={errors.cuentaId?.message}>
        <Controller
          control={control}
          name="cuentaId"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="rec-cuenta" className="h-11 w-full">
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

      <CampoFormulario
        etiqueta="Rige desde"
        htmlFor="rec-desde"
        error={errors.desdePeriodo?.message}
        ayuda="Los meses desde aquí hasta hoy que no hayas registrado aparecerán como pendientes."
      >
        <Controller
          control={control}
          name="desdePeriodo"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="rec-desde" className="h-11 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {periodos.map((p) => (
                  <SelectItem key={p} value={p}>
                    {etiquetaMes(p)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </CampoFormulario>

      {esEdicion && (
        <div className="flex items-center gap-2">
          <Controller
            control={control}
            name="activo"
            render={({ field }) => (
              <Switch id="rec-activo" checked={field.value} onCheckedChange={field.onChange} />
            )}
          />
          <Label htmlFor="rec-activo">Pago activo</Label>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" className="h-11" onClick={onCerrar}>
          Cancelar
        </Button>
        <Button type="submit" className="h-11" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : esEdicion ? 'Guardar cambios' : 'Crear pago recurrente'}
        </Button>
      </div>
    </form>
  );
}

export default function RecurrenteFormDialog({ abierto, recurrente = null, onCerrar }) {
  if (!abierto) return null;
  return (
    <Dialog open onOpenChange={(abrir) => !abrir && onCerrar()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{recurrente ? 'Editar pago recurrente' : 'Nuevo pago recurrente'}</DialogTitle>
          <DialogDescription>
            Gastos que se repiten cada mes. No se cobran solos: la app te avisa cuando toca y tú confirmas.
          </DialogDescription>
        </DialogHeader>
        <Formulario recurrente={recurrente} onCerrar={onCerrar} />
      </DialogContent>
    </Dialog>
  );
}