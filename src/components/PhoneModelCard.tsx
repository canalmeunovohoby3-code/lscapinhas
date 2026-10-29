import type { PhoneBrand, PhoneModel } from '../types/catalog';
import { getModelIllustration } from '../lib/modelImage';
import { CheckIcon, PlusIcon } from './Icons';

export function PhoneModelCard({
  brand,
  model,
  selected,
  inRequest,
  eager = false,
  images,
  onRequest,
}: {
  brand: PhoneBrand;
  model: PhoneModel;
  selected: boolean;
  inRequest: boolean;
  eager?: boolean;
  images?: readonly string[];
  onRequest: () => void;
}) {
  const illustration = getModelIllustration(model);
  const image = images?.[0] ?? illustration.image;

  return (
    <article
      className={`product-card model-card${selected ? ' is-selected' : ''}${
        inRequest ? ' is-in-request' : ''
      }`}
    >
      <div className="product-card-media">
        <img
          className="product-card-image"
          src={image}
          alt={`Foto de capinha para ${model.name}`}
          loading={eager ? 'eager' : 'lazy'}
        />
      </div>

      <div className="product-card-body model-card-body">
        <div className="model-card-top">
          <span className="model-card-brand">{brand.shortName}</span>
          {inRequest && (
            <span className="model-card-badge">
              <CheckIcon width={12} height={12} />
              Na solicitação
            </span>
          )}
        </div>

        <h3 className="product-card-title">{model.name}</h3>
        <p className="model-card-note">Capinha personalizada com a sua arte</p>

        {inRequest ? (
          <button
            type="button"
            className="btn btn-outline btn-block model-card-action"
            onClick={onRequest}
            aria-label={`Ver ${model.name} na solicitação`}
          >
            <CheckIcon width={15} height={15} />
            Ver na solicitação
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-primary btn-block model-card-action"
            onClick={onRequest}
            aria-label={`Solicitar capinha personalizada para ${model.name}`}
          >
            <PlusIcon width={15} height={15} />
            Solicitar capinha
          </button>
        )}
      </div>
    </article>
  );
}
