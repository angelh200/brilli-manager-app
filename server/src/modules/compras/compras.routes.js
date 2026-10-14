import { Router } from 'express';
import { requerirAuth, requerirRol } from '../../middlewares/auth.js';
import { validar } from '../../middlewares/validar.js';
import { leerId } from '../../lib/errores.js';
import { anularCompraSchema, crearCompraSchema, listadoComprasQuerySchema } from './compras.schemas.js';
import { anularCompra, listarCompras, obtenerCompra, registrarCompra } from './compras.service.js';

const router = Router();
// Todo el módulo es solo para admin
router.use(requerirAuth, requerirRol('admin'));

router.get('/', validar(listadoComprasQuerySchema, 'query'), async (req, res) => {
  res.json(await listarCompras(req.datos));
});

router.get('/:id', async (req, res) => {
  res.json({ compra: await obtenerCompra(leerId(req.params.id)) });
});

router.post('/', validar(crearCompraSchema), async (req, res) => {
  const compra = await registrarCompra(req.datos, req.usuario);
  res.status(201).json({ compra });
});

router.post('/:id/anular', validar(anularCompraSchema), async (req, res) => {
  const compra = await anularCompra(leerId(req.params.id), req.datos, req.usuario);
  res.json({ compra });
});

export default router;