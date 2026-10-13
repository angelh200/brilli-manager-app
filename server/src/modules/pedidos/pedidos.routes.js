import { Router } from 'express';
import { requerirAuth } from '../../middlewares/auth.js';
import { validar } from '../../middlewares/validar.js';
import { leerId } from '../../lib/errores.js';
import {
  actualizarPedidoSchema,
  cambiarEstadoSchema,
  listadoPedidosQuerySchema,
  pedidoAbiertoQuerySchema,
} from './pedidos.schemas.js';
import {
  actualizarPedido,
  cambiarEstado,
  listarPedidos,
  obtenerPedido,
  obtenerPedidoAbierto,
} from './pedidos.service.js';

const router = Router();
router.use(requerirAuth);

router.get('/', validar(listadoPedidosQuerySchema, 'query'), async (req, res) => {
  res.json(await listarPedidos(req.datos, req.usuario.rol));
});

// Debe ir antes de '/:id'. El formulario de venta lo usa para avisar a qué pedido se sumará
router.get('/abierto', validar(pedidoAbiertoQuerySchema, 'query'), async (req, res) => {
  res.json(await obtenerPedidoAbierto(req.datos.clienteId, req.usuario.rol));
});

router.get('/:id', async (req, res) => {
  res.json(await obtenerPedido(leerId(req.params.id), req.usuario.rol));
});

// Admin y ayudante gestionan el seguimiento; el costo de empaque lo valida el servicio (solo admin)
router.patch('/:id', validar(actualizarPedidoSchema), async (req, res) => {
  res.json(await actualizarPedido(leerId(req.params.id), req.datos, req.usuario));
});

router.post('/:id/estado', validar(cambiarEstadoSchema), async (req, res) => {
  res.json(await cambiarEstado(leerId(req.params.id), req.datos.estado, req.usuario));
});

export default router;