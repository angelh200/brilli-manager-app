import { Link } from 'react-router-dom';
import { AlertTriangle, MapPin } from 'lucide-react';
import { formatearSoles } from '@/lib/formato';
import { diasDesde, textoAntiguedad } from '@/lib/pedidos';

export default function TarjetaPedido({ pedido }) {
  const dias = diasDesde(pedido.creadoEn);
  const antiguo = pedido.estado === 'acumulando' && dias >= 7; // lleva una semana o más sin enviarse
  const sinVentas = pedido.cantidadVentas === 0;

  let fechaTexto = `Creado ${textoAntiguedad(dias)}`;
  if (pedido.estado === 'en_agencia' && pedido.fechaEnvio) {
    fechaTexto = `Enviado ${textoAntiguedad(diasDesde(pedido.fechaEnvio))}`;
  } else if (pedido.estado === 'recibido' && pedido.fechaRecepcion) {
    fechaTexto = `Recibido ${textoAntiguedad(diasDesde(pedido.fechaRecepcion))}`;
  }

  const envio = [pedido.agencia, pedido.codigoSeguimiento && `Cód. ${pedido.codigoSeguimiento}`]
    .filter(Boolean)
    .join(' · ');

  return (
    <Link
      to={`/pedidos/${pedido.id}`}
      className="block rounded-xl border border-gray-200 bg-white p-3 hover:border-pink-300"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-medium text-gray-800">{pedido.cliente.nombre}</p>
          <p className="truncate text-xs text-gray-500">
            {pedido.cliente.usuarioTiktok ? `@${pedido.cliente.usuarioTiktok}` : 'Sin usuario de TikTok'}
          </p>
        </div>
        <span className="shrink-0 text-xs text-gray-400">#{pedido.id}</span>
      </div>

      <p className="mt-2 text-sm text-gray-600">
        {sinVentas
          ? 'Sin ventas activas'
          : `${pedido.cantidadVentas} ${pedido.cantidadVentas === 1 ? 'venta' : 'ventas'} · ${pedido.cantidadProductos} ${
              pedido.cantidadProductos === 1 ? 'producto' : 'productos'
            }`}
      </p>

      <div className="mt-1 flex items-baseline justify-between gap-2">
        <span className="font-semibold text-gray-800">{formatearSoles(pedido.totalPagado)}</span>
        {pedido.utilidad !== undefined && !sinVentas && (
          <span className={`text-xs ${pedido.utilidad >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            Utilidad {formatearSoles(pedido.utilidad)}
          </span>
        )}
      </div>

      {envio && (
        <p className="mt-2 flex items-center gap-1 truncate text-xs text-gray-500">
          <MapPin size={12} className="shrink-0" />
          {envio}
        </p>
      )}

      <p className={`mt-2 flex items-center gap-1 text-xs ${antiguo ? 'font-medium text-amber-600' : 'text-gray-400'}`}>
        {antiguo && <AlertTriangle size={12} />}
        {fechaTexto}
      </p>
    </Link>
  );
}