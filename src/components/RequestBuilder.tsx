import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { PhoneModel } from '../types/catalog';
import { useStore } from '../context/StoreContext';
import { ArrowRightIcon, PlusIcon, SmartphoneIcon } from './Icons';
import { PhoneModelSelect } from './PhoneModelSelect';
import { QuantityStepper } from './QuantityStepper';

export function RequestBuilder({
  idPrefix = 'request',
  onModelChange,
  onClearSelection,
}: {
  idPrefix?: string;
  onModelChange?: (model: PhoneModel | null) => void;
  onClearSelection?: () => void;
}) {
  const {
    selectedModelId,
    selectedModel,
    setSelectedModel,
    addRequestItem,
    requestCount,
  } = useStore();
  const [quantity, setQuantity] = useState(1);

  function handleModelChange(model: PhoneModel | null) {
    if (onModelChange) onModelChange(model);
    else setSelectedModel(model?.id ?? null);
  }

  function handleClearSelection() {
    setQuantity(1);
    if (onClearSelection) onClearSelection();
    else setSelectedModel(null);
  }

  function handleAdd() {
    if (!selectedModel) return;
    const added = addRequestItem(selectedModel.id, quantity);
    if (added) setQuantity(1);
  }

  return (
    <div className="phone-selector-panel request-builder">
      <div className="phone-selector-heading request-builder-heading">
        <span className="phone-selector-icon" aria-hidden="true">
          <SmartphoneIcon width={20} height={20} />
        </span>
        <div>
          <h2>Personalize sua capinha</h2>
          <p>
            Escolha o modelo do celular, informe a quantidade e envie sua foto ou arte pelo
            WhatsApp.
          </p>
        </div>
        {selectedModel && <span className="selected-model-badge">{selectedModel.name}</span>}
      </div>

      <div className="request-builder-controls">
        <div className="request-model-row">
          <PhoneModelSelect
            selectedModelId={selectedModelId}
            onSelect={handleModelChange}
            showClear={false}
            idPrefix={idPrefix}
          />
          {selectedModel && (
            <button
              type="button"
              className="model-select-clear request-clear"
              onClick={handleClearSelection}
            >
              Limpar seleção
            </button>
          )}
        </div>

        <div className="request-action-row">
          <div className="request-qty">
            <span className="field-label">Quantidade</span>
            <QuantityStepper
              value={quantity}
              onChange={setQuantity}
              label="Quantidade de capinhas"
            />
          </div>
          <button
            type="button"
            className={`btn btn-primary request-add${selectedModel ? '' : ' is-disabled'}`}
            onClick={handleAdd}
            disabled={!selectedModel}
          >
            <PlusIcon width={17} height={17} />
            Adicionar à solicitação
          </button>
        </div>

        <div className="request-builder-helper">
          <span>Você pode adicionar mais de um modelo à mesma solicitação.</span>
          {requestCount > 0 && (
            <Link to="/solicitacao" className="inline-link">
              Ver solicitação ({requestCount})
              <ArrowRightIcon width={15} height={15} />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
