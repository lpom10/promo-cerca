// Simple, reusable loading spinner component
export const LoadingSpinner = ({ message = 'Cargando...' }) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    minHeight: '300px',
    gap: '1rem'
  }}>
    <div style={{
      width: '40px',
      height: '40px',
      border: '4px solid #f0f0f0',
      borderTop: '4px solid #06b6d4',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }}>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
    <p style={{ color: '#64748b', fontSize: '0.9rem' }}>{message}</p>
  </div>
);

export const SkeletonCard = () => (
  <div style={{
    padding: '1rem',
    borderRadius: '8px',
    background: '#f8fafc',
    marginBottom: '1rem'
  }}>
    <div style={{ height: '200px', background: '#e2e8f0', borderRadius: '6px', marginBottom: '0.5rem' }} />
    <div style={{ height: '20px', background: '#e2e8f0', borderRadius: '4px', marginBottom: '0.5rem', width: '80%' }} />
    <div style={{ height: '16px', background: '#e2e8f0', borderRadius: '4px', width: '60%' }} />
  </div>
);

export default LoadingSpinner;
