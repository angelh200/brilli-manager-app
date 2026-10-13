import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Pencil, ShoppingBag, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import ConfirmarDialogo from '@/components/comunes/ConfirmarDialogo';
import EstadoVacio from '@/components/comunes/EstadoVacio';
import { useAuth } from '@/context/AuthContext';
import { useActualizarCliente, useCliente } from '@/features/clientes/hooks';
import ClienteFormDialog from '@/features/clientes/componentes/ClienteFormDialog';

function Dato({ titulo, children }) {
  return (
    <div className="rounded-lg bg-gray-50 p-3">
      <p className="text-xs text-gray-500">{titulo}</p>
      <p className="mt-0.5 break-words font-medium text-gray-800">{children || '—'}</p>
    </div>
  );
}

export default function ClienteDetallePage() {
  const { id } = useParams();
  const { usuario } = useAuth();
  const esAdmin = usuario.rol === 'admin';

  const { data: cliente, isLoading, isError, error, refetch } = useCliente(id);
  const actualizar = useActualizarCliente();

  const [editando, setEditando] = useState(false);
  const [confirmarEstado, setConfirmarEstado] = useState(false);

  const volver = (
    <Link to="/clientes" className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-pink-600">
      <ArrowLeft size={16} /> Volver a clientes
    </Link>
  );

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4">
        {volver}
        <div className="h-48 animate-pulse rounded-xl bg-gray-200" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-4xl space-y-4">
        {volver}
        {error.status === 404 ? (
          <EstadoVacio icono={Users} titulo="Cliente no encontrado" descripcion="Es posible que el enlace sea incorrecto." />
        ) : (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error.message}{' '}
            <button onClick={() => refetch()} className="font-medium underline">
              Reintentar
            </button>
          </div>
        )}
      </div>
    );
  }

  async function cambiarEstado() {
    try {
      await actualizar.mutateAsync({ id: cliente.id, datos: { activo: !cliente.activo } });
      setConfirmarEstado(false);
    } catch {
      // toast de error ya mostrado
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {volver}

      <section className="rounded-xl border border-gray-200 bg-white p-4 md:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-pink-100 text-2xl font-bold text-pink-600">
              {cliente.nombre.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-xl font-bold text-gray-800 md:text-2xl">{cliente.nombre}</h1>
              <p className="text-sm text-gray-500">
                {cliente.usuarioTiktok ? `@${cliente.usuarioTiktok}` : 'Sin usuario de TikTok'}
              </p>
              {!cliente.activo && (
                <Badge variant="outline" className="mt-1">
                  Inactivo
                </Badge>
              )}
            </div>
          </div>
          <Button variant="outline" className="h-11 shrink-0" onClick={() => setEditando(true)}>
            <Pencil size={16} /> Editar
          </Button>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Dato titulo="Teléfono">{cliente.telefono}</Dato>
          <Dato titulo="DNI o documento">{cliente.dni}</Dato>
          <Dato titulo="Ciudad">{cliente.ciudad}</Dato>
          <Dato titulo="Agencia de destino">{cliente.agenciaDestino}</Dato>
        </div>

        {cliente.notas && (
          <div className="mt-3 rounded-lg bg-gray-50 p-3">
            <p className="text-xs text-gray-500">Notas</p>
            <p className="mt-0.5 whitespace-pre-line text-gray-800">{cliente.notas}</p>
          </div>
        )}

        {esAdmin && (
          <div className="mt-4 flex items-center gap-2 border-t border-gray-100 pt-4">
            <Switch id="activo" checked={cliente.activo} onCheckedChange={() => setConfirmarEstado(true)} />
            <Label htmlFor="activo">Cliente activo</Label>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-800">Compras y pedidos</h2>
        <EstadoVacio
          icono={ShoppingBag}
          titulo="Historial pendiente"
          descripcion="Aquí aparecerán sus ventas, pedidos y la utilidad que genera cuando se implemente el módulo de Ventas."
        />
      </section>

      <ClienteFormDialog abierto={editando} onCerrar={() => setEditando(false)} cliente={cliente} />

      {esAdmin && (
        <ConfirmarDialogo
          abierto={confirmarEstado}
          titulo={cliente.activo ? 'Desactivar cliente' : 'Activar cliente'}
          descripcion={
            cliente.activo
              ? 'Dejará de aparecer en las búsquedas y en las ventas nuevas, pero su historial se conserva. Puedes reactivarlo cuando quieras.'
              : 'Volverá a aparecer en las búsquedas y podrás registrarle ventas.'
          }
          textoConfirmar={cliente.activo ? 'Desactivar' : 'Activar'}
          cargando={actualizar.isPending}
          onConfirmar={cambiarEstado}
          onCancelar={() => setConfirmarEstado(false)}
        />
      )}
    </div>
  );
}