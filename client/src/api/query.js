export function construirQuery(filtros = {}) {
  const params = new URLSearchParams();
  Object.entries(filtros).forEach(([clave, valor]) => {
    if (valor !== undefined && valor !== null && valor !== '') params.set(clave, valor);
  });
  const texto = params.toString();
  return texto ? `?${texto}` : '';
}