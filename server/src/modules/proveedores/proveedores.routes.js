import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { requerirAuth, requerirRol } from '../../middlewares/auth.js';
import { validar } from '../../middlewares/validar.js';
import { ErrorHttp, leerId } from '../../lib/errores.js';

const router = Router();
router.use(requerirAuth, requerirRol('admin'));

const nombre = z
  .string()
  .trim()
  .min(2, 'El nombre debe tener al menos 2 caracteres')
  .max(100, 'El nombre no puede superar 100 caracteres');

const textoOpcional = (max, etiqueta) =>
  z
    .string()
    .trim()
    .max(max, `${etiqueta} no puede superar ${max} caracteres`)
    .transform((v) => (v === '' ? null : v))
    .nullish();

const crearSchema = z.object({
  nombre,
  contacto: textoOpcional(150, 'El contacto'),
  notas: textoOpcional(300, 'Las notas'),
});

const actualizarSchema = z.object({
  nombre: nombre.optional(),
  contacto: textoOpcional(150, 'El contacto'),
  notas: textoOpcional(300, 'Las notas'),
  activo: z.boolean().optional(),
});

const listadoSchema = z.object({
  buscar: z.string().trim().optional(),
  activo: z.enum(['true', 'false', 'todos'], { message: 'Valor de "activo" no válido' }).default('true'),
});

const serializar = (p, cantidadCompras) => ({
  id: p.id,
  nombre: p.nombre,
  contacto: p.contacto,
  notas: p.notas,
  activo: p.activo,
  ...(cantidadCompras !== undefined && { cantidadCompras }),
});

async function verificarNombreLibre(nombreNuevo, excluirId) {
  const where = { nombre: { equals: nombreNuevo, mode: 'insensitive' } };
  if (excluirId) where.NOT = { id: excluirId };
  const existente = await prisma.proveedor.findFirst({ where });
  if (existente) throw new ErrorHttp(409, 'Ya existe un proveedor con ese nombre');
}

router.get('/', validar(listadoSchema, 'query'), async (req, res) => {
  const { buscar, activo } = req.datos;
  const where = {};
  if (activo !== 'todos') where.activo = activo === 'true';
  if (buscar) where.nombre = { contains: buscar, mode: 'insensitive' };

  const proveedores = await prisma.proveedor.findMany({
    where,
    orderBy: { nombre: 'asc' },
    include: { _count: { select: { compras: true } } },
  });
  res.json({ proveedores: proveedores.map((p) => serializar(p, p._count.compras)) });
});

router.post('/', validar(crearSchema), async (req, res) => {
  await verificarNombreLibre(req.datos.nombre);
  const proveedor = await prisma.proveedor.create({
    data: {
      nombre: req.datos.nombre,
      contacto: req.datos.contacto ?? null,
      notas: req.datos.notas ?? null,
    },
  });
  res.status(201).json({ proveedor: serializar(proveedor, 0) });
});

router.put('/:id', validar(actualizarSchema), async (req, res) => {
  const id = leerId(req.params.id);
  const existe = await prisma.proveedor.findUnique({ where: { id } });
  if (!existe) throw new ErrorHttp(404, 'Proveedor no encontrado');

  if (req.datos.nombre) await verificarNombreLibre(req.datos.nombre, id);
  const proveedor = await prisma.proveedor.update({ where: { id }, data: req.datos });
  res.json({ proveedor: serializar(proveedor) });
});

export default router;