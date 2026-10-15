import { NavLink, Outlet } from 'react-router-dom';
import { LogOut, Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { seccionesPara } from '../lib/navegacion';

export default function AppLayout() {
  const { usuario, logout } = useAuth();
  const secciones = seccionesPara(usuario.rol);
  const principales = secciones.filter((s) => s.principal);

  return (
    <div className="min-h-screen bg-gray-50 md:flex">
      {/* Barra lateral: solo escritorio */}
      <aside className="print:hidden hidden md:flex md:w-60 md:flex-col md:fixed md:inset-y-0 bg-white border-r border-gray-200">
        <div className="px-5 py-5 text-xl font-bold text-pink-600">Brilli Manager</div>

        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {secciones.map(({ ruta, etiqueta, icono: Icono, end }) => (
            <NavLink
              key={ruta}
              to={ruta}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${
                  isActive ? 'bg-pink-50 text-pink-600' : 'text-gray-600 hover:bg-gray-100'
                }`
              }
            >
              <Icono size={18} />
              {etiqueta}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-gray-200 p-4">
          <p className="text-sm font-medium text-gray-800 truncate">{usuario.nombre}</p>
          <p className="text-xs text-gray-500 mb-3">{usuario.rol}</p>
          <button
            onClick={logout}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-pink-600"
          >
            <LogOut size={16} /> Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Contenido */}
      <main className="print:ml-0 print:p-0 flex-1 md:ml-60 p-4 pb-24 md:p-8 md:pb-8">
        <Outlet />
      </main>

      {/* Barra inferior: solo celular */}
      <nav className="print:hidden md:hidden fixed bottom-0 inset-x-0 z-10 bg-white border-t border-gray-200 flex justify-around">
        {principales.map(({ ruta, etiqueta, icono: Icono }) => (
          <NavLink
            key={ruta}
            to={ruta}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 py-2 px-3 text-xs ${
                isActive ? 'text-pink-600' : 'text-gray-500'
              }`
            }
          >
            <Icono size={22} />
            {etiqueta}
          </NavLink>
        ))}
        <NavLink
          to="/mas"
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 py-2 px-3 text-xs ${
              isActive ? 'text-pink-600' : 'text-gray-500'
            }`
          }
        >
          <Menu size={22} />
          Más
        </NavLink>
      </nav>
    </div>
  );
}