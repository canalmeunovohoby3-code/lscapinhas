import { Navigate, Route, Routes } from 'react-router-dom';
import { ScrollToTop } from '../components/ScrollToTop';
import '../styles/admin.css';
import { AdminAuthProvider } from './AdminAuth';
import { AdminCatalogImagesPage } from './AdminCatalogImagesPage';
import { AdminChargersPage } from './AdminChargersPage';
import { AdminThemeProvider } from './AdminTheme';
import { AdminDashboard } from './AdminDashboard';
import { AdminGuard } from './AdminGuard';
import { AdminLogin } from './AdminLogin';
import { AdminOrderDetailPage } from './AdminOrderDetailPage';
import { AdminOrdersPage } from './AdminOrdersPage';

export function AdminApp() {
  return (
    <AdminThemeProvider>
      <AdminAuthProvider>
        <ScrollToTop />
        <Routes>
          <Route path="login" element={<AdminLogin />} />
          <Route element={<AdminGuard />}>
            <Route index element={<AdminDashboard />} />
            <Route path="pedidos" element={<AdminOrdersPage />} />
            <Route path="pedidos/:orderId" element={<AdminOrderDetailPage />} />
            <Route path="catalogo" element={<AdminCatalogImagesPage />} />
            <Route path="carregadores" element={<AdminChargersPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </AdminAuthProvider>
    </AdminThemeProvider>
  );
}
