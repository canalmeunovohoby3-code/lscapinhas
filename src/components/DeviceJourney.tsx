import { useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  getJourneyBrands,
  getJourneyModel,
  getJourneyModels,
  isPersonalizationAvailable,
  resolveJourneyBrand,
} from '../lib/deviceJourney';
import {
  ArrowRightIcon,
  CheckIcon,
  CloseIcon,
  SearchIcon,
  SmartphoneIcon,
} from './Icons';

const BRAND_LOGOS: Record<string, string> = {
  apple: '/brands/apple.svg',
  motorola: '/brands/motorola.svg',
  samsung: '/brands/samsung.svg',
  xiaomi: '/brands/xiaomi.svg',
  realme: '/brands/realme.svg',
};

export function DeviceJourney() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const navigatingRef = useRef(false);
  const selectionRef = useRef<HTMLDivElement>(null);
  const brandId = searchParams.get('marca');
  const modelId = searchParams.get('modelo');
  const query = searchParams.get('q') ?? '';
  const brand = resolveJourneyBrand(brandId, modelId);
  const selectedModel = getJourneyModel(brand?.id, modelId);
  const models = getJourneyModels(brand?.id, query);
  const brands = getJourneyBrands();
  const hasMockup = selectedModel ? isPersonalizationAvailable(selectedModel.id) : false;

  useEffect(() => {
    if (!selectedModel) return undefined;

    const timer = window.setTimeout(() => {
      selectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 80);

    return () => window.clearTimeout(timer);
  }, [selectedModel?.id]);

  function updateParams(update: (params: URLSearchParams) => void) {
    const next = new URLSearchParams(searchParams);
    update(next);
    setSearchParams(next, { replace: true });
  }

  function chooseBrand(nextBrandId: string) {
    updateParams((params) => {
      params.set('marca', nextBrandId);
      params.delete('modelo');
      params.delete('q');
    });
  }

  function chooseModel(nextModelId: string) {
    if (!brand || navigatingRef.current) return;

    if (isPersonalizationAvailable(nextModelId)) {
      navigatingRef.current = true;
      navigate(`/personalizador?modelo=${encodeURIComponent(nextModelId)}`);
      return;
    }

    updateParams((params) => {
      params.set('marca', brand.id);
      params.set('modelo', nextModelId);
    });
  }

  function clearModel() {
    updateParams((params) => params.delete('modelo'));
  }

  function clearBrand() {
    updateParams((params) => {
      params.delete('marca');
      params.delete('modelo');
      params.delete('q');
    });
  }

  function updateQuery(value: string) {
    updateParams((params) => {
      if (value.trim()) params.set('q', value);
      else params.delete('q');
    });
  }

  if (!brand) {
    return (
      <div className="journey journey--brand">
        <div className="journey-step-head">
          <span className="eyebrow">Etapa 1</span>
          <h2>Escolha a marca do seu celular</h2>
          <p>Comece pela marca. Depois selecione o modelo exato para personalizar.</p>
        </div>

        <div className="journey-brand-grid">
          {brands.map((entry) => {
            const logoSrc = BRAND_LOGOS[entry.id];

            return (
              <button
                key={entry.id}
                type="button"
                className="journey-brand-card"
                data-brand-id={entry.id}
                onClick={() => chooseBrand(entry.id)}
              >
                <span className="brand-card-logo" aria-hidden={!logoSrc}>
                  {logoSrc ? (
                    <img src={logoSrc} alt="" loading="lazy" />
                  ) : (
                    <span>{entry.monogram}</span>
                  )}
                </span>
                <strong>{entry.name}</strong>
                <span>{entry.models.length} modelos</span>
                <ArrowRightIcon width={17} height={17} />
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="journey">
      <div className="journey-step-head journey-step-head--row">
        <div>
          <span className="eyebrow">Etapa 2</span>
          <h2>Escolha o modelo {brand.shortName}</h2>
          <p>Selecione o aparelho exato. A disponibilidade da personalização aparece em cada modelo.</p>
        </div>
        <button type="button" className="text-button" onClick={clearBrand}>
          Voltar para marcas
        </button>
      </div>

      <div className="journey-brand-current">
        <span className="brand-monogram" aria-hidden="true">
          {brand.monogram}
        </span>
        <strong>{brand.name}</strong>
      </div>

      <div className="journey-toolbar">
        <div className="catalog-search model-search">
          <SearchIcon width={18} height={18} />
          <input
            type="search"
            value={query}
            onChange={(event) => updateQuery(event.target.value)}
            placeholder={`Buscar modelo ${brand.shortName}`}
            aria-label={`Buscar modelo ${brand.shortName}`}
          />
          {query && (
            <button
              type="button"
              className="catalog-search-clear"
              onClick={() => updateQuery('')}
              aria-label="Limpar busca"
            >
              <CloseIcon width={14} height={14} />
            </button>
          )}
        </div>
        <p className="journey-count">
          {models.length} {models.length === 1 ? 'modelo' : 'modelos'}
        </p>
      </div>

      {models.length > 0 ? (
        <div className="journey-model-grid">
          {models.map((model) => {
            const available = isPersonalizationAvailable(model.id);
            const selected = selectedModel?.id === model.id;

            return (
              <button
                key={model.id}
                type="button"
                className={`journey-model-card${selected ? ' is-selected' : ''}`}
                data-model-id={model.id}
                aria-pressed={selected}
                onClick={() => chooseModel(model.id)}
              >
                <span className="journey-model-brand">{brand.shortName}</span>
                <strong>{model.name}</strong>
                <span className={`journey-model-status${available ? ' is-available' : ''}`}>
                  {available ? 'Personalização disponível' : 'Mockup próprio em breve'}
                </span>
                {selected && (
                  <span className="journey-model-check" aria-hidden="true">
                    <CheckIcon width={15} height={15} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="journey-empty">
          <SmartphoneIcon width={24} height={24} />
          <p>Nenhum modelo encontrado nesta marca.</p>
          <button type="button" className="text-button" onClick={() => updateQuery('')}>
            Limpar busca
          </button>
        </div>
      )}

      {selectedModel && (
        <div
          ref={selectionRef}
          className={`journey-selection${hasMockup ? '' : ' is-unavailable'}`}
          aria-live="polite"
        >
          <div className="journey-selection-copy">
            <span className="eyebrow">Modelo selecionado</span>
            <strong>{brand.shortName} {selectedModel.name}</strong>
            <p>
              {hasMockup
                ? 'Mockup disponível. Continue para posicionar e ajustar suas fotos.'
                : 'Este modelo ainda não possui mockup próprio. Para não usar o mockup de outro aparelho, a personalização não está liberada.'}
            </p>
          </div>

          {hasMockup ? (
            <div className="journey-selection-actions">
              <Link
                className="btn btn-primary"
                to={`/personalizador?modelo=${encodeURIComponent(selectedModel.id)}`}
              >
                Personalizar este modelo
                <ArrowRightIcon width={17} height={17} />
              </Link>
              <button type="button" className="text-button journey-selection-change" onClick={clearModel}>
                Escolher outro modelo
              </button>
            </div>
          ) : (
            <button type="button" className="btn btn-outline" onClick={clearModel}>
              Escolher outro modelo
            </button>
          )}
        </div>
      )}
    </div>
  );
}
