import { useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CloseIcon, SearchIcon } from '../components/Icons';
import { ModelCardGrid } from '../components/ModelCardGrid';
import { useStore } from '../context/StoreContext';
import { catalog, getModelById } from '../data/catalog';
import { pluralize } from '../lib/format';
import { usePageMeta } from '../lib/usePageMeta';

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { selectedModelId, setSelectedModel } = useStore();

  const modelParam = searchParams.get('modelo');
  const urlModel = getModelById(modelParam);
  const brandParam = searchParams.get('marca');
  const validBrand = catalog.brands.find((brand) => brand.id === brandParam);
  const brandFilterId = validBrand?.id ?? urlModel?.brandId ?? null;
  const query = searchParams.get('q') ?? '';

  useEffect(() => {
    if (urlModel && urlModel.id !== selectedModelId) {
      setSelectedModel(urlModel.id);
    }
  }, [urlModel?.id, selectedModelId, setSelectedModel]);

  useEffect(() => {
    const activeTab = document.querySelector<HTMLElement>(
      '.brand-filter-tab.is-active',
    );
    activeTab?.scrollIntoView({ inline: 'center', block: 'nearest' });
  }, [brandFilterId]);

  usePageMeta(
    'Catálogo de aparelhos | LS Case by LS Celulares',
    'Escolha a marca e o modelo do seu celular para solicitar uma capinha personalizada pelo site.',
  );

  const models = useMemo(() => {
    const normalizedQuery = normalize(query);
    return catalog.brands
      .filter((brand) => !brandFilterId || brand.id === brandFilterId)
      .flatMap((brand) => brand.models.map((model) => ({ brand, model })))
      .filter(({ brand, model }) => {
        if (!normalizedQuery) return true;
        return normalize(`${brand.name} ${brand.shortName} ${model.name}`).includes(
          normalizedQuery,
        );
      });
  }, [brandFilterId, query]);

  function handleBrandChange(brandId: string | null) {
    const next = new URLSearchParams(searchParams);
    if (brandId) next.set('marca', brandId);
    else next.delete('marca');
    next.delete('modelo');
    setSearchParams(next, { replace: true });
  }

  function handleSearch(value: string) {
    const next = new URLSearchParams(searchParams);
    if (value.trim()) next.set('q', value);
    else next.delete('q');
    setSearchParams(next, { replace: true });
  }

  function clearAll() {
    setSearchParams(new URLSearchParams(), { replace: true });
  }

  return (
    <div className="catalog-page">
      <section className="shop-page-head">
        <div className="container">
          <nav className="breadcrumb" aria-label="Você está aqui">
            <Link to="/">Início</Link>
            <span>/</span>
            <span aria-current="page">Catálogo de aparelhos</span>
          </nav>

          <div className="shop-page-head-row">
            <div>
              <span className="eyebrow">Capinhas personalizadas</span>
              <h1>Catálogo de aparelhos</h1>
              <p>
                Escolha a marca e o modelo do seu celular para solicitar sua capinha
                personalizada.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="model-catalog-section" id="modelos">
        <div className="container">
          <div className="model-catalog-toolbar">
            <div className="brand-filter" role="tablist" aria-label="Filtrar por marca">
              <button
                type="button"
                role="tab"
                aria-selected={!brandFilterId}
                className={`brand-tab brand-filter-tab${!brandFilterId ? ' is-active' : ''}`}
                onClick={() => handleBrandChange(null)}
              >
                Todas
              </button>
              {catalog.brands.map((brand) => (
                <button
                  key={brand.id}
                  type="button"
                  role="tab"
                  aria-selected={brandFilterId === brand.id}
                  className={`brand-tab brand-filter-tab${
                    brandFilterId === brand.id ? ' is-active' : ''
                  }`}
                  onClick={() => handleBrandChange(brand.id)}
                >
                  <span className="brand-monogram">{brand.monogram}</span>
                  {brand.shortName}
                </button>
              ))}
            </div>

            <div className="model-catalog-tools">
              <div className="catalog-search model-search">
                <SearchIcon width={18} height={18} />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => handleSearch(event.target.value)}
                  placeholder="Buscar modelo ou marca"
                  aria-label="Buscar modelo ou marca"
                />
                {query && (
                  <button
                    type="button"
                    className="catalog-search-clear"
                    onClick={() => handleSearch('')}
                    aria-label="Limpar busca"
                  >
                    <CloseIcon width={14} height={14} />
                  </button>
                )}
              </div>
              <p className="model-catalog-count">
                {models.length} {pluralize(models.length, 'modelo', 'modelos')}
              </p>
            </div>
          </div>

          {models.length > 0 ? (
            <ModelCardGrid entries={models} />
          ) : (
            <div className="catalog-empty">
              <span className="catalog-empty-icon" aria-hidden="true">
                <SearchIcon width={24} height={24} />
              </span>
              <h2>Nenhum modelo encontrado</h2>
              <p>
                Não encontramos aparelhos para essa marca ou busca. Tente outro termo ou veja
                todas as marcas disponíveis.
              </p>
              <div className="catalog-empty-actions">
                {query && (
                  <button type="button" className="btn btn-outline" onClick={() => handleSearch('')}>
                    Limpar busca
                  </button>
                )}
                <button type="button" className="btn btn-primary" onClick={clearAll}>
                  Ver todas as marcas
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
