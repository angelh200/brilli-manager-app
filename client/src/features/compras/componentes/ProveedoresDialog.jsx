import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Pencil, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import CampoFormulario from '@/components/comunes/CampoFormulario';
import { useActualizarProveedor, useCrearProveedor, useProveedores } from '../hooks';

const schema = z.object({
  nombre: z
    .string()
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede superar 100 caracteres'),
  contacto: z.string().trim().max(150, 'El contacto no puede superar 150 caracteres'),
  notas: z.string().trim().max(300, 'Las notas no pueden superar 300 caracteres'),
});

function Formulario({ proveedor, onVolver }) {
  const crear = useCrearProveedor();
  const actualizar = useActualizarProveedor();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      nombre: proveedor?.nombre ?? '',
      contacto: proveedor?.contacto ?? '',
      notas: proveedor?.notas ?? '',
    },
  });

  async function alEnviar(valores) {
    try {
      if (proveedor) await actualizar.mutateAsync({ id: proveedor.id, datos: valores });
      else await crear.mutateAsync(valores);
      onVolver();
    } catch {
      // El mensaje de error ya se muestra con un aviso (toast)
    }
  }

  return (
    <form onSubmit={handleSubmit(alEnviar)} className="space-y-4">
      <CampoFormulario etiqueta="Nombre" htmlFor="prov-nombre" error={errors.nombre?.message}>
        <Input id="prov-nombre" className="h-11" autoComplete="off" {...register('nombre')} />
      </CampoFormulario>
      <CampoFormulario etiqueta="Contacto (teléfono, enlace, etc.)" htmlFor="prov-contacto" error={errors.contacto?.message}>
        <Input id="prov-contacto" className="h-11" {...register('contacto')} />
      </CampoFormulario>
      <CampoFormulario etiqueta="Notas" htmlFor="prov-notas" error={errors.notas?.message}>
        <Textarea id="prov-notas" rows={3} {...register('notas')} />
      </CampoFormulario>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" className="h-11" onClick={onVolver}>
          Cancelar
        </Button>
        <Button type="submit" className="h-11" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : proveedor ? 'Guardar cambios' : 'Crear proveedor'}
        </Button>
      </div>
    </form>
  );
}

export default function ProveedoresDialog({ abierto, onCerrar }) {
  const { data: proveedores = [], isLoading } = useProveedores('todos');
  const actualizar = useActualizarProveedor();
  const [vista, setVista] = useState('lista'); // 'lista' | 'nuevo' | objeto del proveedor a editar

  function cerrar() {
    setVista('lista');
    onCerrar();
  }

  return (
    <Dialog open={abierto} onOpenChange={(abrir) => !abrir && cerrar()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {vista === 'lista' ? 'Proveedores' : vista === 'nuevo' ? 'Nuevo proveedor' : 'Editar proveedor'}
          </DialogTitle>
          <DialogDescription>
            {vista === 'lista'
              ? 'Un proveedor inactivo deja de aparecer al registrar compras, pero conserva su historial.'
              : 'Completa los datos del proveedor.'}
          </DialogDescription>
        </DialogHeader>

        {vista === 'lista' ? (
          <>
            <Button className="h-11" onClick={() => setVista('nuevo')}>
              <Plus size={16} /> Nuevo proveedor
            </Button>

            {isLoading ? (
              <p className="text-sm text-gray-500">Cargando...</p>
            ) : proveedores.length === 0 ? (
              <p className="text-sm text-gray-500">Aún no hay proveedores.</p>
            ) : (
              <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
                {proveedores.map((p) => (
                  <li key={p.id} className={`flex items-center gap-3 px-3 py-2.5 ${p.activo ? '' : 'opacity-60'}`}>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-gray-800">{p.nombre}</p>
                      <p className="truncate text-xs text-gray-500">
                        {[p.contacto, `${p.cantidadCompras} ${p.cantidadCompras === 1 ? 'compra' : 'compras'}`]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    </div>
                    <Button size="icon" variant="ghost" className="size-9" onClick={() => setVista(p)} aria-label="Editar">
                      <Pencil size={16} />
                    </Button>
                    <Switch
                      checked={p.activo}
                      disabled={actualizar.isPending}
                      onCheckedChange={(valor) => actualizar.mutate({ id: p.id, datos: { activo: valor } })}
                      aria-label={p.activo ? 'Desactivar' : 'Activar'}
                    />
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <Formulario proveedor={vista === 'nuevo' ? null : vista} onVolver={() => setVista('lista')} />
        )}
      </DialogContent>
    </Dialog>
  );
}