import test from 'node:test';
import assert from 'node:assert/strict';
import { generarCodigoReferido, normalizarCodigoReferido } from './referrals.js';

test('genera un código de referido legible y estable en formato', () => {
  const codigo = generarCodigoReferido('abc123');
  assert.match(codigo, /^[A-Z0-9]{4,10}$/);
});

test('normaliza códigos de referido a mayúsculas y sin espacios', () => {
  assert.equal(normalizarCodigoReferido('  abc-123  '), 'ABC-123');
});
