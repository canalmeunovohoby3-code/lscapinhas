import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { StoreProvider } from './context/StoreContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { ScrollToTop } from './components/ScrollToTop';
import { Toast } from './components/Toast';
import { HomePage } from './pages/HomePage';
import { ChargersPage } from './pages/ChargersPage';
import { CartPage } from './pages/CartPage';
import { OrderPage } from './pages/OrderPage';
import { ContactPage } from './pages/ContactPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { AdminApp } from './admin/AdminApp';
import { CustomizerPage } from './customizer/CustomizerPage';

function PublicStore() {
  return (
    <StoreProvider>
      <ScrollToTop />
      <a href="#conteudo" className="skip-link">
        Ir para o conteúdo
      </a>
      <Header />
      <main id="conteudo" className="site-main">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/carregadores" element={<ChargersPage />} />
          <Route path="/capinhas" element={<Navigate to="/#escolha-seu-celular" replace />} />
          <Route path="/personalizadas" element={<Navigate to="/#escolha-seu-celular" replace />} />
          <Route path="/produto/:slug" element={<Navigate to="/#escolha-seu-celular" replace />} />
          <Route path="/solicitacao" element={<CartPage />} />
          <Route path="/carrinho" element={<CartPage />} />
          <Route path="/pedido" element={<OrderPage />} />
          <Route path="/contato" element={<ContactPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <Footer />
      <Toast />
    </StoreProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin/*" element={<AdminApp />} />
        <Route path="/personalizador" element={<CustomizerPage />} />
        <Route path="/*" element={<PublicStore />} />
      </Routes>
    </BrowserRouter>
  );
}
