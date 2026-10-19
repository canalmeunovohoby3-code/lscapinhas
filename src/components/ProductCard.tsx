import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { PhoneModel, Product } from '../types/catalog';
import { discountPercent, formatBRL } from '../lib/format';
import { resolveProductModel } from '../lib/productModel';
import { PlusIcon } from './Icons';
import { QuickAddDialog } from './QuickAddDialog';

export function ProductCard({
  product,
  eager = false,
  selectedModel = null,
  showFallbackModel = false,
}: {
  product: Product;
  eager?: boolean;
  selectedModel?: PhoneModel | null;
  showFallbackModel?: boolean;
}) {
  const [addOpen, setAddOpen] = useState(false);
  const discount = discountPercent(product.price, product.originalPrice);
  const secondaryImage = product.images[1] ?? product.images[0];
  const displayModel = resolveProductModel(product, selectedModel?.id ?? null, {
    allowDefault: showFallbackModel,
  });
  const productHref = displayModel
    ? `/produto/${product.slug}?modelo=${encodeURIComponent(displayModel.id)}`
    : `/produto/${product.slug}`;

  return (
    <article className="product-card">
      <div className="product-card-media">
        <Link to={productHref} aria-label={`Ver ${product.name}`}>
          <img
            className="product-card-image"
            src={product.images[0]}
            alt={product.name}
            width={900}
            height={1100}
            loading={eager ? 'eager' : 'lazy'}
          />
          <img
            className="product-card-image product-card-image--hover"
            src={secondaryImage}
            alt=""
            width={900}
            height={1100}
            loading="lazy"
            aria-hidden="true"
          />
        </Link>
        {discount !== null && <span className="product-card-discount">-{discount}%</span>}
        {!product.available && <span className="product-card-soldout">Indisponível</span>}
      </div>

      <div className="product-card-body">
        <h3 className="product-card-title">
          <Link to={productHref}>{product.name}</Link>
        </h3>
        {displayModel && <p className="product-card-models">{displayModel.name}</p>}

        <div className="product-card-price">
          <span className="price">{formatBRL(product.price)}</span>
          {product.originalPrice && (
            <s className="price-old">{formatBRL(product.originalPrice)}</s>
          )}
        </div>

        <button
          type="button"
          className="btn btn-primary btn-block product-card-add"
          onClick={() => setAddOpen(true)}
          aria-label={`Adicionar ${product.name} ao carrinho`}
          disabled={!product.available}
        >
          <PlusIcon width={16} height={16} />
          {product.available ? 'Adicionar ao carrinho' : 'Indisponível'}
        </button>
      </div>

      <QuickAddDialog
        product={product}
        modelId={displayModel?.id ?? null}
        open={addOpen}
        onClose={() => setAddOpen(false)}
      />
    </article>
  );
}
