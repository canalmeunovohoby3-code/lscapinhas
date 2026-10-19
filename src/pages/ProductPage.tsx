import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ProductCard } from '../components/ProductCard';
import { QuantityStepper } from '../components/QuantityStepper';
import {
  ArrowRightIcon,
  ChevronDownIcon,
  SmartphoneIcon,
  WhatsAppIcon,
} from '../components/Icons';
import { useStore } from '../context/StoreContext';
import { catalog, getProductBySlug } from '../data/catalog';
import { discountPercent, formatBRL } from '../lib/format';
import { resolveProductModel } from '../lib/productModel';
import { buildProductInquiryUrl, buildWhatsAppUrl } from '../lib/whatsapp';
import { usePageMeta } from '../lib/usePageMeta';

export function ProductPage() {
  const { slug = '' } = useParams();
  const [searchParams] = useSearchParams();
  const product = getProductBySlug(slug);
  const { selectedModel, addToCart } = useStore();

  const [imageIndex, setImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState('');

  usePageMeta(
    product
      ? `${product.name} | LS Case by LS Celulares`
      : 'Produto não encontrado | LS Case by LS Celulares',
    product?.description,
  );

  useEffect(() => {
    setImageIndex(0);
    setQuantity(1);
    setError('');
  }, [product]);

  if (!product) {
    return (
      <div className="container not-found">
        <p className="eyebrow">Capinha não encontrada</p>
        <h1>Esta capinha não está mais no catálogo.</h1>
        <p>Explore as opções disponíveis para o seu modelo.</p>
        <Link to="/capinhas" className="btn btn-primary">
          Ver capinhas
          <ArrowRightIcon width={17} height={17} />
        </Link>
      </div>
    );
  }

  const currentProduct = product;
  const urlModelId = searchParams.get('modelo');
  const productModel = resolveProductModel(currentProduct, urlModelId, {
    fallbackModelId: selectedModel?.id ?? null,
    allowDefault: true,
  });
  const selectedVariant = currentProduct.variants[0] ?? null;
  const discount = discountPercent(currentProduct.price, currentProduct.originalPrice);
  const related = catalog.products
    .filter((entry) => entry.id !== currentProduct.id)
    .filter((entry) => !selectedModel || entry.compatibleModels.includes(selectedModel.id))
    .filter((entry) => entry.category === currentProduct.category || entry.featured)
    .slice(0, 4);

  const inquiryUrl = buildProductInquiryUrl({
    productName: currentProduct.name,
    modelName: productModel?.name ?? null,
    quantity,
    price: currentProduct.price,
    productUrl: typeof window !== 'undefined' ? window.location.href : undefined,
  });

  function handleAdd() {
    const added = addToCart({
      product: currentProduct,
      model: productModel,
      variant: selectedVariant,
      quantity,
    });
    if (!added) {
      setError('Não foi possível adicionar esta capinha. Confira as opções.');
      return;
    }
    setError('');
  }

  return (
    <div className="product-page">
      <div className="container">
        <nav className="breadcrumb" aria-label="Você está aqui">
          <Link to="/">Início</Link>
          <span>/</span>
          <Link to="/capinhas">Capinhas</Link>
          <span>/</span>
          <span aria-current="page">{currentProduct.name}</span>
        </nav>

        <div className="product-layout">
          <div className="product-gallery">
            <div className="product-main-image">
              <img
                src={currentProduct.images[imageIndex]}
                alt={`${currentProduct.name} — imagem ${imageIndex + 1}`}
                width={900}
                height={1100}
                loading="eager"
              />
              {discount !== null && <span className="product-discount">-{discount}%</span>}
            </div>
            {currentProduct.images.length > 1 && (
              <div className="product-thumbs" role="group" aria-label="Galeria de imagens">
                {currentProduct.images.map((image, index) => (
                  <button
                    key={image}
                    type="button"
                    className={`product-thumb${index === imageIndex ? ' is-active' : ''}`}
                    onClick={() => setImageIndex(index)}
                    aria-label={`Ver imagem ${index + 1} de ${currentProduct.name}`}
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
            <h1>{currentProduct.name}</h1>

            <div className="product-price-row">
              <span className="product-price">{formatBRL(currentProduct.price)}</span>
              {currentProduct.originalPrice && (
                <s className="product-price-old">{formatBRL(currentProduct.originalPrice)}</s>
              )}
              {discount !== null && <span className="product-price-tag">-{discount}%</span>}
            </div>

            <p className="product-description">{currentProduct.description}</p>

            {!currentProduct.available && (
              <p className="product-unavailable" role="alert">
                Esta capinha está indisponível no momento. Fale com a loja para saber sobre novas
                reposições.
              </p>
            )}

            <div className="product-form">
              {productModel && (
                <div className="product-field">
                  <div className="product-model-display">
                    <SmartphoneIcon width={18} height={18} />
                    <span className="model-field-copy">
                      <span className="model-field-label">Modelo do celular</span>
                      <strong>{productModel.name}</strong>
                    </span>
                  </div>
                </div>
              )}

              <div className="product-buy-row">
                <div>
                  <span className="field-label">Quantidade</span>
                  <QuantityStepper value={quantity} onChange={setQuantity} />
                </div>
                <button
                  type="button"
                  className="btn btn-primary product-add"
                  onClick={handleAdd}
                  disabled={!currentProduct.available}
                >
                  Adicionar ao carrinho
                </button>
              </div>

              {error && (
                <p className="form-error" role="alert">
                  {error}
                </p>
              )}

              <a
                className="btn btn-outline btn-block product-whatsapp"
                href={inquiryUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <WhatsAppIcon width={18} height={18} />
                Comprar pelo WhatsApp
              </a>
              <p className="product-whatsapp-note">
                O botão abre uma conversa com a loja para confirmar disponibilidade e detalhes.
              </p>
            </div>

            <div className="product-accordions">
              <details className="product-accordion">
                <summary>
                  Como comprar
                  <ChevronDownIcon width={16} height={16} />
                </summary>
                <div className="product-accordion-body">
                  <ol className="how-to-buy">
                    <li>Escolha o modelo do celular e a variação.</li>
                    <li>Adicione a capinha ao carrinho e ajuste a quantidade.</li>
                    <li>Informe seu nome e finalize o pedido pelo WhatsApp.</li>
                  </ol>
                </div>
              </details>
            </div>

            <Link to="/contato" className="product-contact-link">
              <SmartphoneIcon width={16} height={16} />
              Dúvidas sobre compatibilidade? Fale com a loja
            </Link>
          </div>
        </div>
      </div>

      <section className="section related-products">
        <div className="container">
          <div className="related-head">
            <h2>Você também pode gostar</h2>
            <Link to="/capinhas" className="inline-link">
              Ver todas as capinhas
              <ArrowRightIcon width={15} height={15} />
            </Link>
          </div>
          <div className="product-grid product-grid--shop">
            {related.map((entry) => (
              <ProductCard
                key={entry.id}
                product={entry}
                selectedModel={selectedModel ?? null}
                showFallbackModel={!selectedModel}
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
              href={buildWhatsAppUrl(`Olá! Tenho uma dúvida sobre a capinha ${currentProduct.name}.`)}
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
