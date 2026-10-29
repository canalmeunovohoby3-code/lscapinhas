import { Link } from 'react-router-dom';
import { RequestSummary } from '../components/RequestSummary';
import { ArrowRightIcon, SmartphoneIcon } from '../components/Icons';
import { useStore } from '../context/StoreContext';
import { usePageMeta } from '../lib/usePageMeta';

export function CartPage() {
  usePageMeta('Sua solicitação | LS Case by LS Celulares');
  const { requestCount } = useStore();

  if (requestCount === 0) {
    return (
      <div className="cart-page">
        <div className="container cart-empty">
          <span className="cart-empty-icon" aria-hidden="true">
            <SmartphoneIcon width={30} height={30} />
          </span>
          <h1>Sua solicitação está vazia</h1>
          <p>
            Escolha o modelo do seu celular e adicione as capinhas que deseja personalizar.
          </p>
          <div className="cart-empty-actions">
            <Link to="/capinhas" className="btn btn-primary">
              Escolher modelo
              <ArrowRightIcon width={17} height={17} />
            </Link>
            <Link to="/" className="btn btn-outline">
              Voltar ao início
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="container">
        <nav className="breadcrumb" aria-label="Você está aqui">
          <Link to="/">Início</Link>
          <span>/</span>
          <span aria-current="page">Solicitação</span>
        </nav>

        <div className="cart-head">
          <div>
            <p className="eyebrow">Seu pedido</p>
            <h1>Sua solicitação</h1>
          </div>
        </div>

        <RequestSummary />
      </div>
    </div>
  );
}
