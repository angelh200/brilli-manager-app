import { Router } from 'express';
import { requerirAuth, requerirRol } from '../../middlewares/auth.js';
import { validar } from '../../middlewares/validar.js';
import { leerId } from '../../lib/errores.js';
import {
  actualizarCategoriaSchema,
  anularGastoSchema,
  crearCategoriaSchema,
  crearGastoSchema,
  listadoGastosQuerySchema,
  resumenQuerySchema,
} from './finanzas.schemas.js';
import {
  actualizarCategoria,
  anularGasto,
  crearCategoria,
  listarCategorias,
  listarGastos,
  obtenerGasto,
  obtenerResumen,
  registrarGasto,
} from './finanzas.service.js';

const router = Router();
// Todo el módulo es solo para admin
router.use(requerirAuth, requerirRol('admin'));

router.get('/resumen', validar(resumenQuerySchema, 'query'), async (req, res) => {
  res.json(await obtenerResumen(req.datos.periodo));
});

router.get('/categorias', async (req, res) => {
  res.json({ categorias: await listarCategorias() });
});

router.post('/categorias', validar(crearCategoriaSchema), async (req, res) => {
  res.status(201).json({ categoria: await crearCategoria(req.datos, req.usuario) });
});

router.put('/categorias/:id', validar(actualizarCategoriaSchema), async (req, res) => {
  res.json({ categoria: await actualizarCategoria(leerId(req.params.id), req.datos, req.usuario) });
});

router.get('/gastos', validar(listadoGastosQuerySchema, 'query'), async (req, res) => {
  res.json(await listarGastos(req.datos));
});

router.get('/gastos/:id', async (req, res) => {
  res.json({ gasto: await obtenerGasto(leerId(req.params.id)) });
});

router.post('/gastos', validar(crearGastoSchema), async (req, res) => {
  res.status(201).json({ gasto: await registrarGasto(req.datos, req.usuario) });
});

router.post('/gastos/:id/anular', validar(anularGastoSchema), async (req, res) => {
  res.json({ gasto: await anularGasto(leerId(req.params.id), req.datos, req.usuario) });
});

export default router;