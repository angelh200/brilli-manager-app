import { Button } from '@/components/ui/button';

export default function Paginacion({ pagina, total, limite, onCambiar }) {
  const totalPaginas = Math.max(1, Math.ceil(total / limite));
  if (totalPaginas <= 1) return null;

  return (
    <div className="flex items-center justify-between">
      <Button variant="outline" className="h-10" disabled={pagina <= 1} onClick={() => onCambiar(pagina - 1)}>
        Anterior
      </Button>
      <span className="text-sm text-gray-500">
        Página {pagina} de {totalPaginas}
      </span>
      <Button variant="outline" className="h-10" disabled={pagina >= totalPaginas} onClick={() => onCambiar(pagina + 1)}>
        Siguiente
      </Button>
    </div>
  );
}