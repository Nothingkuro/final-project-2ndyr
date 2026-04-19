import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './components/layout';
import {
  LoginPage,
  MembersPage,
  MemberProfilePage,
  PaymentsPage,
  EquipmentPage,
  AdminAssetsPage,
  SuppliersPage,
  ReportsPage,
  MembershipPlansPage,
  UserProfilePage,
} from './pages';

/**
 * Props for the route-guard wrapper used in dashboard routes.
 */
interface ProtectedRouteProps {
  /**
   * Protected page content rendered only when the local auth role marker exists.
   */
  children: React.ReactNode;
}

/**
 * Guards dashboard routes using the client-side auth marker in sessionStorage.
 *
 * The login flow writes `authRole` into sessionStorage after successful
 * authentication. ProtectedRoute checks that marker and redirects unauthenticated
 * visitors back to the login route.
 *
 * This guard intentionally performs a lightweight presence check only. It does
 * not verify token freshness, server session validity, or role permissions.
 * Backend middleware remains the source of truth for authorization.
 *
 * @param children Protected route content wrapped by this guard.
 * @returns Wrapped children when `authRole` exists; otherwise a redirect to `/`.
 */
const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const authRole = sessionStorage.getItem('authRole');
  if (!authRole) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

/**
 * Declares application route composition for public and dashboard pages.
 *
 * @returns Router tree containing login, protected dashboard routes, and fallback routing.
 */
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ── Public: Login ── */}
        <Route path="/" element={<LoginPage />} />

        {/* ── Protected: Dashboard shell ── */}
        <Route
          path="/dashboard/members"
          element={
            <ProtectedRoute>
              <MainLayout>
                <MembersPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/members/:memberId"
          element={
            <ProtectedRoute>
              <MainLayout>
                <MemberProfilePage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/payments"
          element={
            <ProtectedRoute>
              <MainLayout>
                <PaymentsPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/inventory"
          element={
            <ProtectedRoute>
              <MainLayout>
                <EquipmentPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/manage-assets"
          element={
            <ProtectedRoute>
              <MainLayout>
                <AdminAssetsPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/suppliers"
          element={
            <MainLayout>
              <SuppliersPage />
            </MainLayout>
          }
        />

        <Route
          path="/dashboard/reports"
          element={
            <ProtectedRoute>
              <MainLayout>
                <ReportsPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/membership-plans"
          element={
            <ProtectedRoute>
              <MainLayout>
                <MembershipPlansPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/profile"
          element={
            <ProtectedRoute>
              <MainLayout>
                <UserProfilePage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Catch-all → redirect to members */}
        <Route path="*" element={<Navigate to="/dashboard/members" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
