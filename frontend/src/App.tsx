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
} from './pages';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const authRole = sessionStorage.getItem('authRole');
  if (!authRole) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

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

        {/* Catch-all → redirect to members */}
        <Route path="*" element={<Navigate to="/dashboard/members" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
