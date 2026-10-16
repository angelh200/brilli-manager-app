import { useState } from 'react';
import { Pencil, Plus, Users, Wallet } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import EstadoVacio from '@/components/comunes/EstadoVacio';
import { formatearFechaCorta, formatearSoles } from '@/lib/formato';
import { useEmpleados } from '../hooks';
import EmpleadoFormDialog from './EmpleadoFormDialog';

export default function EquipoPanel({ onPagar }) {
  const [verInactivos, setVerInactivos] = useState(false);
  const [form, setForm] = useState({ abierto: false, empleado: null });
  const { data: empleados = [], isLoading, isError, error, refetch } = useEmpleados(verInactivos ? 'todos' : 'true');

  const planilla = empleados.filter((e) => e.activo).reduce((suma, e) => suma + e.sueldoBase, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
          <p className="text-xs text-gray-500">Planilla mensual (sueldos base)</p>
          <p className="text-xl font-bold text-gray-800">{formatearSoles(planilla)}</p>
        </div>
        <Button className="h-11" onClick={() => setForm({ abierto: true, empleado: null })}>
          <Plus size={16} /> Nuevo empleado
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Switch id="ver-inactivos-emp" checked={verInactivos} onCheckedChange={setVerInactivos} />
        <Label htmlFor="ver-inactivos-emp">Ver inactivos</Label>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map((n) => (
            <div key={n} className="h-20 animate-pulse rounded-xl bg-gray-200" />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error.message}{' '}
          <button onClick={() => refetch()} className="font-medium underline">
            Reintentar
          </button>
        </div>
      ) : empleados.length === 0 ? (
        <EstadoVacio
          icono={Users}
          titulo="Aún no hay empleados"
          descripcion="Registra a quien te ayuda en el negocio para llevar el control de sus sueldos."
        />
      ) : (
        <ul className="space-y-2">
          {empleados.map((e) => (
            <li
              key={e.id}
              className={`flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 ${e.activo ? '' : 'opacity-60'}`}
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-pink-100 font-semibold text-pink-600">
                {e.nombre.charAt(0).toUpperCase()}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-gray-800">
                  {e.nombre} {!e.activo && <Badge variant="outline">Inactivo</Badge>}
                </p>
                <p className="truncate text-xs text-gray-500">
                  {[e.cargo, `Base ${formatearSoles(e.sueldoBase)}`].filter(Boolean).join(' · ')}
                </p>
                {e.activo && (
                  <p className={`text-xs ${e.pagadoMes > 0 ? 'text-green-600' : 'text-amber-600'}`}>
                    {e.pagadoMes > 0
                      ? `Pagado este mes: ${formatearSoles(e.pagadoMes)}`
                      : 'Sin pago este mes'}
                    {e.ultimoPago && ` · último pago ${formatearFechaCorta(e.ultimoPago)}`}
                  </p>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-1">
                <Button variant="outline" size="sm" disabled={!e.activo} onClick={() => onPagar(e)}>
                  <Wallet size={14} /> Pagar
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-9"
                  onClick={() => setForm({ abierto: true, empleado: e })}
                  aria-label="Editar"
                >
                  <Pencil size={16} />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <EmpleadoFormDialog
        abierto={form.abierto}
        empleado={form.empleado}
        onCerrar={() => setForm({ abierto: false, empleado: null })}
      />
    </div>
  );
}