import test from 'node:test';
import assert from 'node:assert/strict';
import { getDashboardPathByRole } from './dashboardPaths.js';
import { PATHS } from './paths.js';

test('devuelve la ruta de dashboard del cliente', () => {
  assert.equal(getDashboardPathByRole('cliente'), PATHS.cliente.dashboard);
});

test('devuelve la ruta de dashboard de la empresa', () => {
  assert.equal(getDashboardPathByRole('empresa'), PATHS.empresa.dashboard);
});

test('devuelve la ruta de dashboard del administrador', () => {
  assert.equal(getDashboardPathByRole('admin'), PATHS.admin.dashboard);
});

test('devuelve null para roles no reconocidos', () => {
  assert.equal(getDashboardPathByRole('desconocido'), null);
});
