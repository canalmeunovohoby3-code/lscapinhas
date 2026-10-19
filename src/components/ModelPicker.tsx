import { useEffect, useMemo, useState } from 'react';
import type { PhoneModel } from '../types/catalog';
import { catalog, getBrandById, getModelById } from '../data/catalog';
import { normalizeText } from '../lib/format';
import { buildWhatsAppUrl } from '../lib/whatsapp';
import { CheckIcon, ChevronDownIcon, SearchIcon, SmartphoneIcon, WhatsAppIcon } from './Icons';
import { Modal } from './Modal';

interface ModelPickerProps {
  selectedModelId: string | null;
  onSelect: (model: PhoneModel) => void;
  onClear?: () => void;
  allowedModelIds?: string[];
  label?: string;
  compact?: boolean;
}

export function ModelPicker({
  selectedModelId,
  onSelect,
  onClear,
  allowedModelIds,
  label = 'Modelo do celular',
  compact = false,
}: ModelPickerProps) {
  const [open, setOpen] = useState(false);
  const [brandId, setBrandId] = useState('apple');
  const [query, setQuery] = useState('');

  const selectedModel = getModelById(selectedModelId);

  const groups = useMemo(() => {
    const allowed = allowedModelIds ? new Set(allowedModelIds) : null;
    return catalog.brands
      .map((brand) => ({
        brand,
        models: brand.models.filter((model) => !allowed || allowed.has(model.id)),
      }))
      .filter((group) => group.models.length > 0);
  }, [allowedModelIds]);

  useEffect(() => {
    if (!open) return;
    const selectedBrand = selectedModel ? getBrandById(selectedModel.brandId) : undefined;
    const brandHasModels = groups.some((group) => group.brand.id === selectedBrand?.id);
    setBrandId(brandHasModels ? (selectedBrand?.id ?? groups[0]?.brand.id ?? '') : (groups[0]?.brand.id ?? ''));
    setQuery('');
  }, [open, selectedModel, groups]);

  const normalizedQuery = normalizeText(query);
  const searchResults = normalizedQuery
    ? groups.flatMap((group) =>
        group.models
          .filter((model) =>
            normalizeText(`${model.name} ${group.brand.name}`).includes(normalizedQuery),
          )
          .map((model) => ({ brand: group.brand, model })),
      )
    : [];
  const activeGroup = groups.find((group) => group.brand.id === brandId) ?? groups[0];
  const brandsToShow = normalizedQuery
    ? groups.filter((group) => searchResults.some((entry) => entry.brand.id === group.brand.id))
    : activeGroup
      ? [activeGroup]
      : [];

  function handleSelect(model: PhoneModel) {
    onSelect(model);
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        className={`model-field${compact ? ' model-field--compact' : ''}${selectedModel ? ' has-value' : ''}`}
        onClick={() => setOpen(true)}
      >
        <SmartphoneIcon width={18} height={18} />
        <span className="model-field-copy">
          {!compact && <span className="model-field-label">{label}</span>}
          <strong>{selectedModel?.name ?? (compact ? label : 'Escolher modelo')}</strong>
        </span>
        <ChevronDownIcon width={16} height={16} />
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Escolher modelo" size="md">
        <div className="model-picker">
          <div className="model-picker-search">
            <SearchIcon width={18} height={18} />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Busque o modelo (ex.: iPhone 15)"
              aria-label="Buscar modelo de celular"
              autoFocus
            />
          </div>

          {!normalizedQuery && (
            <div className="brand-tabs" role="tablist" aria-label="Marcas de celular">
              {groups.map((group) => (
                <button
                  key={group.brand.id}
                  type="button"
                  role="tab"
                  aria-selected={group.brand.id === activeGroup?.brand.id}
                  className={`brand-tab${group.brand.id === activeGroup?.brand.id ? ' is-active' : ''}`}
                  onClick={() => setBrandId(group.brand.id)}
                >
                  <span className="brand-monogram" aria-hidden="true">
                    {group.brand.monogram}
                  </span>
                  {group.brand.shortName}
                </button>
              ))}
            </div>
          )}

          <div className="model-picker-results">
            {brandsToShow.length === 0 && (
              <p className="model-picker-empty">
                Nenhum modelo encontrado para “{query.trim()}”.
              </p>
            )}
            {brandsToShow.map((group) => {
              const models = normalizedQuery
                ? searchResults
                    .filter((entry) => entry.brand.id === group.brand.id)
                    .map((entry) => entry.model)
                : group.models;
              return (
                <div key={group.brand.id} className="model-group">
                  <p className="model-group-title">{group.brand.name}</p>
                  <div className="model-grid">
                    {models.map((model) => {
                      const isSelected = model.id === selectedModelId;
                      return (
                        <button
                          key={model.id}
                          type="button"
                          className={`model-chip${isSelected ? ' is-selected' : ''}`}
                          onClick={() => handleSelect(model)}
                          aria-pressed={isSelected}
                        >
                          {model.name}
                          {isSelected && <CheckIcon width={14} height={14} />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="model-picker-footer">
            {selectedModel && onClear ? (
              <button
                type="button"
                className="text-button"
                onClick={() => {
                  onClear();
                  setOpen(false);
                }}
              >
                Limpar seleção
              </button>
            ) : (
              <span />
            )}
            <a
              className="model-picker-help"
              href={buildWhatsAppUrl(
                `Olá! Procuro capinha para ${query.trim() || 'meu modelo de celular'}. Poderia verificar a disponibilidade?`,
              )}
              target="_blank"
              rel="noopener noreferrer"
            >
              <WhatsAppIcon width={16} height={16} />
              Não encontrou seu modelo?
            </a>
          </div>
        </div>
      </Modal>
    </>
  );
}
