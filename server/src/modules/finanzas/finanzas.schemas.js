import { z } from 'zod';

const TIPOS = ['fijo', 'variable', 'sueldo', 'otro'];

const textoOpcional = (max, etiqueta) =>
  z
    .string()
    .trim()
    .max(max, `${etiqueta} no puede superar ${max} caracteres`)
    .transform((v) => (v === '' ? null : v))
    .nullish();

const nombreCategoria = z
  .string()
  .trim()
  .min(2, 'El nombre debe tener al menos 2 caracteres')
  .max(60, 'El nombre no puede superar 60 caracteres');

const presupuesto = z
  .number()
  .min(0, 'El presupuesto no puede ser negativo')
  .max(100000000, 'El presupuesto es demasiado alto')
  .nullish();

export const crearCategoriaSchema = z.object({
  nombre: nombreCategoria,
  tipo: z.enum(TIPOS, { message: 'Tipo no válido' }),
  presupuestoMensual: presupuesto,
});

// undefined = no cambiar; null en el presupuesto = quitarlo
export const actualizarCategoriaSchema = z.object({
  nombre: nombreCategoria.optional(),
  tipo: z.enum(TIPOS, { message: 'Tipo no válido' }).optional(),
  presupuestoMensual: presupuesto,
  activa: z.boolean().optional(),
});

export const crearGastoSchema = z
  .object({
    categoriaId: z.number().int().positive('Elige la categoría'),
    cuentaId: z.number().int().positive('Elige la cuenta de la que salió el dinero'),
    monto: z.number().gt(0, 'El monto debe ser mayor que 0').max(100000000, 'El monto es demasiado alto'),
    fecha: z.string().datetime({ offset: true, message: 'La fecha no es válida' }).optional(),
    descripcion: textoOpcional(200, 'La descripción'),
    empleadoId: z.number().int().positive('Empleado no válido').nullish(),
  })
  .superRefine((d, ctx) => {
    if (d.fecha && new Date(d.fecha).getTime() > Date.now() + 5 * 60 * 1000) {
      ctx.addIssue({ code: 'custom', path: ['fecha'], message: 'La fecha no puede ser futura' });
    }
  });

export const anularGastoSchema = z.object({
  motivo: z
    .string()
    .trim()
    .min(3, 'El motivo es obligatorio (mínimo 3 caracteres)')
    .max(200, 'El motivo no puede superar 200 caracteres'),
});

const fechaDia = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha no válida (usa AAAA-MM-DD)');

export const resumenQuerySchema = z.object({
  periodo: z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Periodo no válido (usa AAAA-MM)')
    .optional(),
});

export const listadoGastosQuerySchema = z.object({
  desde: fechaDia.optional(),
  hasta: fechaDia.optional(),
  tipo: z.enum(TIPOS, { message: 'Tipo no válido' }).optional(),
  categoriaId: z.coerce.number().int().positive().optional(),
  incluirAnulados: z.enum(['true', 'false']).default('true'),
  pagina: z.coerce.number().int().min(1).default(1),
  limite: z.coerce.number().int().min(1).max(100).default(30),
});