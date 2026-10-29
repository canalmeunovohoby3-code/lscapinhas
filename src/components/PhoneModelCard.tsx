import type { PhoneBrand, PhoneModel } from '../types/catalog';
import { getModelIllustration } from '../lib/modelImage';
import { buildCustomRequestWhatsAppUrl } from '../lib/whatsapp';
import { CheckIcon, PlusIcon } from './Icons';

export function PhoneModelCard({
  brand,
  model,
  selected,
  inRequest,
  eager = false,
  onRequest,
}: {
  brand: PhoneBrand;
  model: PhoneModel;
  selected: boolean;
  inRequest: boolean;
  eager?: boolean;
  onRequest: () => void;
}) {
  const { image, hoverImage } = getModelIllustration(model);
  const requestUrl = buildCustomRequestWhatsAppUrl({
    items: [
      {
        brandName: brand.shortName,
        modelName: model.name,
        quantity: 1,
      },
    ],
  });

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
          alt={`Exemplo de capinha personalizada para ${model.name}`}
          width={900}
          height={1100}
          loading={eager ? 'eager' : 'lazy'}
        />
        <img
          className="product-card-image product-card-image--hover"
          src={hoverImage}
          alt=""
          width={900}
          height={1100}
          loading="lazy"
          aria-hidden="true"
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
          <a
            href={requestUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary btn-block model-card-action"
            onClick={onRequest}
            aria-label={`Solicitar capinha personalizada para ${model.name}`}
          >
            <PlusIcon width={15} height={15} />
            Solicitar capinha
          </a>
        )}
      </div>
    </article>
  );
}
