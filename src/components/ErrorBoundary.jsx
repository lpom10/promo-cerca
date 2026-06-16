import React, { Component } from 'react';
import { logError, ERROR_LEVELS } from '../utils/errorHandler';
import '../styles/errorBoundary.css';

/**
 * Error Boundary para capturar errores en componentes hijos
 * Previene que un error derrumbe toda la aplicación
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState((prevState) => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1,
    }));

    // Loguear el error
    logError(error, {
      accion: 'Error en componente',
      componente: this.props.name || 'Unknown',
      componentStack: errorInfo.componentStack,
    }, ERROR_LEVELS.CRITICAL);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      const { errorCount, error } = this.state;
      const isDev = import.meta.env.MODE === 'development';

      // Si hay muchos errores, mostrar página de error más severa
      if (errorCount > 3) {
        return (
          <div className="error-boundary-container error-boundary-critical">
            <div className="error-content">
              <h1>Error Crítico</h1>
              <p>Hemos detectado múltiples errores. Por favor recarga la página.</p>
              <button
                className="error-button error-button-reload"
                onClick={() => window.location.reload()}
              >
                Recargar Página
              </button>
            </div>
          </div>
        );
      }

      return (
        <div className="error-boundary-container">
          <div className="error-content">
            <h2>Algo salió mal</h2>
            <p>Disculpa, ocurrió un problema. Nuestro equipo ha sido notificado.</p>

            {isDev && error && (
              <details className="error-details">
                <summary>Detalles del error (solo desarrollo)</summary>
                <pre>{error.toString()}</pre>
                {this.state.errorInfo && (
                  <pre>{this.state.errorInfo.componentStack}</pre>
                )}
              </details>
            )}

            <div className="error-actions">
              <button className="error-button" onClick={this.handleReset}>
                Intentar de Nuevo
              </button>
              <button
                className="error-button error-button-secondary"
                onClick={() => {
                  window.location.href = '/';
                }}
              >
                Ir al Inicio
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
