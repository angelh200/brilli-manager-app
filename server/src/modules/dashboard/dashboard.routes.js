import { Router } from 'express';
import { requerirAuth, requerirRol } from '../../middlewares/auth.js';
import { obtenerDashboard } from './dashboard.service.js';

const router = Router();
// Solo admin: incluye saldos, costos y utilidades
router.use(requerirAuth, requerirRol('admin'));

router.get('/', async (req, res) => {
  res.json(await obtenerDashboard());
});

export default router;