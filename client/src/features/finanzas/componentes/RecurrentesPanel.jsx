import { useState } from 'react';
import { Pencil, Plus, Repeat } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import EstadoVacio from '@/components/comunes/EstadoVacio';
import { formatearSoles } from '@/lib/formato';
import { useActualizarRecurrente, usePendientes, useRecurrentes, useRegistrarPendientes } from '../hooks';
import PagoPendienteDialog from './PagoPendienteDialog';
import PendientesLista from './PendientesLista';
import RecurrenteFormDialog from './RecurrenteFormDialog';

export default function RecurrentesPanel() {
  const { data: pendientes = [] } = usePendientes();
  const { data: recurrentes = [], isLoading, isError, error, refetch } = useRecurrentes('todos');
  const actualizar = useActualizarRecurrente();
  const registrar = useRegistrarPendientes();

  const [pagando, setPagando] = useState(null);
  const [form, setForm] = useState({ abierto: false, recurrente: null });

  function registrarTodos() {
    registrar.mutate(pendientes.map((p) => ({ recurrenteId: p.recurrenteId, periodo: p.periodo })));
  }

  return (
    <div className="space-y-5">
      <PendientesLista
        pendientes={pendientes}
        onRegistrar={setPagando}
        onRegistrarTodos={registrarTodos}
        registrando={registrar.isPending}
      />

      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-gray-800">Pagos recurrentes</h2>
        <Button className="h-11" onClick={() => setForm({ abierto: true, recurrente: null })}>
          <Plus size={16} /> Nuevo
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map((n) => (
            <div key={n} className="h-16 animate-pulse rounded-xl bg-gray-200" />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error.message}{' '}
          <button onClick={() => refetch()} className="font-medium underline">
            Reintentar
          </button>
        </div>
      ) : recurrentes.length === 0 ? (
        <EstadoVacio
          icono={Repeat}
          titulo="Aún no hay pagos recurrentes"
          descripcion="Registra el alquiler, el internet o las suscripciones una sola vez y la app te avisa cada mes."
        />
      ) : (
        <ul className="space-y-2">
          {recurrentes.map((r) => (
            <li
              key={r.id}
              className={`flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 ${r.activo ? '' : 'opacity-60'}`}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-gray-800">
                  {r.nombre} {!r.activo && <Badge variant="outline">Inactivo</Badge>}
                </p>
                <p className="truncate text-xs text-gray-500">
                  {r.categoria.nombre} · día {r.diaDelMes} de cada mes · {r.cuenta.nombre}
                  {r.empleado && ` · ${r.empleado.nombre}`}
                </p>
              </div>
              <span className="shrink-0 font-semibold text-gray-800">{formatearSoles(r.monto)}</span>
              <Button
                variant="ghost"
                size="icon"
                className="size-9"
                onClick={() => setForm({ abierto: true, recurrente: r })}
                aria-label="Editar"
              >
                <Pencil size={16} />
              </Button>
              <Switch
                checked={r.activo}
                disabled={actualizar.isPending}
                onCheckedChange={(valor) => actualizar.mutate({ id: r.id, datos: { activo: valor } })}
                aria-label={r.activo ? 'Desactivar' : 'Activar'}
              />
            </li>
          ))}
        </ul>
      )}

      <PagoPendienteDialog pendiente={pagando} onCerrar={() => setPagando(null)} />
      <RecurrenteFormDialog
        abierto={form.abierto}
        recurrente={form.recurrente}
        onCerrar={() => setForm({ abierto: false, recurrente: null })}
      />
    </div>
  );
}