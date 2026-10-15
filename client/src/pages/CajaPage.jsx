import { useState } from 'react';
import { ArrowLeftRight, HandCoins, Landmark, PiggyBank, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import EstadoVacio from '@/components/comunes/EstadoVacio';
import Paginacion from '@/components/comunes/Paginacion';
import { formatearSoles, hoyLima } from '@/lib/formato';
import { useMovimientos, useResumenCaja } from '@/features/caja/hooks';
import AjusteSaldoDialog from '@/features/caja/componentes/AjusteSaldoDialog';
import CuentaFormDialog from '@/features/caja/componentes/CuentaFormDialog';
import ListaMovimientos from '@/features/caja/componentes/ListaMovimientos';
import MovimientoDetalleDialog from '@/features/caja/componentes/MovimientoDetalleDialog';
import MovimientoDialog from '@/features/caja/componentes/MovimientoDialog';
import TarjetasCuentas from '@/features/caja/componentes/TarjetasCuentas';

const LIMITE = 30;

export default function CajaPage() {
  const hoy = hoyLima();
  const [cuentaFiltro, setCuentaFiltro] = useState('todas');
  const [tipo, setTipo] = useState('todos');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [pagina, setPagina] = useState(1);

  const [operacion, setOperacion] = useState(null); // 'transferencia' | 'retiro_socio' | 'aporte_socio'
  const [ajustando, setAjustando] = useState(null); // cuenta
  const [cuentaForm, setCuentaForm] = useState({ abierto: false, cuenta: null });
  const [seleccionado, setSeleccionado] = useState(null);

  const { data: resumen, isLoading: cargandoResumen } = useResumenCaja();
  const { data, isLoading, isError, error, refetch } = useMovimientos({
    cuentaId: cuentaFiltro === 'todas' ? undefined : cuentaFiltro,
    tipo: tipo === 'todos' ? undefined : tipo,
    desde: desde || undefined,
    hasta: hasta || undefined,
    pagina,
    limite: LIMITE,
  });

  const cuentasActivas = resumen?.cuentas.filter((c) => c.activa) ?? [];
  const hayFiltros = cuentaFiltro !== 'todas' || tipo !== 'todos' || desde || hasta;

  function filtrarCuenta(id) {
    setCuentaFiltro((actual) => (actual === String(id) ? 'todas' : String(id)));
    setPagina(1);
  }

  function limpiar() {
    setCuentaFiltro('todas');
    setTipo('todos');
    setDesde('');
    setHasta('');
    setPagina(1);
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Caja y cuentas</h1>

      <TarjetasCuentas
        resumen={resumen}
        cargando={cargandoResumen}
        cuentaFiltro={cuentaFiltro}
        onFiltrar={filtrarCuenta}
        onAjustar={setAjustando}
        onEditar={(cuenta) => setCuentaForm({ abierto: true, cuenta })}
      />

      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <Button className="h-11" onClick={() => setOperacion('transferencia')} disabled={cuentasActivas.length < 2}>
          <ArrowLeftRight size={16} /> Transferir
        </Button>
        <Button variant="outline" className="h-11" onClick={() => setOperacion('retiro_socio')}>
          <HandCoins size={16} /> Retiro de socio
        </Button>
        <Button variant="outline" className="h-11" onClick={() => setOperacion('aporte_socio')}>
          <PiggyBank size={16} /> Aporte de socio
        </Button>
        <Button variant="outline" className="h-11" onClick={() => setCuentaForm({ abierto: true, cuenta: null })}>
          <Plus size={16} /> Nueva cuenta
        </Button>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">Movimientos</h2>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="col-span-2 space-y-1.5 md:col-span-1">
            <Label htmlFor="filtro-cuenta">Cuenta</Label>
            <Select
              value={cuentaFiltro}
              onValueChange={(v) => {
                setCuentaFiltro(v);
                setPagina(1);
              }}
            >
              <SelectTrigger id="filtro-cuenta" className="h-11 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                {resumen?.cuentas.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="col-span-2 space-y-1.5 md:col-span-1">
            <Label htmlFor="filtro-tipo">Tipo</Label>
            <Select
              value={tipo}
              onValueChange={(v) => {
                setTipo(v);
                setPagina(1);
              }}
            >
              <SelectTrigger id="filtro-tipo" className="h-11 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="ingreso">Ingresos</SelectItem>
                <SelectItem value="egreso">Egresos</SelectItem>
                <SelectItem value="transferencia">Transferencias</SelectItem>
                <SelectItem value="retiro_socio">Retiros de socios</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="caja-desde">Desde</Label>
            <Input
              id="caja-desde"
              type="date"
              max={hoy}
              className="h-11"
              value={desde}
              onChange={(e) => {
                setDesde(e.target.value);
                setPagina(1);
              }}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="caja-hasta">Hasta</Label>
            <Input
              id="caja-hasta"
              type="date"
              max={hoy}
              className="h-11"
              value={hasta}
              onChange={(e) => {
                setHasta(e.target.value);
                setPagina(1);
              }}
            />
          </div>
        </div>

        {hayFiltros && (
          <button onClick={limpiar} className="text-sm text-gray-600 underline hover:text-pink-600">
            Limpiar filtros
          </button>
        )}

        {data && (
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-gray-200 bg-white p-3">
              <p className="text-xs text-gray-500">Ingresos</p>
              <p className="text-lg font-bold text-green-600">{formatearSoles(data.totales.ingresos)}</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-3">
              <p className="text-xs text-gray-500">Egresos y retiros</p>
              <p className="text-lg font-bold text-red-600">{formatearSoles(data.totales.egresos)}</p>
            </div>
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
        ) : data.movimientos.length === 0 ? (
          <EstadoVacio
            icono={Landmark}
            titulo={hayFiltros ? 'Sin resultados' : 'Aún no hay movimientos'}
            descripcion={
              hayFiltros
                ? 'Ningún movimiento coincide con los filtros.'
                : 'Aparecerán aquí las ventas, compras y operaciones de caja.'
            }
          />
        ) : (
          <>
            <ListaMovimientos movimientos={data.movimientos} onSeleccionar={setSeleccionado} />
            <Paginacion pagina={data.pagina} total={data.total} limite={data.limite} onCambiar={setPagina} />
          </>
        )}
      </section>

      <MovimientoDialog operacion={operacion} cuentas={cuentasActivas} onCerrar={() => setOperacion(null)} />
      <AjusteSaldoDialog cuenta={ajustando} onCerrar={() => setAjustando(null)} />
      <CuentaFormDialog
        abierto={cuentaForm.abierto}
        cuenta={cuentaForm.cuenta}
        onCerrar={() => setCuentaForm({ abierto: false, cuenta: null })}
      />
      <MovimientoDetalleDialog movimiento={seleccionado} onCerrar={() => setSeleccionado(null)} />
    </div>
  );
}