import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/useAuth';

/** Route guard: renders child routes when signed in, otherwise redirects to /signin. */
export default function RequireAuth() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return (
      <div className="container" style={{ padding: '96px 0', textAlign: 'center' }}>
        <p>Checking your session...</p>
      </div>
    );
  }

  if (status === 'anonymous') {
    return <Navigate to="/signin" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
