import 'dotenv/config';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
import express from 'express';
import cookieParser from 'cookie-parser';
import { prisma } from './lib/prisma.js';
import { ErrorHttp } from './lib/errores.js';
import authRoutes from './modules/auth/auth.routes.js';
import productosRoutes from './modules/productos/productos.routes.js';
import categoriasRoutes from './modules/categorias/categorias.routes.js';
import clientesRoutes from './modules/clientes/clientes.routes.js';
import cuentasRoutes from './modules/cuentas/cuentas.routes.js';
import ventasRoutes from './modules/ventas/ventas.routes.js';
import pedidosRoutes from './modules/pedidos/pedidos.routes.js';
import comprasRoutes from './modules/compras/compras.routes.js';
import proveedoresRoutes from './modules/proveedores/proveedores.routes.js';
import cajaRoutes from './modules/caja/caja.routes.js';
import finanzasRoutes from './modules/finanzas/finanzas.routes.js';
import dashboardRoutes from './modules/dashboard/dashboard.routes.js';

const app = express();

// Render está detrás de un proxy HTTPS: necesario para las cookies seguras y el límite de intentos de login
app.set('trust proxy', 1);

// No toca la base de datos: sirve para comprobar que la app está viva sin despertar a Neon
app.get('/api/ping', (req, res) => res.json({ ok: true }));

app.use(express.json());
app.use(cookieParser());

app.get('/api/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', db: 'conectada' });
  } catch (error) {
    res.status(500).json({ status: 'error', db: 'sin conexion' });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/categorias', categoriasRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/cuentas', cuentasRoutes);
app.use('/api/ventas', ventasRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/compras', comprasRoutes);
app.use('/api/proveedores', proveedoresRoutes);
app.use('/api/caja', cajaRoutes);
app.use('/api/finanzas', finanzasRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Rutas /api que no existen
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Producción: Express también entrega la aplicación React ya compilada
const carpetaCliente = path.resolve(__dirname, '../../client/dist');
if (existsSync(carpetaCliente)) {
  app.use(express.static(carpetaCliente));
  // Cualquier otra ruta (por ejemplo /ventas al recargar) devuelve la app
  app.get('/{*ruta}', (req, res) => res.sendFile(path.join(carpetaCliente, 'index.html')));
}

// Manejador global de errores (Express 5 captura los errores de funciones async)
app.use((err, req, res, next) => {
  if (err instanceof ErrorHttp) {
    return res.status(err.status).json({ error: err.message });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'El cuerpo de la petición no es un JSON válido' });
  }
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor en http://localhost:${PORT}`));