import { useEffect, useState } from 'react';
import { HomeCarousel } from '../components/HomeCarousel';
import { PhoneModelSelect } from '../components/PhoneModelSelect';
import { ProductCard } from '../components/ProductCard';
import { SearchIcon, SmartphoneIcon, WhatsAppIcon } from '../components/Icons';
import { useStore } from '../context/StoreContext';
import { activeHomeBanners } from '../data/banners';
import { filterProducts } from '../lib/filters';
import { pluralize } from '../lib/format';
import { buildWhatsAppUrl } from '../lib/whatsapp';
import { site } from '../data/site';
import { usePageMeta } from '../lib/usePageMeta';

const PRODUCTS_PER_PAGE = 8;

export function HomePage() {
  const { selectedModelId, selectedModel, setSelectedModel } = useStore();
  const [visibleCount, setVisibleCount] = useState(PRODUCTS_PER_PAGE);

  usePageMeta(
    `${site.fullName} | Capinhas para celular`,
    'Catálogo de capinhas para celular. Escolha o modelo do seu aparelho, encontre as capinhas compatíveis e finalize o pedido pelo WhatsApp.',
  );

  useEffect(() => {
    setVisibleCount(PRODUCTS_PER_PAGE);
  }, [selectedModelId]);

  const results = filterProducts({ modelId: selectedModelId });
  const visibleProducts = results.slice(0, visibleCount);
  const hasMore = results.length > visibleProducts.length;
  const countLabel = `${results.length} ${pluralize(results.length, 'capinha', 'capinhas')}`;

  return (
    <div className="shop-home">
      <h1 className="sr-only">Capinhas para o seu celular — LS Case by LS Celulares</h1>

      <HomeCarousel banners={activeHomeBanners} />

      <section className="home-selector" id="escolha-seu-celular">
        <div className="container">
          <div className="phone-selector-panel">
            <div className="phone-selector-heading">
              <span className="phone-selector-icon" aria-hidden="true">
                <SmartphoneIcon width={20} height={20} />
              </span>
              <div>
                <h2>Escolha o modelo do seu celular</h2>
                <p>Mostramos apenas as capinhas compatíveis com o aparelho selecionado.</p>
              </div>
              {selectedModel && (
                <span className="selected-model-badge">{selectedModel.name}</span>
              )}
            </div>

            <div className="home-model-row">
              <PhoneModelSelect
                selectedModelId={selectedModelId}
                onSelect={(model) => setSelectedModel(model?.id ?? null)}
                showClear={false}
                idPrefix="home-model"
              />
              {selectedModel && (
                <button
                  type="button"
                  className="model-select-clear home-model-clear"
                  onClick={() => setSelectedModel(null)}
                >
                  Limpar filtros
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="shop-catalog" aria-live="polite">
        <div className="container">
          <div className="shop-catalog-head">
            <div>
              <h2>
                {selectedModel ? `Capinhas para ${selectedModel.name}` : 'Todas as capinhas'}
              </h2>
              <p>
                {countLabel}
                {selectedModel ? ' compatíveis com o seu aparelho' : ' disponíveis no catálogo'}
              </p>
            </div>
          </div>

          {visibleProducts.length > 0 ? (
            <>
              <div className="product-grid product-grid--shop">
                {visibleProducts.map((product, index) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    eager={index < 4}
                    selectedModel={selectedModel ?? null}
                    showFallbackModel={!selectedModel}
                  />
                ))}
              </div>

              {hasMore && (
                <div className="shop-more">
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => setVisibleCount((count) => count + PRODUCTS_PER_PAGE)}
                  >
                    Ver mais capinhas
                  </button>
                  <p>
                    {visibleProducts.length} de {results.length} produtos exibidos
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="catalog-empty">
              <span className="catalog-empty-icon" aria-hidden="true">
                <SearchIcon width={24} height={24} />
              </span>
              <h2>Nenhuma capinha para este modelo</h2>
              <p>
                Ainda não há capinhas cadastradas para o{' '}
                <strong>{selectedModel?.name ?? 'modelo selecionado'}</strong>. Você pode remover
                o filtro para ver o catálogo completo ou consultar a loja.
              </p>
              <div className="catalog-empty-actions">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setSelectedModel(null)}
                >
                  Ver todas as capinhas
                </button>
                <a
                  className="btn btn-primary"
                  href={buildWhatsAppUrl(
                    `Olá! Gostaria de saber se a LS Case tem capinhas para o ${selectedModel?.name ?? 'meu celular'}.`,
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <WhatsAppIcon width={17} height={17} />
                  Consultar disponibilidade
                </a>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
