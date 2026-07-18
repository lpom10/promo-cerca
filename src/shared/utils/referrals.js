export const normalizarCodigoReferido = (codigo = '') => {
  if (typeof codigo !== 'string') return '';
  return codigo.trim().toUpperCase().replace(/\s+/g, '');
};

export const generarCodigoReferido = (seed = '') => {
  const base = normalizarCodigoReferido(seed || 'PROMO')
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 6);

  const randomPart = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${base || 'PROMO'}${randomPart}`.slice(0, 8);
};
