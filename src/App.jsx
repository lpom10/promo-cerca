import { AuthProvider } from './shared/context/AuthContext';
import ErrorBoundary from './shared/ui/ErrorBoundary';
import AppRoutes from './router/AppRoutes';
import './App.css';

function App() {
  return (
    <ErrorBoundary name="App">
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;