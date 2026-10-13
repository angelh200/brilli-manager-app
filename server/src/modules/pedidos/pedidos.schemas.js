import { z } from 'zod';

const textoOpcional = (max, etiqueta) =>
  z
    .string()
    .trim()
    .max(max, `${etiqueta} no puede superar ${max} caracteres`)
    .transform((v) => (v === '' ? null : v))
    .nullish();

const ESTADOS = ['acumulando', 'empaquetado', 'en_agencia', 'recibido', 'cancelado'];

export const actualizarPedidoSchema = z.object({
  agencia: textoOpcional(100, 'La agencia'),
  codigoSeguimiento: textoOpcional(60, 'El código de seguimiento'),
  notas: textoOpcional(500, 'Las notas'),
  costoEmpaque: z.number().min(0, 'El costo no puede ser negativo').max(1000, 'El costo es demasiado alto').optional(),
});

export const cambiarEstadoSchema = z.object({
  estado: z.enum(ESTADOS, { message: 'Estado no válido' }),
});

export const listadoPedidosQuerySchema = z.object({
  estado: z.enum(ESTADOS, { message: 'Estado no válido' }).optional(),
  clienteId: z.coerce.number().int().positive().optional(),
  buscar: z.string().trim().optional(),
  limite: z.coerce.number().int().min(1).max(500).default(200),
});

export const pedidoAbiertoQuerySchema = z.object({
  clienteId: z.coerce.number().int().positive('Cliente no válido'),
});