import { AuthProvider } from './shared/context/AuthContext';
import ErrorBoundary from './shared/ui/ErrorBoundary';
import { Toaster } from 'react-hot-toast';
import AppRoutes from './router/AppRoutes';
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