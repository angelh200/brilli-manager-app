import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Pencil, Printer, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ConfirmarDialogo from '@/components/comunes/ConfirmarDialogo';
import EstadoVacio from '@/components/comunes/EstadoVacio';
import { useAuth } from '@/context/AuthContext';
import { formatearFechaHora, formatearSoles } from '@/lib/formato';
import { descripcionTransicion, diasDesde, esAvance, textoAntiguedad, textoTransicion } from '@/lib/pedidos';
import { useCambiarEstadoPedido, usePedido } from '@/features/pedidos/hooks';
import EstadoPedidoBadge from '@/features/pedidos/componentes/EstadoPedidoBadge';
import PedidoSeguimientoDialog from '@/features/pedidos/componentes/PedidoSeguimientoDialog';
import ListaVentas from '@/features/ventas/componentes/ListaVentas';
import VentaDetalleDialog from '@/features/ventas/componentes/VentaDetalleDialog';

function Dato({ titulo, children }) {
  return (
    <div className="rounded-lg bg-gray-50 p-3">
      <p className="text-xs text-gray-500">{titulo}</p>
      <p className="mt-0.5 break-words font-medium text-gray-800">{children || '—'}</p>
    </div>
  );
}

function FilaEconomica({ etiqueta, children, fuerte = false }) {
  return (
    <div className={`flex items-center justify-between gap-3 text-sm ${fuerte ? 'border-t border-gray-100 pt-2 font-semibold' : ''}`}>
      <span className="text-gray-500">{etiqueta}</span>
      <span className="text-gray-800">{children}</span>
    </div>
  );
}

