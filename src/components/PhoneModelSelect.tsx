import { useEffect, useState } from 'react';
import type { PhoneModel } from '../types/catalog';
import { catalog, getModelById } from '../data/catalog';
import { ChevronDownIcon } from './Icons';

interface PhoneModelSelectProps {
  selectedModelId: string | null;
  onSelect: (model: PhoneModel | null) => void;
  showClear?: boolean;
  idPrefix?: string;
}

export function PhoneModelSelect({
  selectedModelId,
  onSelect,
  showClear = true,
  idPrefix = 'phone-model',
}: PhoneModelSelectProps) {
  const selectedModel = getModelById(selectedModelId);
  const [brandId, setBrandId] = useState(selectedModel?.brandId ?? '');

  useEffect(() => {
    if (selectedModel) setBrandId(selectedModel.brandId);
  }, [selectedModel]);

  const brand = catalog.brands.find((entry) => entry.id === brandId);
  const models = brand?.models ?? [];

  function handleBrandChange(value: string) {
    setBrandId(value);
    if (selectedModel && selectedModel.brandId !== value) {
      onSelect(null);
    }
  }

  function handleModelChange(value: string) {
    const model = models.find((entry) => entry.id === value) ?? null;
    onSelect(model);
  }

  function clear() {
    setBrandId('');
    onSelect(null);
  }

  const hasSelection = Boolean(brandId || selectedModel);

  return (
    <div className="phone-model-select">
      <label className="model-select-field" htmlFor={`${idPrefix}-brand`}>
        <span className="model-select-label">Marca</span>
        <span className="model-select-control">
          <select
            id={`${idPrefix}-brand`}
            value={brandId}
            onChange={(event) => handleBrandChange(event.target.value)}
          >
            <option value="">Selecione a marca</option>
            {catalog.brands.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.name}
              </option>
            ))}
          </select>
          <ChevronDownIcon width={15} height={15} aria-hidden="true" />
        </span>
      </label>

      <label className="model-select-field" htmlFor={`${idPrefix}-model`}>
        <span className="model-select-label">Modelo</span>
        <span className="model-select-control">
          <select
            id={`${idPrefix}-model`}
            value={selectedModel?.id ?? ''}
            onChange={(event) => handleModelChange(event.target.value)}
            disabled={!brand}
          >
            <option value="">{brand ? 'Selecione o modelo' : 'Escolha a marca'}</option>
            {models.map((model) => (
              <option key={model.id} value={model.id}>
                {model.name}
              </option>
            ))}
          </select>
          <ChevronDownIcon width={15} height={15} aria-hidden="true" />
        </span>
      </label>

      {showClear && hasSelection && (
        <button type="button" className="model-select-clear" onClick={clear}>
          Limpar
        </button>
      )}
    </div>
  );
}
