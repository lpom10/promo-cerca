export const crearCachePorClaveConcurrent = (resolver) => {
  const cache = new Map();

  return async (clave) => {
    if (cache.has(clave)) {
      return cache.get(clave);
    }

    const promesaEnCurso = resolver(clave);
    cache.set(clave, promesaEnCurso);

    try {
      return await promesaEnCurso;
    } finally {
      if (cache.get(clave) === promesaEnCurso) {
        cache.delete(clave);
      }
    }
  };
};
