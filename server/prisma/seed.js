import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Crea un usuario solo si no existe (no pisa contraseñas ya cambiadas)
async function crearUsuario({ nombre, username, password, rol }) {
  const passwordHash = await bcrypt.hash(password, 10);
  const usuario = await prisma.usuario.upsert({
    where: { username },
    update: {},
    create: { nombre, username, passwordHash, rol },
  });
  console.log(`Usuario listo: ${usuario.username} (${usuario.rol})`);
}

async function main() {
  // --- Usuarios ---
  const { ADMIN_NOMBRE, ADMIN_USERNAME, ADMIN_PASSWORD } = process.env;
  if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
    throw new Error('Faltan ADMIN_USERNAME o ADMIN_PASSWORD en el archivo .env');
  }
  await crearUsuario({
    nombre: ADMIN_NOMBRE || 'Administrador',
    username: ADMIN_USERNAME,
    password: ADMIN_PASSWORD,
    rol: 'admin',
  });

  const { SOCIA_NOMBRE, SOCIA_USERNAME, SOCIA_PASSWORD } = process.env;
  if (SOCIA_USERNAME && SOCIA_PASSWORD) {
    await crearUsuario({
      nombre: SOCIA_NOMBRE || 'Socia',
      username: SOCIA_USERNAME,
      password: SOCIA_PASSWORD,
      rol: 'admin',
    });
  }

  // --- Cuentas ---
  // El saldo inicial queda en 0: ajústalo después con el dinero real de cada cuenta
  const cuentas = ['Efectivo', 'Yape', 'Banco'];
  for (const nombre of cuentas) {
    await prisma.cuenta.upsert({
      where: { nombre },
      update: {},
      create: { nombre, saldoInicial: 0 },
    });
  }
  console.log(`Cuentas listas: ${cuentas.join(', ')}`);

  // --- Configuración ---
  const configuraciones = [
    {
      clave: 'costo_empaque_por_paquete',
      valor: '0.90',
      descripcion: 'Costo variable de empaque por cada pedido enviado (S/)',
    },
  ];
  for (const config of configuraciones) {
    await prisma.configuracion.upsert({
      where: { clave: config.clave },
      update: {},
      create: config,
    });
  }
  console.log('Configuración lista');

    // --- Categorías de gasto ---
  const categoriasGasto = [
    { nombre: 'Alquiler', tipo: 'fijo' },
    { nombre: 'Internet y servicios', tipo: 'fijo' },
    { nombre: 'Software y suscripciones', tipo: 'fijo' },
    { nombre: 'Publicidad', tipo: 'variable' },
    { nombre: 'Movilidad y delivery', tipo: 'variable' },
    { nombre: 'Sueldos', tipo: 'sueldo' },
    { nombre: 'Otros gastos', tipo: 'otro' },
  ];
  for (const categoria of categoriasGasto) {
    await prisma.categoriaGasto.upsert({
      where: { nombre: categoria.nombre },
      update: {},
      create: categoria,
    });
  }
  console.log('Categorías de gasto listas');
}

main()
  .catch((error) => {
    console.error('Error en la semilla:', error.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());