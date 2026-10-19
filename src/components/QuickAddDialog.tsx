import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Product } from '../types/catalog';
import { getModelById } from '../data/catalog';
import { useStore } from '../context/StoreContext';
import { formatBRL } from '../lib/format';
import { BagIcon, SmartphoneIcon } from './Icons';
import { Modal } from './Modal';
import { QuantityStepper } from './QuantityStepper';

export function QuickAddDialog({
  product,
  modelId = null,
  open,
  onClose,
}: {
  product: Product;
  modelId?: string | null;
  open: boolean;
  onClose: () => void;
}) {
  const { addToCart } = useStore();
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setQuantity(1);
    setError('');
  }, [open, product]);

  const candidateModel = getModelById(modelId ?? null);
  const modelForProduct =
    candidateModel && product.compatibleModels.includes(candidateModel.id)
      ? candidateModel
      : null;
  const variant = product.variants[0] ?? null;
  const detailsHref = `/produto/${product.slug}${
    modelForProduct ? `?modelo=${encodeURIComponent(modelForProduct.id)}` : ''
  }`;

  function handleSubmit() {
    const added = addToCart({
      product,
      model: modelForProduct,
      variant,
      quantity,
    });
    if (!added) {
      setError('Não foi possível adicionar esta capinha. Confira as opções.');
      return;
    }
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Adicionar ao carrinho" size="lg">
      <div className="quick-add">
        <div className="quick-add-media">
          <img src={product.images[0]} alt={product.name} width={900} height={1100} />
        </div>
        <div className="quick-add-content">
          <p className="quick-add-eyebrow">{product.category}</p>
          <h3>{product.name}</h3>
          <p className="quick-add-price">{formatBRL(product.price)}</p>

          {modelForProduct && (
            <p className="quick-add-model">
              <SmartphoneIcon width={15} height={15} />
              Modelo: <strong>{modelForProduct.name}</strong>
            </p>
          )}

          <div className="quick-add-qty">
            <span className="field-label">Quantidade</span>
            <QuantityStepper value={quantity} onChange={setQuantity} />
          </div>

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          <button type="button" className="btn btn-primary btn-block" onClick={handleSubmit}>
            <BagIcon width={18} height={18} />
            Adicionar ao carrinho
          </button>
          <Link to={detailsHref} className="quick-add-link" onClick={onClose}>
            Ver todos os detalhes
          </Link>
        </div>
      </div>
    </Modal>
  );
}
