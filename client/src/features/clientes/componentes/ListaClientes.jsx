import { Link, useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

function Inicial({ nombre }) {
  return (
    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-pink-100 font-semibold text-pink-600">
      {nombre.charAt(0).toUpperCase()}
    </div>
  );
}

export default function ListaClientes({ clientes }) {
  const navigate = useNavigate();

  return (
    <>
      {/* Escritorio: tabla */}
      <div className="hidden rounded-xl border border-gray-200 bg-white md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Apellido</TableHead>
              <TableHead>TikTok</TableHead>
              <TableHead>Celular</TableHead>
              <TableHead>Departamento</TableHead>
              <TableHead>Ciudad</TableHead>
              <TableHead>Provincia</TableHead>
              <TableHead>Agencia</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clientes.map((c) => (
              <TableRow
                key={c.id}
                onClick={() => navigate(`/clientes/${c.id}`)}
                className={`cursor-pointer ${c.activo ? '' : 'opacity-60'}`}
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Inicial nombre={c.nombre} />
                    <span className="font-medium text-gray-800">{c.nombre}</span>
                    {!c.activo && <Badge variant="outline">Inactivo</Badge>}
                  </div>
                </TableCell>
                <TableCell className="text-gray-600">{c.apellido ?? '—'}</TableCell>
                <TableCell className="text-gray-600">{c.usuarioTiktok ? `@${c.usuarioTiktok}` : '—'}</TableCell>
                <TableCell className="text-gray-600">{c.celular ?? '—'}</TableCell>
                <TableCell className="text-gray-600">{c.departamento ?? '—'}</TableCell>
                <TableCell className="text-gray-600">{c.ciudad ?? '—'}</TableCell>
                <TableCell className="text-gray-600">{c.provincia ?? '—'}</TableCell>
                <TableCell className="text-gray-600">{c.agenciaDestino ?? '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Celular: tarjetas */}
      <div className="space-y-2 md:hidden">
        {clientes.map((c) => (
          <Link
            key={c.id}
            to={`/clientes/${c.id}`}
            className={`flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 ${c.activo ? '' : 'opacity-60'}`}
          >
            <Inicial nombre={c.nombre} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-gray-800">{c.nombre}</p>
              <p className="truncate font-medium text-gray-800">{c.apellido}</p>
              <p className="truncate font-medium text-gray-800">{c.celular}</p>
              <p className="truncate text-sm text-gray-500">
                {c.usuarioTiktok ? `@${c.usuarioTiktok}` : 'Sin usuario de TikTok'}
              </p>
              <p className="truncate text-xs text-gray-400">
                {[c.departamento, c.ciudad, c.provincia, c.agenciaDestino].filter(Boolean).join(' · ') || 'Sin datos de envío'}
                {!c.activo && ' · Inactivo'}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}