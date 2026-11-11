import { Navigate, useLocation } from 'react-router-dom';

import { useAuth } from '../../context/useAuth.js';
import { Spinner } from '../ui/Spinner.jsx';

export function ProtectedRoute({ children }) {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Spinner label="Cargando tu sesión…" />
      </div>
    );
  }

  if (status !== 'authenticated') {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}
