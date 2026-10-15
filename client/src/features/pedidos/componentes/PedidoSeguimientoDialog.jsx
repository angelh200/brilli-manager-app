import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import CampoFormulario from '@/components/comunes/CampoFormulario';
import { numero } from '@/features/inventario/schemas';
import { useActualizarPedido } from '../hooks';

const schemaBase = z.object({
  agencia: z.string().trim().max(100, 'La agencia no puede superar 100 caracteres'),
  codigoSeguimiento: z.string().trim().max(60, 'El código no puede superar 60 caracteres'),
  notas: z.string().trim().max(500, 'Las notas no pueden superar 500 caracteres'),
});
const schemaAdmin = schemaBase.extend({ costoEmpaque: numero('el costo de empaque', { min: 0 }) });

function Formulario({ pedido, esAdmin, onCerrar }) {
  const actualizar = useActualizarPedido();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(esAdmin ? schemaAdmin : schemaBase),
    defaultValues: {
      agencia: pedido.agencia ?? '',
      codigoSeguimiento: pedido.codigoSeguimiento ?? '',
      notas: pedido.notas ?? '',
      ...(esAdmin ? { costoEmpaque: String(pedido.costoEmpaque ?? 0) } : {}),
    },
  });

  async function alEnviar(valores) {
    const datos = {
      agencia: valores.agencia,
      codigoSeguimiento: valores.codigoSeguimiento,
      notas: valores.notas,
    };
    if (esAdmin) datos.costoEmpaque = valores.costoEmpaque;

    try {
      await actualizar.mutateAsync({ id: pedido.id, datos });
      onCerrar();
    } catch {
      // El mensaje de error ya se muestra con un aviso (toast)
    }
  }

  return (
    <form onSubmit={handleSubmit(alEnviar)} className="space-y-4">
      <CampoFormulario etiqueta="Agencia de envío" htmlFor="agencia" error={errors.agencia?.message}>
        <Input id="agencia" className="h-11" placeholder="Ej: Shalom Arequipa" {...register('agencia')} />
      </CampoFormulario>

      <CampoFormulario
        etiqueta="Código de seguimiento"
        htmlFor="codigoSeguimiento"
        error={errors.codigoSeguimiento?.message}
      >
        <Input id="codigoSeguimiento" className="h-11" autoComplete="off" {...register('codigoSeguimiento')} />
      </CampoFormulario>

      {esAdmin && (
        <CampoFormulario
          etiqueta="Costo de empaque (S/)"
          htmlFor="costoEmpaque"
          error={errors.costoEmpaque?.message}
          ayuda="Costo del paquete (caja, tarjeta, bolsa). Afecta la utilidad de este pedido."
        >
          <Input id="costoEmpaque" inputMode="decimal" className="h-11" {...register('costoEmpaque')} />
        </CampoFormulario>
      )}

      <CampoFormulario etiqueta="Notas" htmlFor="notas-pedido" error={errors.notas?.message}>
        <Textarea id="notas-pedido" rows={3} {...register('notas')} />
      </CampoFormulario>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" className="h-11" onClick={onCerrar}>
          Cancelar
        </Button>
        <Button type="submit" className="h-11" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : 'Guardar'}
        </Button>
      </div>
    </form>
  );
}

export default function PedidoSeguimientoDialog({ abierto, onCerrar, pedido, esAdmin }) {
  return (
    <Dialog open={abierto} onOpenChange={(abrir) => !abrir && onCerrar()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Seguimiento del pedido #{pedido.id}</DialogTitle>
          <DialogDescription>Agencia, código y notas del envío.</DialogDescription>
        </DialogHeader>
        <Formulario pedido={pedido} esAdmin={esAdmin} onCerrar={onCerrar} />
      </DialogContent>
    </Dialog>
  );
}