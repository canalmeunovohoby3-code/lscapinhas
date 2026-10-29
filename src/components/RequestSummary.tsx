import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getBrandById, getModelById } from '../data/catalog';
import { useStore } from '../context/StoreContext';
import { pluralize } from '../lib/format';
import {
  ArrowRightIcon,
  ShieldIcon,
  SmartphoneIcon,
  TrashIcon,
} from './Icons';
import { QuantityStepper } from './QuantityStepper';

export function RequestSummary() {
  const {
    requestItems,
    requestNotes,
    setRequestNotes,
    updateRequestQuantity,
    removeRequestItem,
    clearRequest,
  } = useStore();
  const [confirmClear, setConfirmClear] = useState(false);

  const resolved = requestItems.flatMap((item) => {
    const model = getModelById(item.modelId);
    const brand = model ? getBrandById(model.brandId) : undefined;
    return model && brand ? [{ item, model, brand }] : [];
  });

  if (resolved.length === 0) return null;

  const modelCount = resolved.length;
  const unitCount = resolved.reduce((sum, entry) => sum + entry.item.quantity, 0);

  function handleClear() {
    clearRequest();
    setConfirmClear(false);
  }

  return (
    <div className="cart-layout request-layout">
      <div className="cart-items">
        {resolved.map(({ item, model, brand }) => (
          <article key={model.id} className="cart-item request-item">
            <div className="request-item-media" aria-hidden="true">
              <SmartphoneIcon width={30} height={30} />
            </div>

            <div className="cart-item-info">
              <p className="request-item-brand">{brand.shortName}</p>
              <h2>{model.name}</h2>
              <p className="cart-item-unit">Capinha personalizada com a sua arte</p>

              <div className="cart-item-controls">
                <QuantityStepper
                  value={item.quantity}
                  onChange={(quantity) => updateRequestQuantity(model.id, quantity)}
                  label={`Quantidade de capinhas para ${model.name}`}
                />
                <button
                  type="button"
                  className="cart-remove"
                  onClick={() => removeRequestItem(model.id)}
                >
                  <TrashIcon width={16} height={16} />
                  Remover
                </button>
              </div>
            </div>
          </article>
        ))}

        <div className="cart-items-footer">
          <Link to="/capinhas" className="inline-link">
            <ArrowRightIcon width={15} height={15} className="icon-flip" />
            Adicionar outro modelo
          </Link>

          {confirmClear ? (
            <div className="clear-confirm">
              <span>Limpar a solicitação?</span>
              <button type="button" className="text-button text-button--danger" onClick={handleClear}>
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
            <button
              type="button"
              className="text-button"
              onClick={() => setConfirmClear(true)}
            >
              Limpar solicitação
            </button>
          )}
        </div>
      </div>

      <aside className="cart-summary request-summary" aria-label="Resumo da solicitação">
        <div className="cart-summary-head">
          <h2>Resumo da solicitação</h2>
          <p className="cart-order-id">
            {modelCount} {pluralize(modelCount, 'modelo', 'modelos')} · {unitCount}{' '}
            {pluralize(unitCount, 'capinha', 'capinhas')}
          </p>
        </div>

        <div className="request-summary-note">
          <p>As imagens de referência serão anexadas no formulário do site.</p>
          <p>O valor e as condições de pagamento serão combinados no atendimento.</p>
        </div>

        <div className="buyer-fields">
          <label className="field">
            <span className="field-label">Observações (opcional)</span>
            <textarea
              value={requestNotes}
              onChange={(event) => setRequestNotes(event.target.value)}
              placeholder="Ex.: quero a foto inteira, sem cortes."
              rows={4}
            />
          </label>
        </div>

        <Link to="/pedido" className="btn btn-primary btn-block checkout-button">
          <ArrowRightIcon width={18} height={18} />
          Continuar para o pedido
        </Link>

        <p className="summary-note">
          Informe seus dados e envie as imagens no próximo passo. A LS Case entrará em contato
          pelo WhatsApp informado.
        </p>

        <div className="summary-security">
          <ShieldIcon width={16} height={16} />
          <span>Nenhum pagamento é feito neste site.</span>
        </div>
      </aside>
    </div>
  );
}
