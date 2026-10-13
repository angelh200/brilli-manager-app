import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import CampoFormulario from '@/components/comunes/CampoFormulario';
import ConfirmarDialogo from '@/components/comunes/ConfirmarDialogo';
import { useAuth } from '@/context/AuthContext';
import { formatearSoles, hoyLima } from '@/lib/formato';
import { aNumero } from '@/features/inventario/schemas';
import { useCuentas, useRegistrarVenta } from '@/features/ventas/hooks';
import AvisoPedido from '@/features/ventas/componentes/AvisoPedido';
import ClienteSelector from '@/features/ventas/componentes/ClienteSelector';
import LineasVenta from '@/features/ventas/componentes/LineasVenta';
import ProductoBuscador from '@/features/ventas/componentes/ProductoBuscador';

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

export default function NuevaVentaPage() {
  const { usuario } = useAuth();
  const esAdmin = usuario.rol === 'admin';

  const { data: cuentas = [] } = useCuentas();
  const registrar = useRegistrarVenta();

  const [cliente, setCliente] = useState(null);
  const [lineas, setLineas] = useState([]); // [{ producto, cantidad }]
  const [monto, setMonto] = useState('');
  const [cuentaId, setCuentaId] = useState('');
  const [fecha, setFecha] = useState(hoyLima());
  const [notas, setNotas] = useState('');
  const [errores, setErrores] = useState({});
  const [confirmarSinCobro, setConfirmarSinCobro] = useState(false);
  const [sesion, setSesion] = useState({ cantidad: 0, total: 0 });

  const hoy = hoyLima();
  const montoNum = aNumero(monto);
  const montoValido = Number.isFinite(montoNum) && montoNum >= 0;
  const unidades = lineas.reduce((suma, l) => suma + l.cantidad, 0);
  const cantidadesEnVenta = new Map(lineas.map((l) => [l.producto.id, l.cantidad]));

  // Estimación para admin (el costo solo llega a admin desde la API)
  const verEstimacion = esAdmin && lineas.length > 0 && montoValido;
  const costoEstimado = lineas.reduce((s, l) => s + l.cantidad * (l.producto.costoPromedio ?? 0), 0);
  const utilidadEstimada = montoNum - costoEstimado;

  function agregarProducto(producto) {
    setErrores((e) => ({ ...e, items: undefined }));
    setLineas((previas) => {
      const existente = previas.find((l) => l.producto.id === producto.id);
      if (existente) {
        return previas.map((l) =>
          l.producto.id === producto.id
            ? { ...l, cantidad: Math.min(l.cantidad + 1, producto.stockActual) }
            : l
        );
      }
      return [...previas, { producto, cantidad: 1 }];
    });
  }

  function cambiarCantidad(productoId, cantidad) {
    setLineas((previas) =>
      previas.map((l) => (l.producto.id === productoId ? { ...l, cantidad: Math.max(1, cantidad) } : l))
    );
  }

  function quitarProducto(productoId) {
    setLineas((previas) => previas.filter((l) => l.producto.id !== productoId));
  }

  function validar() {
    const nuevos = {};
    if (!cliente) nuevos.cliente = 'Elige un cliente';
    if (lineas.length === 0) {
      nuevos.items = 'Agrega al menos un producto';
    } else {
      const exceso = lineas.find((l) => l.cantidad > l.producto.stockActual);
      if (exceso) {
        nuevos.items = `Stock insuficiente de "${exceso.producto.nombre}": hay ${exceso.producto.stockActual}`;
      }
    }
    if (!montoValido) nuevos.monto = 'El monto debe ser un número mayor o igual a 0';
    if (montoValido && montoNum > 0 && !cuentaId) nuevos.cuenta = 'Elige la cuenta donde se recibió el pago';
    if (!fecha) nuevos.fecha = 'Elige la fecha';
    else if (fecha > hoy) nuevos.fecha = 'La fecha no puede ser futura';

    setErrores(nuevos);
    return Object.keys(nuevos).length === 0;
  }

  function alEnviar(e) {
    e.preventDefault();
    if (!validar()) return;
    if (montoNum === 0) {
      setConfirmarSinCobro(true); // venta sin cobro: pide confirmación explícita
      return;
    }
    enviar();
  }

  async function enviar() {
    setConfirmarSinCobro(false);

    const datos = {
      clienteId: cliente.id,
      montoPagado: montoNum,
      cuentaId: montoNum > 0 ? Number(cuentaId) : null,
      notas: notas.trim() || null,
      items: lineas.map((l) => ({ productoId: l.producto.id, cantidad: l.cantidad })),
    };
    // Si es hoy, el servidor usa la hora actual; si es otro día, se registra al mediodía de Lima
    if (fecha !== hoy) datos.fecha = `${fecha}T12:00:00-05:00`;

    try {
      const respuesta = await registrar.mutateAsync(datos);
      const pedidoId = respuesta.venta.pedido?.id;
      toast.success(
        respuesta.pedidoNuevo
          ? `Venta registrada · se creó el pedido #${pedidoId}`
          : `Venta registrada · agregada al pedido #${pedidoId}`
      );

      // Listo para la siguiente venta: se conservan la fecha y la cuenta
      setSesion((s) => ({ cantidad: s.cantidad + 1, total: s.total + montoNum }));
      setCliente(null);
      setLineas([]);
      setMonto('');
      setNotas('');
      setErrores({});
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      // El mensaje de error ya se muestra con un aviso (toast)
    }
  }

  return (
    <form onSubmit={alEnviar} className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Nueva venta</h1>
        <Link to="/ventas" className="text-sm text-gray-600 hover:text-pink-600">
          Ver ventas
        </Link>
      </div>

      {sesion.cantidad > 0 && (
        <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">
          Registradas en esta sesión: <strong>{sesion.cantidad}</strong> · {formatearSoles(sesion.total)} cobrados.{' '}
          <Link to="/ventas" className="font-medium underline">
            Revisar ventas
          </Link>
        </p>
      )}

      <Seccion numero="1" titulo="Cliente" error={errores.cliente}>
        <ClienteSelector
          cliente={cliente}
          onSeleccionar={(c) => {
            setCliente(c);
            setErrores((e) => ({ ...e, cliente: undefined }));
          }}
        />
        {cliente && <AvisoPedido clienteId={cliente.id} />}
      </Seccion>

      <Seccion numero="2" titulo={`Productos${unidades > 0 ? ` (${unidades} ${unidades === 1 ? 'unidad' : 'unidades'})` : ''}`} error={errores.items}>
        <ProductoBuscador onAgregar={agregarProducto} cantidadesEnVenta={cantidadesEnVenta} />
        <LineasVenta lineas={lineas} onCambiar={cambiarCantidad} onQuitar={quitarProducto} />
      </Seccion>

      <Seccion numero="3" titulo="Pago">
        <CampoFormulario
          etiqueta="Monto pagado (S/)"
          htmlFor="monto"
          error={errores.monto}
          ayuda="Pon 0 si es un premio o regalo sin cobro."
        >
          <Input
            id="monto"
            inputMode="decimal"
            className="h-11"
            placeholder="0.00"
            value={monto}
            onChange={(e) => {
              setMonto(e.target.value);
              setErrores((er) => ({ ...er, monto: undefined, cuenta: undefined }));
            }}
          />
        </CampoFormulario>

        {montoValido && montoNum > 0 && (
          <CampoFormulario etiqueta="Cuenta donde se recibió" htmlFor="cuenta" error={errores.cuenta}>
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
        )}

        {lineas.length > 0 && montoValido && montoNum === 0 && (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Sin monto: se registrará como premio, regalo o combo sin cobro. Descuenta stock y cuenta como costo, pero no
            genera ingreso.
          </p>
        )}

        {verEstimacion && (
          <p className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700">
            Costo estimado: <strong>{formatearSoles(costoEstimado)}</strong> · Utilidad estimada:{' '}
            <strong className={utilidadEstimada >= 0 ? 'text-green-600' : 'text-red-600'}>
              {formatearSoles(utilidadEstimada)}
            </strong>
          </p>
        )}

        <CampoFormulario etiqueta="Fecha de la venta" htmlFor="fecha" error={errores.fecha}>
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
        {fecha && fecha < hoy && (
          <p className="text-sm text-amber-700">Estás registrando una venta de otro día.</p>
        )}

        <CampoFormulario etiqueta="Notas (opcional)" htmlFor="notas">
          <Textarea id="notas" rows={2} value={notas} onChange={(e) => setNotas(e.target.value)} maxLength={300} />
        </CampoFormulario>
        <div className="flex flex-wrap gap-2">
          {['Premio', 'Regalo', 'Combo'].map((texto) => (
            <button
              key={texto}
              type="button"
              onClick={() => setNotas(texto)}
              className="rounded-full border border-gray-300 px-3 py-1 text-xs text-gray-600 hover:border-pink-300 hover:text-pink-600"
            >
              {texto}
            </button>
          ))}
        </div>
      </Seccion>

      <Button type="submit" className="h-12 w-full text-base" disabled={registrar.isPending}>
        {registrar.isPending ? 'Registrando...' : 'Registrar venta'}
      </Button>

      <ConfirmarDialogo
        abierto={confirmarSinCobro}
        titulo="Venta sin cobro"
        descripcion="Esta venta tiene un monto de S/ 0.00. Se descontará el stock y contará como costo, pero no se registrará ningún ingreso. ¿Confirmas que es un premio o regalo?"
        textoConfirmar="Sí, registrar"
        cargando={registrar.isPending}
        onConfirmar={enviar}
        onCancelar={() => setConfirmarSinCobro(false)}
      />
    </form>
  );
}