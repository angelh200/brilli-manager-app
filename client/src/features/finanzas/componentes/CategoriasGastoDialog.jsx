import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Pencil, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import CampoFormulario from '@/components/comunes/CampoFormulario';
import { ESTILOS_TIPO_GASTO, ETIQUETAS_TIPO_GASTO } from '@/lib/finanzas';
import { formatearSoles } from '@/lib/formato';
import { useActualizarCategoriaGasto, useCategoriasGasto, useCrearCategoriaGasto } from '../hooks';

const schema = z.object({
  nombre: z
    .string()
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(60, 'El nombre no puede superar 60 caracteres'),
  tipo: z.string().min(1, 'Elige el tipo'),
  presupuesto: z
    .string()
    .trim()
    .refine((v) => v === '' || Number.isFinite(Number(v.replace(',', '.'))), 'El presupuesto debe ser un número')
    .refine((v) => v === '' || Number(v.replace(',', '.')) >= 0, 'El presupuesto no puede ser negativo'),
});

function Formulario({ categoria, onVolver }) {
  const crear = useCrearCategoriaGasto();
  const actualizar = useActualizarCategoriaGasto();
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      nombre: categoria?.nombre ?? '',
      tipo: categoria?.tipo ?? '',
      presupuesto: categoria?.presupuestoMensual != null ? String(categoria.presupuestoMensual) : '',
    },
  });

  async function alEnviar(valores) {
    const datos = {
      nombre: valores.nombre,
      tipo: valores.tipo,
      presupuestoMensual: valores.presupuesto === '' ? null : Number(valores.presupuesto.replace(',', '.')),
    };
    try {
      if (categoria) await actualizar.mutateAsync({ id: categoria.id, datos });
      else await crear.mutateAsync(datos);
      onVolver();
    } catch {
      // El mensaje de error ya se muestra con un aviso (toast)
    }
  }

  return (
    <form onSubmit={handleSubmit(alEnviar)} className="space-y-4">
      <CampoFormulario etiqueta="Nombre" htmlFor="cat-nombre" error={errors.nombre?.message}>
        <Input id="cat-nombre" className="h-11" autoComplete="off" {...register('nombre')} />
      </CampoFormulario>

      <CampoFormulario
        etiqueta="Tipo de gasto"
        htmlFor="cat-tipo"
        error={errors.tipo?.message}
        ayuda="Fijo: no depende de cuánto vendes (alquiler). Variable: sube con las ventas (publicidad). Sueldo: pagos al equipo."
      >
        <Controller
          control={control}
          name="tipo"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="cat-tipo" className="h-11 w-full">
                <SelectValue placeholder="Elige el tipo" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ETIQUETAS_TIPO_GASTO).map(([valor, etiqueta]) => (
                  <SelectItem key={valor} value={valor}>
                    {etiqueta}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </CampoFormulario>

      <CampoFormulario
        etiqueta="Presupuesto mensual (S/, opcional)"
        htmlFor="cat-presupuesto"
        error={errors.presupuesto?.message}
        ayuda="Si lo pones, verás cuánto llevas gastado frente a este límite."
      >
        <Input id="cat-presupuesto" inputMode="decimal" className="h-11" {...register('presupuesto')} />
      </CampoFormulario>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" className="h-11" onClick={onVolver}>
          Cancelar
        </Button>
        <Button type="submit" className="h-11" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : categoria ? 'Guardar cambios' : 'Crear categoría'}
        </Button>
      </div>
    </form>
  );
}

export default function CategoriasGastoDialog({ abierto, onCerrar }) {
  const { data: categorias = [], isLoading } = useCategoriasGasto();
  const actualizar = useActualizarCategoriaGasto();
  const [vista, setVista] = useState('lista'); // 'lista' | 'nueva' | objeto de la categoría a editar

  if (!abierto) return null;

  function cerrar() {
    setVista('lista');
    onCerrar();
  }

  return (
    <Dialog open onOpenChange={(abrir) => !abrir && cerrar()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {vista === 'lista' ? 'Categorías de gasto' : vista === 'nueva' ? 'Nueva categoría' : 'Editar categoría'}
          </DialogTitle>
          <DialogDescription>
            {vista === 'lista'
              ? 'Una categoría inactiva no aparece al registrar gastos, pero conserva su historial.'
              : 'El tipo decide dónde aparece el gasto en el estado de resultados.'}
          </DialogDescription>
        </DialogHeader>

        {vista === 'lista' ? (
          <>
            <Button className="h-11" onClick={() => setVista('nueva')}>
              <Plus size={16} /> Nueva categoría
            </Button>

            {isLoading ? (
              <p className="text-sm text-gray-500">Cargando...</p>
            ) : categorias.length === 0 ? (
              <p className="text-sm text-gray-500">Aún no hay categorías. Crea la primera, por ejemplo "Alquiler".</p>
            ) : (
              <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
                {categorias.map((c) => (
                  <li key={c.id} className={`flex items-center gap-3 px-3 py-2.5 ${c.activa ? '' : 'opacity-60'}`}>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-medium text-gray-800">{c.nombre}</p>
                        <Badge variant="secondary" className={ESTILOS_TIPO_GASTO[c.tipo]}>
                          {ETIQUETAS_TIPO_GASTO[c.tipo]}
                        </Badge>
                      </div>
                      <p className="truncate text-xs text-gray-500">
                        {c.presupuestoMensual != null ? `Presupuesto ${formatearSoles(c.presupuestoMensual)}` : 'Sin presupuesto'}
                        {` · ${c.cantidadGastos} ${c.cantidadGastos === 1 ? 'gasto' : 'gastos'}`}
                      </p>
                    </div>
                    <Button size="icon" variant="ghost" className="size-9" onClick={() => setVista(c)} aria-label="Editar">
                      <Pencil size={16} />
                    </Button>
                    <Switch
                      checked={c.activa}
                      disabled={actualizar.isPending}
                      onCheckedChange={(valor) => actualizar.mutate({ id: c.id, datos: { activa: valor } })}
                      aria-label={c.activa ? 'Desactivar' : 'Activar'}
                    />
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <Formulario categoria={vista === 'nueva' ? null : vista} onVolver={() => setVista('lista')} />
        )}
      </DialogContent>
    </Dialog>
  );
}