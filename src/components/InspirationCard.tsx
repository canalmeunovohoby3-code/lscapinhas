import { Link } from 'react-router-dom';
import type { Product } from '../types/catalog';

export function InspirationCard({
  product,
  modelId = null,
  eager = false,
}: {
  product: Product;
  modelId?: string | null;
  eager?: boolean;
}) {
  const href = `/produto/${product.slug}${
    modelId ? `?modelo=${encodeURIComponent(modelId)}` : ''
  }`;
  const secondaryImage = product.images[1] ?? product.images[0];

  return (
    <article className="product-card inspiration-card">
      <div className="product-card-media">
        <Link to={href} aria-label={`Ver inspiração ${product.name}`}>
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
      </div>

      <div className="product-card-body">
        <span className="inspiration-card-label">Inspiração</span>
        <h3 className="product-card-title">
          <Link to={href}>{product.name}</Link>
        </h3>
      </div>
    </article>
  );
}
