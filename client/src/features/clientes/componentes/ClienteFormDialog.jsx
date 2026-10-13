import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import CampoFormulario from '@/components/comunes/CampoFormulario';
import { useActualizarCliente, useCrearCliente } from '../hooks';
import { clienteSchema } from '../schemas';

function Formulario({ cliente, rapido, onCerrar, onCreado }) {
  const esEdicion = Boolean(cliente);
  const crear = useCrearCliente();
  const actualizar = useActualizarCliente();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(clienteSchema),
    defaultValues: {
      nombre: cliente?.nombre ?? '',
      apellido: cliente?.apellido ?? '',
      usuarioTiktok: cliente?.usuarioTiktok ? `@${cliente.usuarioTiktok}` : '',
      celular: cliente?.celular ?? '',
      dni: cliente?.dni ?? '',
      departamento: cliente?.departamento ?? '',
      ciudad: cliente?.ciudad ?? '',
      provincia: cliente?.provincia ?? '',
      agenciaDestino: cliente?.agenciaDestino ?? '',
      notas: cliente?.notas ?? '',
    },
  });

  async function alEnviar(valores) {
    try {
      if (esEdicion) {
        await actualizar.mutateAsync({ id: cliente.id, datos: valores });
      } else {
        const respuesta = await crear.mutateAsync(valores);
        onCreado?.(respuesta.cliente);
      }
      onCerrar();
    } catch {
      // El mensaje de error ya se muestra con un aviso (toast)
    }
  }

  return (
    <form onSubmit={handleSubmit(alEnviar)} className="space-y-4">
      <CampoFormulario etiqueta="Nombre" htmlFor="nombre" error={errors.nombre?.message}>
        <Input id="nombre" className="h-11" autoComplete="off" {...register('nombre')} />
      </CampoFormulario>

      <CampoFormulario etiqueta="Apellido" htmlFor="apellido" error={errors.apellido?.message}>
        <Input id="apellido" className="h-11" autoComplete="off" {...register('apellido')} />
      </CampoFormulario>

      <CampoFormulario
        etiqueta="Usuario de TikTok"
        htmlFor="usuarioTiktok"
        error={errors.usuarioTiktok?.message}
        ayuda="Con o sin @. Es lo que distingue a dos clientes con el mismo nombre."
      >
        <Input id="usuarioTiktok" className="h-11" placeholder="@usuario" autoCapitalize="none" autoComplete="off" {...register('usuarioTiktok')} />
      </CampoFormulario>

      {!rapido && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <CampoFormulario etiqueta="Celular" htmlFor="celular" error={errors.celular?.message}>
              <Input id="celular" inputMode="tel" className="h-11" {...register('celular')} />
            </CampoFormulario>
            <CampoFormulario etiqueta="DNI o documento" htmlFor="dni" error={errors.dni?.message}>
              <Input id="dni" className="h-11" autoComplete="off" {...register('dni')} />
            </CampoFormulario>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <CampoFormulario etiqueta="Departamento" htmlFor="departamento" error={errors.departamento?.message}>
              <Input id="departamento" className="h-11" {...register('departamento')} />
            </CampoFormulario>
            <CampoFormulario etiqueta="Ciudad" htmlFor="ciudad" error={errors.ciudad?.message}>
              <Input id="ciudad" className="h-11" {...register('ciudad')} />
            </CampoFormulario>
            <CampoFormulario etiqueta="Provincia" htmlFor="provincia" error={errors.provincia?.message}>
              <Input id="provincia" className="h-11" {...register('provincia')} />
            </CampoFormulario>
            <CampoFormulario etiqueta="Agencia de destino" htmlFor="agenciaDestino" error={errors.agenciaDestino?.message}>
              <Input id="agenciaDestino" className="h-11" placeholder="Ej: Shalom Arequipa" {...register('agenciaDestino')} />
            </CampoFormulario>
          </div>

          <CampoFormulario etiqueta="Notas" htmlFor="notas" error={errors.notas?.message}>
            <Textarea id="notas" rows={3} {...register('notas')} />
          </CampoFormulario>
        </>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" className="h-11" onClick={onCerrar}>
          Cancelar
        </Button>
        <Button type="submit" className="h-11" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : esEdicion ? 'Guardar cambios' : 'Crear cliente'}
        </Button>
      </div>
    </form>
  );
}

export default function ClienteFormDialog({ abierto, onCerrar, cliente = null, rapido = false, onCreado }) {
  return (
    <Dialog open={abierto} onOpenChange={(abrir) => !abrir && onCerrar()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{cliente ? 'Editar cliente' : rapido ? 'Cliente rápido' : 'Nuevo cliente'}</DialogTitle>
          <DialogDescription>
            {rapido
              ? 'Solo lo básico; podrás completar los datos de envío después.'
              : 'Los datos de envío se usan al preparar sus pedidos.'}
          </DialogDescription>
        </DialogHeader>
        <Formulario cliente={cliente} rapido={rapido} onCerrar={onCerrar} onCreado={onCreado} />
      </DialogContent>
    </Dialog>
  );
}