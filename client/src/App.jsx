import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import RutaProtegida from './components/comunes/RutaProtegida';
import PaginaPendiente from './components/comunes/PaginaPendiente';
import AppLayout from './layouts/AppLayout';
import LoginPage from './pages/LoginPage';
import MasPage from './pages/MasPage';
import InventarioPage from './pages/InventarioPage';
import ProductoDetallePage from './pages/ProductoDetallePage';
import ClientesPage from './pages/ClientesPage';
import ClienteDetallePage from './pages/ClienteDetallePage';
import VentasPage from './pages/VentasPage';
import NuevaVentaPage from './pages/NuevaVentaPage';
import PedidosPage from './pages/PedidosPage';
import PedidoDetallePage from './pages/PedidoDetallePage';
import ComprasPage from './pages/ComprasPage';
import NuevaCompraPage from './pages/NuevaCompraPage';
import CajaPage from './pages/CajaPage';
import FinanzasPage from './pages/FinanzasPage';
import DashboardPage from './pages/DashboardPage';

// "/" es el Dashboard para admin; el ayudante va directo a Ventas
// "/" es el Dashboard para admin; el ayudante va directo a Ventas
function Inicio() {
  const { usuario } = useAuth();
  if (usuario.rol !== 'admin') return <Navigate to="/ventas" replace />;
  return <DashboardPage />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<RutaProtegida />}>
        <Route element={<AppLayout />}>
          <Route index element={<Inicio />} />
          <Route path="ventas" element={<VentasPage />} />
          <Route path="ventas/nueva" element={<NuevaVentaPage />} />
          <Route path="pedidos" element={<PedidosPage />} />
          <Route path="pedidos/:id" element={<PedidoDetallePage />} />
          <Route path="clientes" element={<ClientesPage />} />
          <Route path="clientes/:id" element={<ClienteDetallePage />} />
          <Route path="inventario" element={<InventarioPage />} />
          <Route path="inventario/:id" element={<ProductoDetallePage />} />
          <Route path="mas" element={<MasPage />} />

          {/* Solo admin */}
          <Route element={<RutaProtegida roles={['admin']} />}>
            <Route path="compras" element={<ComprasPage />} />
            <Route path="compras/nueva" element={<NuevaCompraPage />} />
            <Route path="caja" element={<CajaPage />} />
            <Route path="finanzas" element={<FinanzasPage />} />
            <Route path="reportes" element={<PaginaPendiente titulo="Reportes" />} />
            <Route path="config" element={<PaginaPendiente titulo="Configuración" />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}