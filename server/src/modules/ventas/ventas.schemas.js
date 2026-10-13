import { z } from 'zod';

const itemSchema = z.object({
  productoId: z.number().int().positive('Producto no válido'),
  cantidad: z
    .number()
    .int('La cantidad debe ser un número entero')
    .min(1, 'La cantidad mínima es 1')
    .max(10000, 'La cantidad es demasiado alta'),
});

export const crearVentaSchema = z
  .object({
    clienteId: z.number().int().positive('Cliente no válido'),
    // ISO con zona horaria. Si no viene, se usa la fecha y hora actuales
    fecha: z.string().datetime({ offset: true, message: 'La fecha no es válida' }).optional(),
    // 0 = premio, regalo o combo sin cobro (descuenta stock, no genera ingreso)
    montoPagado: z
      .number()
      .min(0, 'El monto no puede ser negativo')
      .max(1000000, 'El monto es demasiado alto'),
    cuentaId: z.number().int().positive('Cuenta no válida').nullish(),
    notas: z
      .string()
      .trim()
      .max(300, 'Las notas no pueden superar 300 caracteres')
      .transform((v) => (v === '' ? null : v))
      .nullish(),
    items: z
      .array(itemSchema)
      .min(1, 'Agrega al menos un producto')
      .max(100, 'Demasiados productos en una sola venta'),
  })
  .superRefine((d, ctx) => {
    if (d.montoPagado > 0 && !d.cuentaId) {
      ctx.addIssue({
        code: 'custom',
        path: ['cuentaId'],
        message: 'Elige la cuenta donde se recibió el pago',
      });
    }
    if (d.fecha && new Date(d.fecha).getTime() > Date.now() + 5 * 60 * 1000) {
      ctx.addIssue({ code: 'custom', path: ['fecha'], message: 'La fecha no puede ser futura' });
    }
  });

export const anularVentaSchema = z.object({
  motivo: z
    .string()
    .trim()
    .min(3, 'El motivo es obligatorio (mínimo 3 caracteres)')
    .max(200, 'El motivo no puede superar 200 caracteres'),
});

const fechaDia = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha no válida (usa AAAA-MM-DD)');

export const listadoVentasQuerySchema = z.object({
  fecha: fechaDia.optional(), // un solo día
  desde: fechaDia.optional(),
  hasta: fechaDia.optional(),
  clienteId: z.coerce.number().int().positive().optional(),
  pedidoId: z.coerce.number().int().positive().optional(),
  incluirAnuladas: z.enum(['true', 'false']).default('true'),
  pagina: z.coerce.number().int().min(1).default(1),
  limite: z.coerce.number().int().min(1).max(100).default(30),
});