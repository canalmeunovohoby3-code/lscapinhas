import { Navigate, Route, Routes } from 'react-router-dom';
import { ScrollToTop } from '../components/ScrollToTop';
import '../styles/admin.css';
import { AdminAuthProvider } from './AdminAuth';
import { AdminDashboard } from './AdminDashboard';
import { AdminGuard } from './AdminGuard';
import { AdminLogin } from './AdminLogin';
import { AdminOrderDetailPage } from './AdminOrderDetailPage';
import { AdminOrdersPage } from './AdminOrdersPage';

export function AdminApp() {
  return (
    <AdminAuthProvider>
      <ScrollToTop />
      <Routes>
        <Route path="login" element={<AdminLogin />} />
        <Route element={<AdminGuard />}>
          <Route index element={<AdminDashboard />} />
          <Route path="pedidos" element={<AdminOrdersPage />} />
          <Route path="pedidos/:orderId" element={<AdminOrderDetailPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </AdminAuthProvider>
  );
}
