import { Router } from 'express';
import { prisma } from '../../lib/prisma.js';
import { requerirAuth } from '../../middlewares/auth.js';

const router = Router();
router.use(requerirAuth);

// Solo id y nombre: los saldos son información de admin y llegarán con el módulo de Caja
router.get('/', async (req, res) => {
  const cuentas = await prisma.cuenta.findMany({
    where: { activa: true },
    orderBy: { id: 'asc' },
    select: { id: true, nombre: true },
  });
  res.json({ cuentas });
});

export default router;