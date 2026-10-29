import { useState } from 'react';
import { Link } from 'react-router-dom';
import { OrderForm } from '../components/OrderForm';
import {
  ArrowRightIcon,
  CheckIcon,
  ShieldIcon,
  SmartphoneIcon,
} from '../components/Icons';
import { useStore } from '../context/StoreContext';
import type { OrderSubmissionResult } from '../lib/orderForm';
import { usePageMeta } from '../lib/usePageMeta';

function OrderSuccess({ result }: { result: OrderSubmissionResult }) {
  const uploadedCount = result.uploaded.length;
  const failedCount = result.failedImages.length;

  return (
    <div className="container">
      <nav className="breadcrumb" aria-label="Você está aqui">
        <Link to="/">Início</Link>
        <span>/</span>
        <Link to="/solicitacao">Solicitação</Link>
        <span>/</span>
        <span aria-current="page">Pedido recebido</span>
      </nav>

      <div className="order-success">
        <span className="order-success-icon" aria-hidden="true">
          <CheckIcon width={26} height={26} />
        </span>
        <p className="eyebrow">Pedido recebido</p>
        <h1>Recebemos seu pedido!</h1>
        <p className="order-success-lead">
          Guarde o código abaixo. Ele identifica seu pedido no atendimento.
        </p>

        <div className="order-success-code">
          <span>Código do pedido</span>
          <code>{result.orderId}</code>
        </div>

        <div className="order-success-status">
          <p>
            {uploadedCount} {uploadedCount === 1 ? 'imagem enviada' : 'imagens enviadas'}.
          </p>
          {failedCount > 0 && (
            <p className="order-success-warning">
              {failedCount} {failedCount === 1 ? 'imagem não foi enviada' : 'imagens não foram enviadas'}:
              {' '}
              {result.failedImages.join(', ')}.
            </p>
          )}
          {result.attachError && (
            <p className="order-success-warning">{result.attachError}</p>
          )}
        </div>

        <p className="order-success-contact">
          A LS Case entrará em contato pelo WhatsApp informado para conversar sobre os detalhes
          do pedido.
        </p>

        <div className="order-success-actions">
          <Link to="/capinhas" className="btn btn-primary">
            Ver modelos
            <ArrowRightIcon width={17} height={17} />
          </Link>
        </div>

        <p className="order-success-note">
          <ShieldIcon width={15} height={15} />
          Nenhum pagamento é feito neste site. O valor será combinado no atendimento.
        </p>
      </div>
    </div>
  );
}

export function OrderPage() {
  usePageMeta(
    'Enviar pedido | LS Case by LS Celulares',
    'Envie seu pedido de capinha personalizada com imagens de referência.',
  );
  const { requestCount, clearRequest } = useStore();
  const [completedOrder, setCompletedOrder] = useState<OrderSubmissionResult | null>(null);

  function handleCompleted(result: OrderSubmissionResult) {
    setCompletedOrder(result);
    clearRequest();
  }

  if (completedOrder) {
    return (
      <div className="order-page">
        <OrderSuccess result={completedOrder} />
      </div>
    );
  }

  if (requestCount === 0) {
    return (
      <div className="order-page">
        <div className="container cart-empty">
          <span className="cart-empty-icon" aria-hidden="true">
            <SmartphoneIcon width={30} height={30} />
          </span>
          <h1>Seu pedido está vazio</h1>
          <p>Escolha o modelo do seu celular antes de enviar as imagens.</p>
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
    <div className="order-page">
      <div className="container">
        <nav className="breadcrumb" aria-label="Você está aqui">
          <Link to="/">Início</Link>
          <span>/</span>
          <Link to="/solicitacao">Solicitação</Link>
          <span>/</span>
          <span aria-current="page">Pedido</span>
        </nav>

        <div className="order-head">
          <p className="eyebrow">Pedido personalizado</p>
          <h1>Enviar pedido</h1>
          <p>
            Revise os modelos, informe seus dados e anexe as imagens que deseja usar na
            personalização.
          </p>
        </div>

        <OrderForm onCompleted={handleCompleted} />
      </div>
    </div>
  );
}
