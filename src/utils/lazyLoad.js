import React from 'react';
import { logError } from './errorHandler';

/**
 * Lazy load component con mejor manejo de errores
 * @param {Function} importFn - Dynamic import function
 * @param {String} componentName - Name for error logging
 * @returns {React.LazyComponent}
 */
export const lazyLoadComponent = (importFn, componentName = 'Component') => {
  return React.lazy(async () => {
    try {
      const module = await importFn();
      return module;
    } catch (error) {
      logError(error, {
        accion: 'lazyLoadComponent',
        componente: componentName,
        tipo: 'LAZY_LOAD_ERROR'
      });
      throw error;
    }
  });
};

export default lazyLoadComponent;
