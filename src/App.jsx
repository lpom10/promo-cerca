import { AuthProvider } from './core/auth/AuthContext';
import ErrorBoundary from './shared/ui/ErrorBoundary';
import { Toaster } from 'react-hot-toast';
import AppRoutes from './app/router/AppRoutes';
import './App.css';

function App() {
  return (
    <ErrorBoundary name="App">
      <AuthProvider>
          <AppRoutes />
          <Toaster position="top-right" />
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;