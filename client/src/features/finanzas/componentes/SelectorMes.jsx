import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { etiquetaMes, periodoActual, sumarMeses } from '@/lib/finanzas';

export default function SelectorMes({ periodo, onCambiar }) {
  const actual = periodoActual();
  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="icon" className="size-11 shrink-0" onClick={() => onCambiar(sumarMeses(periodo, -1))} aria-label="Mes anterior">
        <ChevronLeft size={18} />
      </Button>
      <p className="flex-1 text-center font-semibold capitalize text-gray-800">{etiquetaMes(periodo)}</p>
      <Button
        variant="outline"
        size="icon"
        className="size-11 shrink-0"
        disabled={periodo >= actual}
        onClick={() => onCambiar(sumarMeses(periodo, 1))}
        aria-label="Mes siguiente"
      >
        <ChevronRight size={18} />
      </Button>
      {periodo !== actual && (
        <Button variant="outline" className="h-11 shrink-0" onClick={() => onCambiar(actual)}>
          Este mes
        </Button>
      )}
    </div>
  );
}