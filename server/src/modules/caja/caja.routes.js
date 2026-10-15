import { Router } from 'express';
import { requerirAuth, requerirRol } from '../../middlewares/auth.js';
import { validar } from '../../middlewares/validar.js';
import { leerId } from '../../lib/errores.js';
import {
  actualizarCuentaSchema,
  ajusteSaldoSchema,
  anularMovimientoSchema,
  crearCuentaSchema,
  listadoMovimientosQuerySchema,
  movimientoManualSchema,
} from './caja.schemas.js';
import {
  actualizarCuenta,
  ajustarSaldo,
  anularMovimiento,
  crearCuenta,
  listarMovimientos,
  obtenerResumen,
  registrarMovimiento,
} from './caja.service.js';

const router = Router();
// Todo el módulo es solo para admin
router.use(requerirAuth, requerirRol('admin'));

router.get('/resumen', async (req, res) => {
  res.json(await obtenerResumen());
});

router.post('/cuentas', validar(crearCuentaSchema), async (req, res) => {
  res.status(201).json({ cuenta: await crearCuenta(req.datos, req.usuario) });
});

router.put('/cuentas/:id', validar(actualizarCuentaSchema), async (req, res) => {
  res.json({ cuenta: await actualizarCuenta(leerId(req.params.id), req.datos, req.usuario) });
});

router.post('/cuentas/:id/ajuste-saldo', validar(ajusteSaldoSchema), async (req, res) => {
  res.json({ cuenta: await ajustarSaldo(leerId(req.params.id), req.datos, req.usuario) });
});

router.get('/movimientos', validar(listadoMovimientosQuerySchema, 'query'), async (req, res) => {
  res.json(await listarMovimientos(req.datos));
});

router.post('/movimientos', validar(movimientoManualSchema), async (req, res) => {
  res.status(201).json({ movimiento: await registrarMovimiento(req.datos, req.usuario) });
});

router.post('/movimientos/:id/anular', validar(anularMovimientoSchema), async (req, res) => {
  res.json({ movimiento: await anularMovimiento(leerId(req.params.id), req.datos, req.usuario) });
});

export default router;