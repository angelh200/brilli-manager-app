import { z } from 'zod';

const textoOpcional = (max, etiqueta) =>
  z
    .string()
    .trim()
    .max(max, `${etiqueta} no puede superar ${max} caracteres`)
    .transform((v) => (v === '' ? null : v))
    .nullish();

const monto = z.number().gt(0, 'El monto debe ser mayor que 0').max(10000000, 'El monto es demasiado alto');

const motivo = z
  .string()
  .trim()
  .min(3, 'El motivo es obligatorio (mínimo 3 caracteres)')
  .max(200, 'El motivo no puede superar 200 caracteres');

export const crearCuentaSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(40, 'El nombre no puede superar 40 caracteres'),
  saldoInicial: z
    .number()
    .min(0, 'El saldo inicial no puede ser negativo')
    .max(100000000, 'El saldo inicial es demasiado alto')
    .default(0),
});

export const actualizarCuentaSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(40, 'El nombre no puede superar 40 caracteres')
    .optional(),
  saldoInicial: z
    .number()
    .min(0, 'El saldo inicial no puede ser negativo')
    .max(100000000, 'El saldo inicial es demasiado alto')
    .optional(),
  activa: z.boolean().optional(),
});

export const ajusteSaldoSchema = z.object({
  saldoReal: z
    .number()
    .min(0, 'El saldo real no puede ser negativo')
    .max(100000000, 'El saldo real es demasiado alto'),
  motivo,
});

export const movimientoManualSchema = z
  .object({
    operacion: z.enum(['transferencia', 'retiro_socio', 'aporte_socio'], { message: 'Operación no válida' }),
    cuentaId: z.number().int().positive('Elige la cuenta'),
    cuentaDestinoId: z.number().int().positive('Cuenta de destino no válida').nullish(),
    monto,
    descripcion: textoOpcional(200, 'La descripción'),
    fecha: z.string().datetime({ offset: true, message: 'La fecha no es válida' }).optional(),
  })
  .superRefine((d, ctx) => {
    if (d.operacion === 'transferencia') {
      if (!d.cuentaDestinoId) {
        ctx.addIssue({ code: 'custom', path: ['cuentaDestinoId'], message: 'Elige la cuenta de destino' });
      } else if (d.cuentaDestinoId === d.cuentaId) {
        ctx.addIssue({
          code: 'custom',
          path: ['cuentaDestinoId'],
          message: 'La cuenta de destino debe ser distinta de la de origen',
        });
      }
    }
    if (d.fecha && new Date(d.fecha).getTime() > Date.now() + 5 * 60 * 1000) {
      ctx.addIssue({ code: 'custom', path: ['fecha'], message: 'La fecha no puede ser futura' });
    }
  });

export const anularMovimientoSchema = z.object({ motivo });

const fechaDia = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha no válida (usa AAAA-MM-DD)');

export const listadoMovimientosQuerySchema = z.object({
  cuentaId: z.coerce.number().int().positive().optional(),
  tipo: z
    .enum(['ingreso', 'egreso', 'transferencia', 'retiro_socio'], { message: 'Tipo no válido' })
    .optional(),
  desde: fechaDia.optional(),
  hasta: fechaDia.optional(),
  incluirAnulados: z.enum(['true', 'false']).default('true'),
  pagina: z.coerce.number().int().min(1).default(1),
  limite: z.coerce.number().int().min(1).max(100).default(30),
});