export default function PedidoDetallePage() {
  const { id } = useParams();
  const { usuario } = useAuth();
  const esAdmin = usuario.rol === 'admin';

  const { data: pedido, isLoading, isError, error, refetch } = usePedido(id);
  const cambiarEstado = useCambiarEstadoPedido();

  const [editando, setEditando] = useState(false);
  const [transicion, setTransicion] = useState(null); // estado destino pendiente de confirmar
  const [ventaSel, setVentaSel] = useState(null);
  const [marcados, setMarcados] = useState({}); // casillas de la lista de empaque (solo en pantalla)

  const volver = (
    <Link to="/pedidos" className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-pink-600 print:hidden">
      <ArrowLeft size={16} /> Volver a pedidos
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
          <EstadoVacio icono={Truck} titulo="Pedido no encontrado" descripcion="Es posible que el enlace sea incorrecto." />
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

  const permitidas = pedido.transicionesPermitidas;
  const avances = permitidas.filter((e) => e !== 'cancelado' && esAvance(pedido.estado, e));
  const retrocesos = permitidas.filter((e) => e !== 'cancelado' && !esAvance(pedido.estado, e));
  const hayVentasActivas = pedido.cantidadVentas > 0;
  const puedeCancelar = permitidas.includes('cancelado') && !hayVentasActivas;
  const bloqueaCancelar = permitidas.includes('cancelado') && hayVentasActivas;

  const marcadosCantidad = pedido.listaEmpaque.filter((p) => marcados[p.productoId]).length;
  const cliente = pedido.cliente;

  let descripcionConfirmar = transicion ? descripcionTransicion(pedido.estado, transicion) : '';
  if (transicion === 'en_agencia' && !pedido.codigoSeguimiento) {
    descripcionConfirmar += ' Aún no registraste el código de seguimiento; puedes agregarlo después.';
  }

  async function confirmarTransicion() {
    try {
      await cambiarEstado.mutateAsync({ id: pedido.id, estado: transicion });
      setTransicion(null);
    } catch {
      // El mensaje de error ya se muestra con un aviso (toast)
    }
  }

  function alternar(productoId) {
    setMarcados((m) => ({ ...m, [productoId]: !m[productoId] }));
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {volver}

      {/* Encabezado y acciones de estado */}
      <section className="rounded-xl border border-gray-200 bg-white p-4 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-gray-800 md:text-2xl">Pedido #{pedido.id}</h1>
              <EstadoPedidoBadge estado={pedido.estado} />
            </div>
            <Link to={`/clientes/${cliente.id}`} className="mt-1 block text-gray-700 hover:text-pink-600">
              {cliente.nombre}
              {cliente.usuarioTiktok && <span className="text-gray-500"> · @{cliente.usuarioTiktok}</span>}
            </Link>
            <p className="mt-1 text-sm text-gray-500">
              Creado {formatearFechaHora(pedido.creadoEn)} ({textoAntiguedad(diasDesde(pedido.creadoEn))})
              {pedido.fechaEnvio && ` · Enviado ${formatearFechaHora(pedido.fechaEnvio)}`}
              {pedido.fechaRecepcion && ` · Recibido ${formatearFechaHora(pedido.fechaRecepcion)}`}
            </p>
          </div>
        </div>

        {(avances.length > 0 || retrocesos.length > 0 || puedeCancelar) && (
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap print:hidden">
            {avances.map((estado) => (
              <Button key={estado} className="h-11" onClick={() => setTransicion(estado)}>
                {textoTransicion(pedido.estado, estado)}
              </Button>
            ))}
            {retrocesos.map((estado) => (
              <Button key={estado} variant="outline" className="h-11" onClick={() => setTransicion(estado)}>
                {textoTransicion(pedido.estado, estado)}
              </Button>
            ))}
            {puedeCancelar && (
              <Button variant="outline" className="h-11 text-red-600" onClick={() => setTransicion('cancelado')}>
                {textoTransicion(pedido.estado, 'cancelado')}
              </Button>
            )}
          </div>
        )}

        {bloqueaCancelar && (
          <p className="mt-3 text-xs text-gray-500 print:hidden">
            Para cancelar el pedido primero anula sus ventas desde la lista de abajo.
          </p>
        )}
        {!hayVentasActivas && pedido.estado !== 'cancelado' && (
          <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 print:hidden">
            Este pedido no tiene ventas activas (se anularon todas). Puedes cancelarlo.
          </p>
        )}
      </section>

      {/* Datos de envío */}
      <section className="rounded-xl border border-gray-200 bg-white p-4 md:p-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-gray-800">Datos de envío</h2>
          <Button variant="outline" className="h-10 print:hidden" onClick={() => setEditando(true)}>
            <Pencil size={14} /> Editar seguimiento
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Dato titulo="Destinatario">{cliente.nombre}</Dato>
          <Dato titulo="DNI o documento">{cliente.dni}</Dato>
          <Dato titulo="Teléfono">{cliente.telefono}</Dato>
          <Dato titulo="Ciudad">{cliente.ciudad}</Dato>
          <Dato titulo="Agencia de envío">{pedido.agencia || cliente.agenciaDestino}</Dato>
          <Dato titulo="Código de seguimiento">{pedido.codigoSeguimiento}</Dato>
        </div>
        {pedido.notas && (
          <p className="mt-3 whitespace-pre-line rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700">
            <span className="text-xs text-gray-500">Notas: </span>
            {pedido.notas}
          </p>
        )}
      </section>

      {/* Lista de empaque */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Lista de empaque</h2>
            <p className="text-sm text-gray-500">
              {pedido.totalUnidades} {pedido.totalUnidades === 1 ? 'unidad' : 'unidades'} ·{' '}
              <span className="print:hidden">
                {marcadosCantidad} de {pedido.listaEmpaque.length} marcados
              </span>
            </p>
          </div>
          {pedido.listaEmpaque.length > 0 && (
            <Button variant="outline" className="h-10 print:hidden" onClick={() => window.print()}>
              <Printer size={14} /> Imprimir
            </Button>
          )}
        </div>

        {pedido.listaEmpaque.length === 0 ? (
          <p className="rounded-xl border border-dashed border-gray-300 bg-white px-3 py-6 text-center text-sm text-gray-500">
            No hay productos en este pedido.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
            {pedido.listaEmpaque.map((p) => (
              <li key={p.productoId}>
                <label className="flex cursor-pointer items-center gap-3 px-3 py-3">
                  <input
                    type="checkbox"
                    checked={Boolean(marcados[p.productoId])}
                    onChange={() => alternar(p.productoId)}
                    className="size-5 shrink-0 accent-pink-500"
                  />
                  <span className={`min-w-0 flex-1 ${marcados[p.productoId] ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                    <span className="font-bold">{p.cantidad}×</span> {p.nombre}
                    {p.sku && <span className="ml-2 text-xs text-gray-400">{p.sku}</span>}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Ventas incluidas (no se imprimen) */}
      <section className="space-y-3 print:hidden">
        <h2 className="text-lg font-semibold text-gray-800">
          Ventas incluidas ({pedido.ventas.length})
        </h2>
        {pedido.ventas.length === 0 ? (
          <p className="rounded-xl border border-dashed border-gray-300 bg-white px-3 py-6 text-center text-sm text-gray-500">
            Este pedido no tiene ventas.
          </p>
        ) : (
          <ListaVentas ventas={pedido.ventas} onSeleccionar={setVentaSel} mostrarFecha />
        )}
      </section>

      {/* Resumen económico (no se imprime) */}
      <section className="space-y-2 rounded-xl border border-gray-200 bg-white p-4 print:hidden">
        <h2 className="mb-1 text-lg font-semibold text-gray-800">Resumen</h2>
        <FilaEconomica etiqueta="Total pagado por el cliente">{formatearSoles(pedido.totalPagado)}</FilaEconomica>
        {esAdmin && pedido.utilidad !== undefined && (
          <>
            <FilaEconomica etiqueta="Costo de los productos">{formatearSoles(pedido.costoProductos)}</FilaEconomica>
            <FilaEconomica etiqueta="Costo de empaque">{formatearSoles(pedido.costoEmpaque)}</FilaEconomica>
            <FilaEconomica etiqueta="Utilidad del pedido" fuerte>
              <span className={pedido.utilidad >= 0 ? 'text-green-600' : 'text-red-600'}>
                {formatearSoles(pedido.utilidad)}
              </span>
            </FilaEconomica>
          </>
        )}
      </section>

      <PedidoSeguimientoDialog abierto={editando} onCerrar={() => setEditando(false)} pedido={pedido} esAdmin={esAdmin} />

      <ConfirmarDialogo
        abierto={Boolean(transicion)}
        titulo={transicion ? textoTransicion(pedido.estado, transicion) : ''}
        descripcion={descripcionConfirmar}
        textoConfirmar="Confirmar"
        cargando={cambiarEstado.isPending}
        onConfirmar={confirmarTransicion}
        onCancelar={() => setTransicion(null)}
      />

      {ventaSel && <VentaDetalleDialog venta={ventaSel} esAdmin={esAdmin} onCerrar={() => setVentaSel(null)} />}
    </div>
  );
}