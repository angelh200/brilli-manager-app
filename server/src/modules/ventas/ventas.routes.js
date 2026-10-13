import { Router } from 'express';
import { requerirAuth, requerirRol } from '../../middlewares/auth.js';
import { validar } from '../../middlewares/validar.js';
import { leerId } from '../../lib/errores.js';
import { anularVentaSchema, crearVentaSchema, listadoVentasQuerySchema } from './ventas.schemas.js';
import { anularVenta, listarVentas, obtenerVenta, registrarVenta } from './ventas.service.js';

const router = Router();
router.use(requerirAuth);

router.get('/', validar(listadoVentasQuerySchema, 'query'), async (req, res) => {
  res.json(await listarVentas(req.datos, req.usuario.rol));
});

router.get('/:id', async (req, res) => {
  const venta = await obtenerVenta(leerId(req.params.id), req.usuario.rol);
  res.json({ venta });
});

// Admin y ayudante registran ventas
router.post('/', validar(crearVentaSchema), async (req, res) => {
  const { venta, pedidoNuevo } = await registrarVenta(req.datos, req.usuario);
  res.status(201).json({ venta, pedidoNuevo });
});

// Solo admin anula
router.post('/:id/anular', requerirRol('admin'), validar(anularVentaSchema), async (req, res) => {
  const venta = await anularVenta(leerId(req.params.id), req.datos, req.usuario);
  res.json({ venta });
});

export default router;