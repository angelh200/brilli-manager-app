import { Router } from 'express';
import { requerirAuth } from '../../middlewares/auth.js';
import { validar } from '../../middlewares/validar.js';
import { ErrorHttp, leerId } from '../../lib/errores.js';
import {
  actualizarClienteSchema,
  crearClienteSchema,
  listadoQuerySchema,
} from './clientes.schemas.js';
import {
  actualizarCliente,
  crearCliente,
  listarClientes,
  obtenerCliente,
} from './clientes.service.js';

const router = Router();
router.use(requerirAuth);

router.get('/', validar(listadoQuerySchema, 'query'), async (req, res) => {
  res.json(await listarClientes(req.datos, req.usuario.rol));
});

router.get('/:id', async (req, res) => {
  const cliente = await obtenerCliente(leerId(req.params.id));
  res.json({ cliente });
});

// Admin y ayudante pueden crear y editar clientes
router.post('/', validar(crearClienteSchema), async (req, res) => {
  const cliente = await crearCliente(req.datos, req.usuario);
  res.status(201).json({ cliente });
});

router.put('/:id', validar(actualizarClienteSchema), async (req, res) => {
  // Activar o desactivar es solo de admin
  if (req.datos.activo !== undefined && req.usuario.rol !== 'admin') {
    throw new ErrorHttp(403, 'Solo un administrador puede activar o desactivar clientes');
  }
  const cliente = await actualizarCliente(leerId(req.params.id), req.datos, req.usuario);
  res.json({ cliente });
});

export default router;