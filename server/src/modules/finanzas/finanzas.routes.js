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
  actualizarEmpleadoSchema,
  actualizarRecurrenteSchema,
  crearEmpleadoSchema,
  crearRecurrenteSchema,
  listadoActivoQuerySchema,
  registrarPendienteSchema,
} from './equipo.schemas.js';
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
import { actualizarEmpleado, crearEmpleado, listarEmpleados } from './empleados.service.js';
import {
  actualizarRecurrente,
  crearRecurrente,
  listarPendientes,
  listarRecurrentes,
  registrarPendiente,
} from './recurrentes.service.js';

const router = Router();
// Todo el módulo es solo para admin
router.use(requerirAuth, requerirRol('admin'));

// ----- Resumen del mes -----
router.get('/resumen', validar(resumenQuerySchema, 'query'), async (req, res) => {
  res.json(await obtenerResumen(req.datos.periodo));
});

// ----- Categorías de gasto -----
router.get('/categorias', async (req, res) => {
  res.json({ categorias: await listarCategorias() });
});

router.post('/categorias', validar(crearCategoriaSchema), async (req, res) => {
  res.status(201).json({ categoria: await crearCategoria(req.datos, req.usuario) });
});

router.put('/categorias/:id', validar(actualizarCategoriaSchema), async (req, res) => {
  res.json({ categoria: await actualizarCategoria(leerId(req.params.id), req.datos, req.usuario) });
});

// ----- Gastos -----
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

// ----- Empleados -----
router.get('/empleados', validar(listadoActivoQuerySchema, 'query'), async (req, res) => {
  res.json({ empleados: await listarEmpleados(req.datos) });
});

router.post('/empleados', validar(crearEmpleadoSchema), async (req, res) => {
  res.status(201).json({ empleado: await crearEmpleado(req.datos, req.usuario) });
});

router.put('/empleados/:id', validar(actualizarEmpleadoSchema), async (req, res) => {
  res.json({ empleado: await actualizarEmpleado(leerId(req.params.id), req.datos, req.usuario) });
});

// ----- Gastos recurrentes y pendientes -----
router.get('/recurrentes', validar(listadoActivoQuerySchema, 'query'), async (req, res) => {
  res.json({ recurrentes: await listarRecurrentes(req.datos) });
});

router.post('/recurrentes', validar(crearRecurrenteSchema), async (req, res) => {
  res.status(201).json({ recurrente: await crearRecurrente(req.datos, req.usuario) });
});

router.put('/recurrentes/:id', validar(actualizarRecurrenteSchema), async (req, res) => {
  res.json({ recurrente: await actualizarRecurrente(leerId(req.params.id), req.datos, req.usuario) });
});

router.get('/pendientes', async (req, res) => {
  res.json({ pendientes: await listarPendientes() });
});

router.post('/pendientes/registrar', validar(registrarPendienteSchema), async (req, res) => {
  res.status(201).json({ gasto: await registrarPendiente(req.datos, req.usuario) });
});

export default router;