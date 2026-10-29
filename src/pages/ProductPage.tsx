import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { InspirationCard } from '../components/InspirationCard';
import { ArrowRightIcon, ChevronDownIcon, SmartphoneIcon, WhatsAppIcon } from '../components/Icons';
import { useStore } from '../context/StoreContext';
import { catalog, getModelById, getProductBySlug } from '../data/catalog';
import { buildWhatsAppUrl } from '../lib/whatsapp';
import { usePageMeta } from '../lib/usePageMeta';

export function ProductPage() {
  const { slug = '' } = useParams();
  const [searchParams] = useSearchParams();
  const product = getProductBySlug(slug);
  const { selectedModelId } = useStore();

  const [imageIndex, setImageIndex] = useState(0);

  usePageMeta(
    product
      ? `Inspiração: ${product.name} | LS Case by LS Celulares`
      : 'Inspiração não encontrada | LS Case by LS Celulares',
    product?.description,
  );

  useEffect(() => {
    setImageIndex(0);
  }, [product]);

  if (!product) {
    return (
      <div className="container not-found">
        <p className="eyebrow">Inspiração não encontrada</p>
        <h1>Esta estampa não está mais disponível.</h1>
        <p>Explore o catálogo e monte uma capinha com a sua própria arte.</p>
        <Link to="/capinhas" className="btn btn-primary">
          Ver catálogo de modelos
          <ArrowRightIcon width={17} height={17} />
        </Link>
      </div>
    );
  }

  const requestedModel = getModelById(searchParams.get('modelo'));
  const selectedModel = requestedModel ?? getModelById(selectedModelId);
  const requestHref = selectedModel
    ? `/capinhas?modelo=${encodeURIComponent(selectedModel.id)}`
    : '/capinhas';
  const inquiryUrl = buildWhatsAppUrl(
    `Olá! Vi a inspiração "${product.name}"${
      selectedModel ? ` para o ${selectedModel.name}` : ''
    } e gostaria de solicitar uma capinha personalizada. Poderia me ajudar?`,
  );
  const related = catalog.products
    .filter((entry) => entry.id !== product.id)
    .filter((entry) => entry.category === product.category || entry.featured)
    .slice(0, 4);

  return (
    <div className="product-page">
      <div className="container">
        <nav className="breadcrumb" aria-label="Você está aqui">
          <Link to="/">Início</Link>
          <span>/</span>
          <Link to="/capinhas">Capinhas</Link>
          <span>/</span>
          <span aria-current="page">{product.name}</span>
        </nav>

        <div className="product-layout">
          <div className="product-gallery">
            <div className="product-main-image">
              <img
                src={product.images[imageIndex]}
                alt={`${product.name} — imagem ${imageIndex + 1}`}
                width={900}
                height={1100}
                loading="eager"
              />
            </div>
            {product.images.length > 1 && (
              <div className="product-thumbs" role="group" aria-label="Galeria de imagens">
                {product.images.map((image, index) => (
                  <button
                    key={image}
                    type="button"
                    className={`product-thumb${index === imageIndex ? ' is-active' : ''}`}
                    onClick={() => setImageIndex(index)}
                    aria-label={`Ver imagem ${index + 1} de ${product.name}`}
                    aria-pressed={index === imageIndex}
                  >
                    <img
                      src={image}
                      alt=""
                      width={900}
                      height={1100}
                      loading="lazy"
                      aria-hidden="true"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="product-info">
            <p className="eyebrow">Inspiração</p>
            <h1>{product.name}</h1>

            <p className="product-description">{product.description}</p>

            <p className="product-inspiration-note">
              Esta é uma estampa de exemplo. A sua foto ou arte será enviada por você no
              formulário de pedido do site.
            </p>

            {selectedModel ? (
              <div className="product-field">
                <div className="product-model-display">
                  <SmartphoneIcon width={18} height={18} />
                  <span className="model-field-copy">
                    <span className="model-field-label">Modelo do celular</span>
                    <strong>{selectedModel.name}</strong>
                  </span>
                </div>
              </div>
            ) : (
              <p className="product-inspiration-model-hint">
                Escolha o modelo do seu celular na próxima etapa.
              </p>
            )}

            <div className="product-request-actions">
              <Link to={requestHref} className="btn btn-primary btn-large btn-block">
                Solicitar capinha personalizada
                <ArrowRightIcon width={17} height={17} />
              </Link>
              <a
                href={inquiryUrl}
                className="btn btn-outline btn-block"
                target="_blank"
                rel="noopener noreferrer"
              >
                <WhatsAppIcon width={18} height={18} />
                Falar sobre esta inspiração
              </a>
              <p className="product-whatsapp-note">
                O valor e as condições de pagamento são combinados pelo WhatsApp.
              </p>
            </div>

            <div className="product-accordions">
              <details className="product-accordion">
                <summary>
                  Como funciona
                  <ChevronDownIcon width={16} height={16} />
                </summary>
                <div className="product-accordion-body">
                  <ol className="how-to-buy">
                    <li>Escolha a marca e o modelo exato do seu celular.</li>
                    <li>Adicione a quantidade à solicitação e escreva suas observações.</li>
                    <li>
                      Finalize o pedido pelo site e anexe a foto ou arte que deseja imprimir.
                    </li>
                  </ol>
                </div>
              </details>
            </div>

            <Link to="/contato" className="product-contact-link">
              <SmartphoneIcon width={16} height={16} />
              Dúvidas sobre o seu modelo? Fale com a loja
            </Link>
          </div>
        </div>
      </div>

      <section className="section related-products">
        <div className="container">
          <div className="related-head">
            <h2>Outras inspirações</h2>
            <Link to="/capinhas" className="inline-link">
              Ver catálogo de modelos
              <ArrowRightIcon width={15} height={15} />
            </Link>
          </div>
          <div className="product-grid product-grid--shop">
            {related.map((entry) => (
              <InspirationCard
                key={entry.id}
                product={entry}
                modelId={selectedModel?.id ?? null}
              />
            ))}
          </div>
        </div>
      </section>

      <div className="product-help">
        <div className="container product-help-inner">
          <p>
            Precisa de ajuda para escolher?{' '}
            <a
              href={buildWhatsAppUrl(
                `Olá! Tenho uma dúvida sobre a inspiração ${product.name}.`,
              )}
              target="_blank"
              rel="noopener noreferrer"
            >
              Chame a LS Case no WhatsApp
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
