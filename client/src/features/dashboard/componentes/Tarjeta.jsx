import { Link } from 'react-router-dom';

export default function Tarjeta({ titulo, enlace, className = '', children }) {
  return (
    <section className={`rounded-xl border border-gray-200 bg-white p-4 ${className}`}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="font-semibold text-gray-800">{titulo}</h2>
        {enlace && (
          <Link to={enlace.to} className="shrink-0 text-xs text-pink-600 hover:underline">
            {enlace.texto}
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}