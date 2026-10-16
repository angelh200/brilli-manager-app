import { z } from 'zod';

const textoOpcional = (max, etiqueta) =>
  z
    .string()
    .trim()
    .max(max, `${etiqueta} no puede superar ${max} caracteres`)
    .transform((v) => (v === '' ? null : v))
    .nullish();

const periodo = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Periodo no válido (usa AAAA-MM)');

export const listadoActivoQuerySchema = z.object({
  activo: z.enum(['true', 'false', 'todos'], { message: 'Valor de "activo" no válido' }).default('true'),
});

// ----- Empleados -----

const nombreEmpleado = z
  .string()
  .trim()
  .min(2, 'El nombre debe tener al menos 2 caracteres')
  .max(80, 'El nombre no puede superar 80 caracteres');

const sueldo = z.number().gt(0, 'El sueldo debe ser mayor que 0').max(10000000, 'El sueldo es demasiado alto');

export const crearEmpleadoSchema = z.object({
  nombre: nombreEmpleado,
  cargo: textoOpcional(60, 'El cargo'),
  sueldoBase: sueldo,
});

export const actualizarEmpleadoSchema = z.object({
  nombre: nombreEmpleado.optional(),
  cargo: textoOpcional(60, 'El cargo'),
  sueldoBase: sueldo.optional(),
  activo: z.boolean().optional(),
});

// ----- Gastos recurrentes -----

const nombreRecurrente = z
  .string()
  .trim()
  .min(2, 'El nombre debe tener al menos 2 caracteres')
  .max(80, 'El nombre no puede superar 80 caracteres');

const montoRecurrente = z.number().gt(0, 'El monto debe ser mayor que 0').max(100000000, 'El monto es demasiado alto');

// Hasta el 28 para que el día exista en todos los meses
const diaDelMes = z
  .number()
  .int('El día debe ser un número entero')
  .min(1, 'El día debe estar entre 1 y 28')
  .max(28, 'El día debe estar entre 1 y 28');

export const crearRecurrenteSchema = z.object({
  nombre: nombreRecurrente,
  categoriaId: z.number().int().positive('Elige la categoría'),
  cuentaId: z.number().int().positive('Elige la cuenta'),
  empleadoId: z.number().int().positive('Empleado no válido').nullish(),
  monto: montoRecurrente,
  diaDelMes,
  desdePeriodo: periodo,
});

export const actualizarRecurrenteSchema = z.object({
  nombre: nombreRecurrente.optional(),
  categoriaId: z.number().int().positive('Elige la categoría').optional(),
  cuentaId: z.number().int().positive('Elige la cuenta').optional(),
  empleadoId: z.number().int().positive('Empleado no válido').nullish(),
  monto: montoRecurrente.optional(),
  diaDelMes: diaDelMes.optional(),
  desdePeriodo: periodo.optional(),
  activo: z.boolean().optional(),
});

export const registrarPendienteSchema = z.object({
  recurrenteId: z.number().int().positive('Pago recurrente no válido'),
  periodo,
  monto: montoRecurrente.optional(), // si no viene, se usa el monto del recurrente
});