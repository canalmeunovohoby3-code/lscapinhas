import { useRef, useState, type MouseEvent } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import {
  checkoutIssues,
  createOrderId,
  loadBuyerName,
  saveBuyerName,
} from '../lib/cart';
import { formatBRL, pluralize } from '../lib/format';
import { buildOrderWhatsAppUrl } from '../lib/whatsapp';
import { usePageMeta } from '../lib/usePageMeta';
import { QuantityStepper } from '../components/QuantityStepper';
import {
  ArrowRightIcon,
  CheckIcon,
  ShieldIcon,
  SmartphoneIcon,
  TrashIcon,
  WhatsAppIcon,
} from '../components/Icons';

export function CartPage() {
  usePageMeta('Seu carrinho | LS Case by LS Celulares');
  const {
    cart,
    resolvedCart,
    totals,
    updateQuantity,
    removeFromCart,
    clearCart,
  } = useStore();

  const [customerName, setCustomerName] = useState(() => loadBuyerName());
  const [notes, setNotes] = useState('');
  const [touched, setTouched] = useState(false);
  const [sent, setSent] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [orderId] = useState(() => createOrderId());
  const nameRef = useRef<HTMLInputElement>(null);

  const issues = checkoutIssues(resolvedCart, customerName);
  const uniqueIssues = Array.from(new Set(issues));
  const canCheckout = issues.length === 0;

  const orderItems = resolvedCart
    .filter((entry) => entry.product)
    .map((entry) => ({
      name: entry.product!.name,
      modelName: entry.model?.name ?? null,
      variantName: null,
      quantity: entry.item.quantity,
      unitPrice: entry.unitPrice,
      subtotal: entry.subtotal,
    }));

  const whatsappUrl = buildOrderWhatsAppUrl({
    orderId,
    customerName: customerName.trim(),
    notes,
    items: orderItems,
    total: totals.total,
  });

  function handleNameChange(value: string) {
    setCustomerName(value);
    saveBuyerName(value);
    setSent(false);
  }

  function handleCheckoutClick(event: MouseEvent<HTMLAnchorElement>) {
    if (!canCheckout) {
      event.preventDefault();
      setTouched(true);
      if (customerName.trim().length < 2) {
        nameRef.current?.focus();
      }
      return;
    }
    setSent(true);
  }

  if (cart.length === 0) {
    return (
      <div className="cart-page">
        <div className="container cart-empty">
          <span className="cart-empty-icon" aria-hidden="true">
            <ShieldIcon width={30} height={30} />
          </span>
          <h1>Seu carrinho está vazio</h1>
          <p>Escolha seu modelo e encontre uma capinha que combine com você.</p>
          <div className="cart-empty-actions">
            <Link to="/capinhas" className="btn btn-primary">
              Ver capinhas
              <ArrowRightIcon width={17} height={17} />
            </Link>
            <Link to="/#escolha-seu-celular" className="btn btn-outline">
              Escolher meu celular
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
          <span aria-current="page">Carrinho</span>
        </nav>

        <div className="cart-head">
          <div>
            <p className="eyebrow">Seu pedido</p>
            <h1>Carrinho</h1>
          </div>
          <p className="cart-head-count">
            {totals.unitCount} {pluralize(totals.unitCount, 'item', 'itens')} ·{' '}
            {totals.itemCount} {pluralize(totals.itemCount, 'capinha', 'capinhas')}
          </p>
        </div>

        <div className="cart-layout">
          <div className="cart-items">
            {resolvedCart.map((entry) => {
              if (!entry.product) return null;
              return (
                <article key={entry.key} className="cart-item">
                  <div className="cart-item-media">
                    <img
                      src={entry.product.images[0]}
                      alt={entry.product.name}
                      width={900}
                      height={1100}
                      loading="lazy"
                    />
                  </div>

                  <div className="cart-item-info">
                    <h2>
                      <Link to={`/produto/${entry.product.slug}`}>{entry.product.name}</Link>
                    </h2>
                    {entry.model && (
                      <p className="cart-item-model">
                        <SmartphoneIcon width={15} height={15} />
                        <span>{entry.model.name}</span>
                      </p>
                    )}
                    <p className="cart-item-unit">
                      {formatBRL(entry.unitPrice)} por unidade
                    </p>

                    {entry.issues.length > 0 && (
                      <ul className="cart-item-errors">
                        {entry.issues.map((issue) => (
                          <li key={issue}>{issue}</li>
                        ))}
                      </ul>
                    )}

                    <div className="cart-item-controls">
                      <QuantityStepper
                        value={entry.item.quantity}
                        onChange={(quantity) => updateQuantity(entry.key, quantity)}
                        label={`Quantidade de ${entry.product.name}`}
                      />
                      <button
                        type="button"
                        className="cart-remove"
                        onClick={() => removeFromCart(entry.key)}
                      >
                        <TrashIcon width={16} height={16} />
                        Remover
                      </button>
                    </div>
                  </div>

                  <div className="cart-item-price">
                    <span>{formatBRL(entry.subtotal)}</span>
                    {entry.item.quantity > 1 && (
                      <small>
                        {entry.item.quantity} × {formatBRL(entry.unitPrice)}
                      </small>
                    )}
                  </div>
                </article>
              );
            })}

            <div className="cart-items-footer">
              <Link to="/capinhas" className="inline-link">
                <ArrowRightIcon width={15} height={15} className="icon-flip" />
                Continuar comprando
              </Link>

              {confirmClear ? (
                <div className="clear-confirm">
                  <span>Remover todos os itens?</span>
                  <button
                    type="button"
                    className="text-button text-button--danger"
                    onClick={() => {
                      clearCart();
                      setConfirmClear(false);
                      setSent(false);
                      setTouched(false);
                    }}
                  >
                    Sim, limpar
                  </button>
                  <button
                    type="button"
                    className="text-button"
                    onClick={() => setConfirmClear(false)}
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <button type="button" className="text-button" onClick={() => setConfirmClear(true)}>
                  Limpar carrinho
                </button>
              )}
            </div>
          </div>

          <aside className="cart-summary" aria-label="Resumo do pedido">
            <div className="cart-summary-head">
              <h2>Resumo do pedido</h2>
              <p className="cart-order-id">Pedido # {orderId}</p>
            </div>

            <div className="summary-rows">
              <div>
                <span>Subtotal</span>
                <span>{formatBRL(totals.total)}</span>
              </div>
              <div>
                <span>Entrega</span>
                <span className="summary-muted">Combinada no atendimento</span>
              </div>
              <div className="summary-total">
                <span>Total</span>
                <span>{formatBRL(totals.total)}</span>
              </div>
            </div>

            <div className="buyer-fields">
              <label className="field">
                <span className="field-label">Seu nome *</span>
                <input
                  ref={nameRef}
                  type="text"
                  value={customerName}
                  onChange={(event) => handleNameChange(event.target.value)}
                  placeholder="Como podemos chamar você?"
                  autoComplete="name"
                  aria-invalid={touched && customerName.trim().length < 2}
                />
              </label>

              <label className="field">
                <span className="field-label">Observações (opcional)</span>
                <textarea
                  value={notes}
                  onChange={(event) => {
                    setNotes(event.target.value);
                    setSent(false);
                  }}
                  placeholder="Alguma observação sobre o pedido?"
                  rows={3}
                />
              </label>
            </div>

            {touched && uniqueIssues.length > 0 && (
              <div className="form-error form-error--block" role="alert">
                <ul>
                  {uniqueIssues.map((issue) => (
                    <li key={issue}>{issue}</li>
                  ))}
                </ul>
              </div>
            )}

            <a
              href={canCheckout ? whatsappUrl : '#'}
              className={`btn btn-primary btn-block checkout-button${canCheckout ? '' : ' is-disabled'}`}
              onClick={handleCheckoutClick}
              target={canCheckout ? '_blank' : undefined}
              rel="noopener noreferrer"
              aria-disabled={!canCheckout}
            >
              <WhatsAppIcon width={19} height={19} />
              Finalizar pedido pelo WhatsApp
            </a>

            <p className="summary-note">
              O pedido será aberto no WhatsApp com o resumo preenchido. A confirmação acontece no
              atendimento da loja.
            </p>

            {sent && (
              <div className="checkout-feedback" role="status">
                <span className="checkout-feedback-icon" aria-hidden="true">
                  <CheckIcon width={17} height={17} />
                </span>
                <div>
                  <strong>Pedido preparado no WhatsApp</strong>
                  <p>
                    Revise o resumo e envie a mensagem. Se a janela não abriu,{' '}
                    <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                      abra o WhatsApp novamente
                    </a>
                    . O carrinho continua salvo até você limpá-lo.
                  </p>
                </div>
              </div>
            )}

            <div className="summary-security">
              <ShieldIcon width={16} height={16} />
              <span>Nenhum pagamento é feito neste site.</span>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
