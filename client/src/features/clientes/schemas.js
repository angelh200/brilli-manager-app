import { z } from 'zod';

const opcional = (max, etiqueta) =>
  z.string().trim().max(max, `${etiqueta} no puede superar ${max} caracteres`);

export const clienteSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede superar 100 caracteres'),
  apellido: z
    .string()
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede superar 100 caracteres'),
  usuarioTiktok: z
    .string()
    .trim()
    .max(60, 'El usuario no puede superar 60 caracteres')
    .refine((v) => v === '' || /^@?[A-Za-z0-9._]+$/.test(v), 'Solo letras, números, puntos y guiones bajos'),
  celular: z
    .string()
    .trim()
    .refine((v) => v === '' || /^[+\d\s()-]{6,20}$/.test(v), 'Teléfono no válido (solo números, espacios, +, - y paréntesis)'),
  dni: z
    .string()
    .trim()
    .refine((v) => v === '' || /^[A-Za-z0-9]{8,12}$/.test(v), 'Debe tener entre 8 y 12 caracteres (letras y números)'),
  departamento: opcional(80, 'El departamento'),
  ciudad: opcional(80, 'La ciudad'),
  provincia: opcional(80, 'La provincia'),
  agenciaDestino: opcional(100, 'La agencia'),
  notas: opcional(500, 'Las notas'),
});