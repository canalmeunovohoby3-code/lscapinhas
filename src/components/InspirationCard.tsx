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
  return (
    <article className="product-card inspiration-card">
      <div className="product-card-media">
        <Link to={href} aria-label={`Ver inspiração ${product.name}`}>
          <img
            className="product-card-image"
            src={product.images[0]}
            alt={product.name}
            loading={eager ? 'eager' : 'lazy'}
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
