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
} from './pages';

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
            <MainLayout>
              <MembersPage />
            </MainLayout>
          }
        />

        <Route
          path="/dashboard/members/:memberId"
          element={
            <MainLayout>
              <MemberProfilePage />
            </MainLayout>
          }
        />

        <Route
          path="/dashboard/payments"
          element={
            <MainLayout>
              <PaymentsPage />
            </MainLayout>
          }
        />

        <Route
          path="/dashboard/inventory"
          element={
            <MainLayout>
              <EquipmentPage />
            </MainLayout>
          }
        />

        <Route
          path="/dashboard/manage-assets"
          element={
            <MainLayout>
              <AdminAssetsPage />
            </MainLayout>
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

        {/* Catch-all → redirect to members */}
        <Route path="*" element={<Navigate to="/dashboard/members" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
