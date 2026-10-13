import { z } from 'zod';

const nombre = z
  .string()
  .trim()
  .min(2, 'El nombre debe tener al menos 2 caracteres')
  .max(100, 'El nombre no puede superar 100 caracteres');

const apellido = z
  .string()
  .trim()
  .min(2, 'El apellido debe tener al menos 2 caracteres')
  .max(100, 'En apellido no puede superar 100 caracteres');

// Sin "@" inicial, en minúsculas; "" se guarda como null
const usuarioTiktok = z
  .string()
  .trim()
  .max(60, 'El usuario de TikTok no puede superar 60 caracteres')
  .transform((v) => v.replace(/^@+/, '').toLowerCase())
  .refine(
    (v) => v === '' || /^[a-z0-9._]+$/.test(v),
    'El usuario de TikTok solo puede tener letras, números, puntos y guiones bajos'
  )
  .transform((v) => (v === '' ? null : v))
  .nullish();

const celular = z
  .string()
  .trim()
  .refine(
    (v) => v === '' || /^[+\d\s()-]{6,20}$/.test(v),
    'El teléfono no es válido (solo números, espacios, +, - y paréntesis)'
  )
  .transform((v) => (v === '' ? null : v))
  .nullish();

const dni = z
  .string()
  .trim()
  .refine(
    (v) => v === '' || /^[A-Za-z0-9]{8,12}$/.test(v),
    'El documento debe tener entre 8 y 12 caracteres (solo letras y números)'
  )
  .transform((v) => (v === '' ? null : v))
  .nullish();

const textoOpcional = (max, etiqueta) =>
  z
    .string()
    .trim()
    .max(max, `${etiqueta} no puede superar ${max} caracteres`)
    .transform((v) => (v === '' ? null : v))
    .nullish();

const camposComunes = {
  usuarioTiktok,
  celular,
  dni,
  departamento: textoOpcional(80, 'El Departamento'),
  ciudad: textoOpcional(80, 'La ciudad'),
  provincia: textoOpcional(80, 'La provincia'),
  agenciaDestino: textoOpcional(100, 'La agencia'),
  notas: textoOpcional(500, 'Las notas'),
};

export const crearClienteSchema = z.object({ nombre, ...camposComunes });

// undefined = no cambiar; null o "" = borrar el valor
export const actualizarClienteSchema = z.object({
  nombre: nombre.optional(),
  ...camposComunes,
  activo: z.boolean().optional(),
});

export const listadoQuerySchema = z.object({
  buscar: z.string().trim().optional(),
  activo: z.enum(['true', 'false', 'todos'], { message: 'Valor de "activo" no válido' }).default('true'),
  pagina: z.coerce.number().int().min(1).default(1),
  limite: z.coerce.number().int().min(1).max(100).default(20),
});