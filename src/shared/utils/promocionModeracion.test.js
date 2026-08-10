import test from 'node:test';
import assert from 'node:assert/strict';
import { obtenerEstadoInicialPromocion, obtenerActivaPorEstado } from './promocionModeracion.js';

test('las promociones nuevas entran en estado pendiente por defecto', () => {
  assert.equal(obtenerEstadoInicialPromocion({}), 'pendiente');
  assert.equal(obtenerEstadoInicialPromocion({ estado: 'aprobado' }), 'aprobado');
});

test('solo las promociones aprobadas deben quedar activas', () => {
  assert.equal(obtenerActivaPorEstado('aprobado'), true);
  assert.equal(obtenerActivaPorEstado('pendiente'), false);
  assert.equal(obtenerActivaPorEstado('rechazado'), false);
});
