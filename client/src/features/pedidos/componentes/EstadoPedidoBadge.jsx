import { Badge } from '@/components/ui/badge';
import { ESTILOS_ESTADO_PEDIDO, ETIQUETAS_ESTADO_PEDIDO } from '@/lib/pedidos';

export default function EstadoPedidoBadge({ estado }) {
  return (
    <Badge variant="secondary" className={ESTILOS_ESTADO_PEDIDO[estado]}>
      {ETIQUETAS_ESTADO_PEDIDO[estado] ?? estado}
    </Badge>
  );
}