import { useState } from 'react';
import { BellRing, Plus, Receipt, Tags } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import EstadoVacio from '@/components/comunes/EstadoVacio';
import Paginacion from '@/components/comunes/Paginacion';
import { ETIQUETAS_TIPO_GASTO, etiquetaMes, limitesDeMes, periodoActual } from '@/lib/finanzas';
import { formatearSoles } from '@/lib/formato';
import { useCategoriasGasto, useGastos, usePendientes, useResumenFinanzas } from '@/features/finanzas/hooks';
import CategoriasGastoDialog from '@/features/finanzas/componentes/CategoriasGastoDialog';
import EquipoPanel from '@/features/finanzas/componentes/EquipoPanel';
import EstadoResultados from '@/features/finanzas/componentes/EstadoResultados';
import GastoDetalleDialog from '@/features/finanzas/componentes/GastoDetalleDialog';
import GastoFormDialog from '@/features/finanzas/componentes/GastoFormDialog';
import ListaGastos from '@/features/finanzas/componentes/ListaGastos';
import PresupuestoCategorias from '@/features/finanzas/componentes/PresupuestoCategorias';
import PuntoEquilibrio from '@/features/finanzas/componentes/PuntoEquilibrio';
import RecurrentesPanel from '@/features/finanzas/componentes/RecurrentesPanel';
import SelectorMes from '@/features/finanzas/componentes/SelectorMes';

const LIMITE = 30;

function PanelResumen({ periodo, cantidadPendientes, onVerPendientes }) {
  const { data, isLoading, isError, error, refetch } = useResumenFinanzas(periodo);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="h-28 animate-pulse rounded-xl bg-gray-200" />
        <div className="h-64 animate-pulse rounded-xl bg-gray-200" />
      </div>
    );
  }
  if (isError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error.message}{' '}
        <button onClick={() => refetch()} className="font-medium underline">
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {cantidadPendientes > 0 && (
        <button
          type="button"
          onClick={onVerPendientes}
          className="flex w-full items-center gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-left text-sm text-amber-900"
        >
          <BellRing size={18} className="shrink-0" />
          <span>
            Tienes <strong>{cantidadPendientes}</strong> {cantidadPendientes === 1 ? 'pago pendiente' : 'pagos pendientes'}{' '}
            por registrar. Hasta que los registres no cuentan en el resultado.
          </span>
        </button>
      )}
      <EstadoResultados resumen={data} />
      <PuntoEquilibrio resumen={data} />
      <PresupuestoCategorias categorias={data.categorias} />
    </div>
  );
}

