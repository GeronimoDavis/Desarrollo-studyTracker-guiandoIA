import { Navigate } from 'react-router-dom';

import { useAuth } from '../../context/useAuth.js';
import { Spinner } from '../ui/Spinner.jsx';

export function GuestRoute({ children }) {
  const { status } = useAuth();

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Spinner label="Cargando…" />
      </div>
    );
  }

  if (status === 'authenticated') {
    return <Navigate to="/" replace />;
  }

  return children;
}
