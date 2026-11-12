import { createBrowserRouter } from 'react-router-dom';

import { AppShell } from './components/layout/AppShell.jsx';
import { GuestRoute } from './components/layout/GuestRoute.jsx';
import { ProtectedRoute } from './components/layout/ProtectedRoute.jsx';
import { Dashboard } from './pages/Dashboard.jsx';
import { Login } from './pages/Login.jsx';
import { NotFound } from './pages/NotFound.jsx';
import { Register } from './pages/Register.jsx';
import { Reports } from './pages/Reports.jsx';
import { Settings } from './pages/Settings.jsx';
import { SubjectDetail } from './pages/SubjectDetail.jsx';
import { Subjects } from './pages/Subjects.jsx';
import { Timer } from './pages/Timer.jsx';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <GuestRoute>
        <Login />
      </GuestRoute>
    )
  },
  {
    path: '/register',
    element: (
      <GuestRoute>
        <Register />
      </GuestRoute>
    )
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Dashboard />
      },
      {
        path: 'subjects',
        element: <Subjects />
      },
      {
        path: 'subjects/:id',
        element: <SubjectDetail />
      },
      {
        path: 'timer',
        element: <Timer />
      },
      {
        path: 'reports',
        element: <Reports />
      },
      {
        path: 'settings',
        element: <Settings />
      }
    ]
  },
  {
    path: '*',
    element: <NotFound />
  }
]);