function PanelGastos({ periodo, onSeleccionar }) {
  const [tipo, setTipo] = useState('todos');
  const [pagina, setPagina] = useState(1);
  const { desde, hasta } = limitesDeMes(periodo);

  const { data, isLoading, isError, error, refetch } = useGastos({
    desde,
    hasta,
    tipo: tipo === 'todos' ? undefined : tipo,
    pagina,
    limite: LIMITE,
  });

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="filtro-tipo-gasto">Tipo</Label>
        <Select
          value={tipo}
          onValueChange={(v) => {
            setTipo(v);
            setPagina(1);
          }}
        >
          <SelectTrigger id="filtro-tipo-gasto" className="h-11 w-full md:w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            {Object.entries(ETIQUETAS_TIPO_GASTO).map(([valor, etiqueta]) => (
              <SelectItem key={valor} value={valor}>
                {etiqueta}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {data && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <div className="col-span-2 rounded-xl border border-gray-200 bg-white p-3 md:col-span-1">
            <p className="text-xs text-gray-500">Total</p>
            <p className="text-lg font-bold text-gray-800">{formatearSoles(data.totales.total)}</p>
          </div>
          {Object.entries(ETIQUETAS_TIPO_GASTO).map(([valor, etiqueta]) => (
            <div key={valor} className="rounded-xl border border-gray-200 bg-white p-3">
              <p className="text-xs text-gray-500">{etiqueta}</p>
              <p className="text-lg font-bold text-gray-800">{formatearSoles(data.totales[valor])}</p>
            </div>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((n) => (
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
      ) : data.gastos.length === 0 ? (
        <EstadoVacio
          icono={Receipt}
          titulo="No hay gastos este mes"
          descripcion={
            tipo === 'todos'
              ? 'Registra los gastos del negocio para ver tu utilidad real.'
              : 'No hay gastos de ese tipo en el mes.'
          }
        />
      ) : (
        <>
          <ListaGastos gastos={data.gastos} onSeleccionar={onSeleccionar} />
          <Paginacion pagina={data.pagina} total={data.total} limite={data.limite} onCambiar={setPagina} />
        </>
      )}
    </div>
  );
}

export default function FinanzasPage() {
  const [periodo, setPeriodo] = useState(periodoActual());
  const [pestana, setPestana] = useState('resumen');
  const [gastoForm, setGastoForm] = useState({ abierto: false, inicial: null });
  const [categoriasAbierto, setCategoriasAbierto] = useState(false);
  const [seleccionado, setSeleccionado] = useState(null);

  const { data: pendientes = [] } = usePendientes();
  const { data: categorias = [] } = useCategoriasGasto();

  // "Pagar sueldo": abre el gasto con categoría, monto y empleado ya llenados
  function pagarSueldo(empleado) {
    const categoria = categorias.find((c) => c.activa && c.tipo === 'sueldo');
    setGastoForm({
      abierto: true,
      inicial: {
        titulo: `Pagar sueldo a ${empleado.nombre}`,
        categoriaId: categoria ? String(categoria.id) : '',
        monto: String(empleado.sueldoBase),
        empleadoId: String(empleado.id),
        descripcion: `Sueldo de ${etiquetaMes(periodoActual())}`,
      },
    });
  }

  const usaMes = pestana === 'resumen' || pestana === 'gastos';

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Finanzas</h1>
        <div className="flex gap-2">
          <Button variant="outline" className="h-11 flex-1 md:flex-none" onClick={() => setCategoriasAbierto(true)}>
            <Tags size={16} /> Categorías
          </Button>
          <Button className="h-11 flex-1 md:flex-none" onClick={() => setGastoForm({ abierto: true, inicial: null })}>
            <Plus size={16} /> Nuevo gasto
          </Button>
        </div>
      </div>

      <Tabs value={pestana} onValueChange={setPestana}>
        <TabsList className="grid w-full grid-cols-4 md:w-[28rem]">
          <TabsTrigger value="resumen" className="text-xs sm:text-sm">
            Resumen
          </TabsTrigger>
          <TabsTrigger value="gastos" className="text-xs sm:text-sm">
            Gastos
          </TabsTrigger>
          <TabsTrigger value="recurrentes" className="text-xs sm:text-sm">
            Recurrentes{pendientes.length > 0 && ` (${pendientes.length})`}
          </TabsTrigger>
          <TabsTrigger value="equipo" className="text-xs sm:text-sm">
            Equipo
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {usaMes && <SelectorMes periodo={periodo} onCambiar={setPeriodo} />}

      {pestana === 'resumen' && (
        <PanelResumen
          periodo={periodo}
          cantidadPendientes={pendientes.length}
          onVerPendientes={() => setPestana('recurrentes')}
        />
      )}
      {pestana === 'gastos' && <PanelGastos key={periodo} periodo={periodo} onSeleccionar={setSeleccionado} />}
      {pestana === 'recurrentes' && <RecurrentesPanel />}
      {pestana === 'equipo' && <EquipoPanel onPagar={pagarSueldo} />}

      <GastoFormDialog
        abierto={gastoForm.abierto}
        inicial={gastoForm.inicial}
        onCerrar={() => setGastoForm({ abierto: false, inicial: null })}
        onAbrirCategorias={() => setCategoriasAbierto(true)}
      />
      <CategoriasGastoDialog abierto={categoriasAbierto} onCerrar={() => setCategoriasAbierto(false)} />
      <GastoDetalleDialog gasto={seleccionado} onCerrar={() => setSeleccionado(null)} />
    </div>
  );
}