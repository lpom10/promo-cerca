import test from 'node:test';
import assert from 'node:assert/strict';
import { crearCachePorClaveConcurrent } from './concurrentCache.js';

test('evita duplicar la resolución para la misma clave cuando llegan solicitudes concurrentes', async () => {
  let llamadas = 0;

  const resolver = async (clave) => {
    llamadas += 1;
    await new Promise((resolve) => setTimeout(resolve, 20));
    return `valor-${clave}`;
  };

  const obtenerValor = crearCachePorClaveConcurrent(resolver);
  const [primera, segunda] = await Promise.all([
    obtenerValor('empresa-1'),
    obtenerValor('empresa-1'),
  ]);

  assert.equal(primera, 'valor-empresa-1');
  assert.equal(segunda, 'valor-empresa-1');
  assert.equal(llamadas, 1);
});
