import { z } from 'zod';

const itemSchema = z.object({
  productoId: z.number().int().positive('Producto no válido'),
  cantidad: z
    .number()
    .int('La cantidad debe ser un número entero')
    .min(1, 'La cantidad mínima es 1')
    .max(100000, 'La cantidad es demasiado alta'),
  costoUnitario: z
    .number()
    .gt(0, 'El costo unitario debe ser mayor que 0')
    .max(1000000, 'El costo unitario es demasiado alto'),
});

export const crearCompraSchema = z
  .object({
    proveedorId: z.number().int().positive('Proveedor no válido').nullish(),
    cuentaId: z.number().int().positive('Elige la cuenta de la que salió el dinero'),
    fecha: z.string().datetime({ offset: true, message: 'La fecha no es válida' }).optional(),
    gastosAdicionales: z
      .number()
      .min(0, 'Los gastos adicionales no pueden ser negativos')
      .max(1000000, 'Los gastos adicionales son demasiado altos')
      .default(0),
    notas: z
      .string()
      .trim()
      .max(300, 'Las notas no pueden superar 300 caracteres')
      .transform((v) => (v === '' ? null : v))
      .nullish(),
    items: z
      .array(itemSchema)
      .min(1, 'Agrega al menos un producto')
      .max(100, 'Demasiados productos en una sola compra'),
  })
  .superRefine((d, ctx) => {
    const ids = d.items.map((i) => i.productoId);
    if (new Set(ids).size !== ids.length) {
      ctx.addIssue({
        code: 'custom',
        path: ['items'],
        message: 'Hay productos repetidos: une las líneas en una sola',
      });
    }
    if (d.fecha && new Date(d.fecha).getTime() > Date.now() + 5 * 60 * 1000) {
      ctx.addIssue({ code: 'custom', path: ['fecha'], message: 'La fecha no puede ser futura' });
    }
  });

export const anularCompraSchema = z.object({
  motivo: z
    .string()
    .trim()
    .min(3, 'El motivo es obligatorio (mínimo 3 caracteres)')
    .max(200, 'El motivo no puede superar 200 caracteres'),
});

const fechaDia = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha no válida (usa AAAA-MM-DD)');

export const listadoComprasQuerySchema = z.object({
  desde: fechaDia.optional(),
  hasta: fechaDia.optional(),
  proveedorId: z.coerce.number().int().positive().optional(),
  incluirAnuladas: z.enum(['true', 'false']).default('true'),
  pagina: z.coerce.number().int().min(1).default(1),
  limite: z.coerce.number().int().min(1).max(100).default(20),
});