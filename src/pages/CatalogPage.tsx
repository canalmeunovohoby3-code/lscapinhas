import { useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import type { PhoneModel } from '../types/catalog';
import { ProductCard } from '../components/ProductCard';
import { PhoneModelSelect } from '../components/PhoneModelSelect';
import { CloseIcon, SearchIcon, WhatsAppIcon } from '../components/Icons';
import { useStore } from '../context/StoreContext';
import { getModelById } from '../data/catalog';
import {
  PRICE_BUCKETS,
  SORT_OPTIONS,
  defaultFilters,
  filterProducts,
  type PriceBucketId,
  type ProductFilters,
  type SortKey,
} from '../lib/filters';
import { pluralize } from '../lib/format';
import { buildWhatsAppUrl } from '../lib/whatsapp';
import { usePageMeta } from '../lib/usePageMeta';

export function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { selectedModelId, selectedModel, setSelectedModel } = useStore();

  const urlModelId = searchParams.get('modelo');
  const validUrlModelId = getModelById(urlModelId)?.id ?? null;
  const modelId = validUrlModelId ?? selectedModelId;
  const activeModel = getModelById(modelId);

  const rawPrice = searchParams.get('preco') ?? 'todos';
  const price = PRICE_BUCKETS.some((bucket) => bucket.id === rawPrice)
    ? (rawPrice as PriceBucketId)
    : 'todos';

  const rawSort = searchParams.get('ordenar') ?? 'relevancia';
  const sort = SORT_OPTIONS.some((option) => option.id === rawSort)
    ? (rawSort as SortKey)
    : 'relevancia';

  const filters: ProductFilters = {
    ...defaultFilters,
    query: searchParams.get('q') ?? '',
    modelId,
    price,
    sort,
  };

  useEffect(() => {
    if (validUrlModelId && validUrlModelId !== selectedModelId) {
      setSelectedModel(validUrlModelId);
    }
  }, [validUrlModelId, selectedModelId, setSelectedModel]);

  usePageMeta(
    'Capinhas | LS Case by LS Celulares',
    'Escolha o modelo do seu celular e encontre capinhas compatíveis. Compre pelo carrinho e finalize o pedido pelo WhatsApp.',
  );

  const results = useMemo(
    () => filterProducts(filters),
    [filters.query, modelId, price, sort],
  );
  const resultLabel = `${results.length} ${pluralize(results.length, 'capinha', 'capinhas')}`;
  const hasFilters = Boolean(filters.query.trim() || modelId || price !== 'todos');

  function updateParams(patch: Record<string, string | null>, replace = false) {
    const next = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(patch)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    setSearchParams(next, { replace });
  }

  function handleModelSelect(model: PhoneModel | null) {
    setSelectedModel(model?.id ?? null);
    updateParams({ modelo: model?.id ?? null });
  }

  function handleClear() {
    setSelectedModel(null);
    setSearchParams(new URLSearchParams(), { replace: true });
  }

  return (
    <div className="catalog-page">
      <section className="shop-page-head">
        <div className="container">
          <nav className="breadcrumb" aria-label="Você está aqui">
            <Link to="/">Início</Link>
            <span>/</span>
            <span aria-current="page">Capinhas</span>
          </nav>

          <div className="shop-page-head-row">
            <div>
              <h1>Capinhas</h1>
              <p>Escolha o modelo do seu celular e veja apenas as capinhas compatíveis.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="shop-catalog catalog-content">
        <div className="container">
          <div className="catalog-controls">
            <div className="catalog-search">
              <SearchIcon width={18} height={18} />
              <input
                type="search"
                value={filters.query}
                onChange={(event) =>
                  updateParams({ q: event.target.value || null }, true)
                }
                placeholder="Buscar capinha ou modelo"
                aria-label="Buscar capinha ou modelo"
              />
              {filters.query && (
                <button
                  type="button"
                  className="catalog-search-clear"
                  onClick={() => updateParams({ q: null }, true)}
                  aria-label="Limpar busca"
                >
                  <CloseIcon width={14} height={14} />
                </button>
              )}
            </div>

            <div className="catalog-model-filter">
              <div className="catalog-model-filter-row">
                <PhoneModelSelect
                  selectedModelId={modelId}
                  onSelect={handleModelSelect}
                  showClear={false}
                  idPrefix="catalog-model"
                />
                {hasFilters && (
                  <button type="button" className="catalog-clear" onClick={handleClear}>
                    Limpar filtros
                  </button>
                )}
              </div>
            </div>

            <label className="catalog-select-field">
              <span>Preço</span>
              <select
                value={price}
                onChange={(event) =>
                  updateParams({
                    preco: event.target.value === 'todos' ? null : event.target.value,
                  })
                }
              >
                {PRICE_BUCKETS.map((bucket) => (
                  <option key={bucket.id} value={bucket.id}>
                    {bucket.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="catalog-select-field">
              <span>Ordenar</span>
              <select
                value={sort}
                onChange={(event) =>
                  updateParams({
                    ordenar: event.target.value === 'relevancia' ? null : event.target.value,
                  })
                }
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

          </div>

          <div className="catalog-results-head">
            <p>
              <strong>{resultLabel}</strong>
              {filters.query.trim() ? ` para “${filters.query.trim()}”` : ''}
            </p>
            {activeModel && (
              <span className="catalog-selected-model">
                Compatível com <strong>{activeModel.name}</strong>
              </span>
            )}
          </div>

          {results.length > 0 ? (
            <div className="product-grid product-grid--shop">
              {results.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  eager={index < 4}
                  selectedModel={activeModel ?? null}
                  showFallbackModel={!modelId}
                />
              ))}
            </div>
          ) : (
            <div className="catalog-empty">
              <span className="catalog-empty-icon" aria-hidden="true">
                <SearchIcon width={24} height={24} />
              </span>
              <h2>Nenhuma capinha encontrada</h2>
              <p>
                Tente outro termo de busca ou remova o filtro de modelo. Você também pode
                consultar a loja pelo WhatsApp.
              </p>
              <div className="catalog-empty-actions">
                <button type="button" className="btn btn-outline" onClick={handleClear}>
                  Limpar filtros
                </button>
                <a
                  className="btn btn-primary"
                  href={buildWhatsAppUrl(
                    `Olá! Procuro uma capinha${selectedModel ? ` para o ${selectedModel.name}` : ''}. Poderia me ajudar?`,
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <WhatsAppIcon width={17} height={17} />
                  Falar com a loja
                </a>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
