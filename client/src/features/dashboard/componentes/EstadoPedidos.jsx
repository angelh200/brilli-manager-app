import { Link } from 'react-router-dom';
import { ETIQUETAS_ESTADO_PEDIDO } from '@/lib/pedidos';
import Tarjeta from './Tarjeta';

export default function EstadoPedidos({ pedidos }) {
  const columnas = [
    ['acumulando', pedidos.acumulando],
    ['empaquetado', pedidos.empaquetado],
    ['en_agencia', pedidos.enAgencia],
  ];

  return (
    <Tarjeta titulo="Pedidos en curso" enlace={{ to: '/pedidos', texto: 'Ver pedidos' }}>
      <div className="grid grid-cols-3 gap-2">
        {columnas.map(([estado, cantidad]) => (
          <Link
            key={estado}
            to="/pedidos"
            className="rounded-lg bg-gray-50 px-2 py-3 text-center hover:bg-pink-50"
          >
            <span className="block text-2xl font-bold text-gray-800">{cantidad}</span>
            <span className="text-xs text-gray-500">{ETIQUETAS_ESTADO_PEDIDO[estado]}</span>
          </Link>
        ))}
      </div>
    </Tarjeta>
  );
}