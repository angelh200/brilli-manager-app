import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import CampoFormulario from '@/components/comunes/CampoFormulario';
import { formatearSoles, hoyLima } from '@/lib/formato';
import { aNumero } from '@/features/inventario/schemas';
import { useCuentas } from '@/features/ventas/hooks';
import ProductoBuscador from '@/features/ventas/componentes/ProductoBuscador';
import { calcularCompra } from '@/features/compras/calculos';
import { useProveedores, useRegistrarCompra } from '@/features/compras/hooks';
import LineasCompra from '@/features/compras/componentes/LineasCompra';
import ProveedoresDialog from '@/features/compras/componentes/ProveedoresDialog';

function Seccion({ numero, titulo, error, children }) {
  return (
    <section className="space-y-3 rounded-xl border border-gray-200 bg-white p-4">
      <h2 className="flex items-center gap-2 font-semibold text-gray-800">
        <span className="flex size-6 items-center justify-center rounded-full bg-pink-100 text-sm text-pink-600">
          {numero}
        </span>
        {titulo}
      </h2>
      {children}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </section>
  );
}

export default function NuevaCompraPage() {
  const navigate = useNavigate();
  const hoy = hoyLima();

  const { data: proveedores = [] } = useProveedores();
  const { data: cuentas = [] } = useCuentas();
  const registrar = useRegistrarCompra();

  const [proveedorId, setProveedorId] = useState('ninguno');
  const [lineas, setLineas] = useState([]); // [{ producto, cantidad, costo }] (textos)
  const [gastos, setGastos] = useState('');
  const [cuentaId, setCuentaId] = useState('');
  const [fecha, setFecha] = useState(hoy);
  const [notas, setNotas] = useState('');
  const [errores, setErrores] = useState({});
  const [proveedoresAbierto, setProveedoresAbierto] = useState(false);

  const calculo = calcularCompra(lineas, gastos);
  const cantidadesEnCompra = new Map(lineas.map((l) => [l.producto.id, aNumero(l.cantidad) || 0]));

  function agregarProducto(producto) {
    setErrores((e) => ({ ...e, items: undefined }));
    setLineas((previas) => {
      if (previas.some((l) => l.producto.id === producto.id)) {
        return previas.map((l) =>
          l.producto.id === producto.id ? { ...l, cantidad: String((aNumero(l.cantidad) || 0) + 1) } : l
        );
      }
      // El costo se deja vacío a propósito: obliga a escribir el costo real de esta compra
      return [...previas, { producto, cantidad: '1', costo: '' }];
    });
  }

  function cambiarLinea(productoId, cambios) {
    setLineas((previas) => previas.map((l) => (l.producto.id === productoId ? { ...l, ...cambios } : l)));
  }

  function quitarLinea(productoId) {
    setLineas((previas) => previas.filter((l) => l.producto.id !== productoId));
  }

  function validar() {
    const nuevos = {};
    if (lineas.length === 0) nuevos.items = 'Agrega al menos un producto';
    else if (!calculo.todasValidas) {
      nuevos.items = 'Revisa las líneas: cantidades enteras desde 1 y costos mayores que 0';
    }
    const gastosNum = aNumero(gastos);
    if (!Number.isFinite(gastosNum) || gastosNum < 0) nuevos.gastos = 'Los gastos deben ser un número mayor o igual a 0';
    if (!cuentaId) nuevos.cuenta = 'Elige la cuenta de la que salió el dinero';
    if (!fecha) nuevos.fecha = 'Elige la fecha';
    else if (fecha > hoy) nuevos.fecha = 'La fecha no puede ser futura';
    setErrores(nuevos);
    return Object.keys(nuevos).length === 0;
  }

  async function alEnviar(e) {
    e.preventDefault();
    if (!validar()) return;

    const datos = {
      proveedorId: proveedorId === 'ninguno' ? null : Number(proveedorId),
      cuentaId: Number(cuentaId),
      gastosAdicionales: calculo.gastos,
      notas: notas.trim() || null,
      items: calculo.detalle.map((d) => ({
        productoId: d.producto.id,
        cantidad: d.cant,
        costoUnitario: d.costoNum,
      })),
    };
    if (fecha !== hoy) datos.fecha = `${fecha}T12:00:00-05:00`;

    try {
      const respuesta = await registrar.mutateAsync(datos);
      toast.success(`Compra #${respuesta.compra.id} registrada · ${formatearSoles(respuesta.compra.total)}`);
      navigate('/compras');
    } catch {
      // El mensaje de error ya se muestra con un aviso (toast)
    }
  }

  return (
    <form onSubmit={alEnviar} className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Nueva compra</h1>
        <Link to="/compras" className="text-sm text-gray-600 hover:text-pink-600">
          Ver compras
        </Link>
      </div>

      <Seccion numero="1" titulo="Proveedor (opcional)">
        <div className="flex gap-2">
          <Select value={proveedorId} onValueChange={setProveedorId}>
            <SelectTrigger className="h-11 w-full" aria-label="Proveedor">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ninguno">Sin proveedor</SelectItem>
              {proveedores.map((p) => (
                <SelectItem key={p.id} value={String(p.id)}>
                  {p.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="button" variant="outline" className="h-11 shrink-0" onClick={() => setProveedoresAbierto(true)}>
            Gestionar
          </Button>
        </div>
      </Seccion>

      <Seccion numero="2" titulo="Productos" error={errores.items}>
        <ProductoBuscador onAgregar={agregarProducto} cantidadesEnVenta={cantidadesEnCompra} permitirAgotados />
        <LineasCompra detalle={calculo.detalle} onCambiar={cambiarLinea} onQuitar={quitarLinea} />
      </Seccion>

      <Seccion numero="3" titulo="Pago y total">
        <CampoFormulario
          etiqueta="Gastos adicionales (S/)"
          htmlFor="gastos"
          error={errores.gastos}
          ayuda="Flete, movilidad u otros. Se reparten entre los productos según su valor."
        >
          <Input
            id="gastos"
            inputMode="decimal"
            className="h-11"
            placeholder="0.00"
            value={gastos}
            onChange={(e) => {
              setGastos(e.target.value);
              setErrores((er) => ({ ...er, gastos: undefined }));
            }}
          />
        </CampoFormulario>

        <div className="space-y-1 rounded-lg bg-gray-50 px-3 py-2 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal de productos</span>
            <span>{formatearSoles(calculo.subtotal)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Gastos adicionales</span>
            <span>{formatearSoles(calculo.gastos)}</span>
          </div>
          <div className="flex justify-between border-t border-gray-200 pt-1 text-base font-semibold text-gray-800">
            <span>Total a pagar</span>
            <span>{formatearSoles(calculo.total)}</span>
          </div>
        </div>

        <CampoFormulario etiqueta="Cuenta de la que salió el dinero" htmlFor="cuenta" error={errores.cuenta}>
          <Select
            value={cuentaId}
            onValueChange={(v) => {
              setCuentaId(v);
              setErrores((er) => ({ ...er, cuenta: undefined }));
            }}
          >
            <SelectTrigger id="cuenta" className="h-11 w-full">
              <SelectValue placeholder="Elige la cuenta" />
            </SelectTrigger>
            <SelectContent>
              {cuentas.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {c.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CampoFormulario>

        <CampoFormulario etiqueta="Fecha de la compra" htmlFor="fecha" error={errores.fecha}>
          <Input
            id="fecha"
            type="date"
            max={hoy}
            className="h-11"
            value={fecha}
            onChange={(e) => {
              setFecha(e.target.value);
              setErrores((er) => ({ ...er, fecha: undefined }));
            }}
          />
        </CampoFormulario>

        <CampoFormulario etiqueta="Notas (opcional)" htmlFor="notas">
          <Textarea id="notas" rows={2} maxLength={300} value={notas} onChange={(e) => setNotas(e.target.value)} />
        </CampoFormulario>
      </Seccion>

      <Button type="submit" className="h-12 w-full text-base" disabled={registrar.isPending}>
        {registrar.isPending ? 'Registrando...' : 'Registrar compra'}
      </Button>

      <ProveedoresDialog abierto={proveedoresAbierto} onCerrar={() => setProveedoresAbierto(false)} />
    </form>
  );
}