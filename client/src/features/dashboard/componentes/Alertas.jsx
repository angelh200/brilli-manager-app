import { Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { formatearSoles } from '@/lib/formato';
import Tarjeta from './Tarjeta';

const plural = (n, singular, pluralTexto) => `${n} ${n === 1 ? singular : pluralTexto}`;

function construirAlertas(d) {
  const alertas = [];
  const { inventario, pedidos, pendientes, caja } = d;

  if (inventario.agotados > 0) {
    alertas.push({
      nivel: 'rojo',
      texto: `${plural(inventario.agotados, 'producto agotado', 'productos agotados')}`,
      detalle: inventario.alertas
        .filter((p) => p.estadoStock === 'agotado')
        .slice(0, 3)
        .map((p) => p.nombre)
        .join(', '),
      to: '/inventario',
    });
  }
  if (inventario.stockBajo > 0) {
    alertas.push({
      nivel: 'ambar',
      texto: `${plural(inventario.stockBajo, 'producto con stock bajo', 'productos con stock bajo')}`,
      detalle: inventario.alertas
        .filter((p) => p.estadoStock === 'bajo')
        .slice(0, 3)
        .map((p) => `${p.nombre} (${p.stockActual})`)
        .join(', '),
      to: '/inventario',
    });
  }
  if (pedidos.antiguos > 0) {
    alertas.push({
      nivel: 'ambar',
      texto: `${plural(pedidos.antiguos, 'pedido lleva', 'pedidos llevan')} 7 días o más acumulando sin enviarse`,
      to: '/pedidos',
    });
  }
  if (pedidos.sinSeguimiento > 0) {
    alertas.push({
      nivel: 'ambar',
      texto: `${plural(pedidos.sinSeguimiento, 'pedido en agencia', 'pedidos en agencia')} sin código de seguimiento`,
      to: '/pedidos',
    });
  }
  if (pendientes.cantidad > 0) {
    alertas.push({
      nivel: 'ambar',
      texto: `${plural(pendientes.cantidad, 'pago recurrente pendiente', 'pagos recurrentes pendientes')} (${formatearSoles(pendientes.monto)})`,
      to: '/finanzas',
    });
  }
  const negativas = caja.cuentas.filter((c) => c.activa && c.saldo < 0);
  if (negativas.length > 0) {
    alertas.push({
      nivel: 'rojo',
      texto: `${plural(negativas.length, 'cuenta con saldo negativo', 'cuentas con saldo negativo')}`,
      detalle: negativas.map((c) => `${c.nombre} (${formatearSoles(c.saldo)})`).join(', '),
      to: '/caja',
    });
  }
  return alertas;
}

export default function Alertas({ datos }) {
  const alertas = construirAlertas(datos);

  return (
    <Tarjeta titulo="Requiere atención">
      {alertas.length === 0 ? (
        <p className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-3 text-sm text-green-800">
          <CheckCircle2 size={18} className="shrink-0" /> Todo en orden: nada pendiente por ahora.
        </p>
      ) : (
        <ul className="space-y-2">
          {alertas.map((a) => (
            <li key={a.texto}>
              <Link
                to={a.to}
                className={`flex items-start gap-2 rounded-lg px-3 py-2.5 text-sm ${
                  a.nivel === 'rojo' ? 'bg-red-50 text-red-800' : 'bg-amber-50 text-amber-900'
                }`}
              >
                <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                <span>
                  {a.texto}
                  {a.detalle && <span className="block text-xs opacity-80">{a.detalle}</span>}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Tarjeta>
  );
}