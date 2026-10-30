import { Link } from 'react-router-dom';
import { DeviceJourney } from '../components/DeviceJourney';
import { usePageMeta } from '../lib/usePageMeta';

export function CatalogPage() {
  usePageMeta(
    'Escolha seu aparelho | LS Case by LS Celulares',
    'Escolha a marca e o modelo do celular para personalizar sua capinha com as suas fotografias.',
  );

  return (
    <div className="catalog-page">
      <section className="shop-page-head">
        <div className="container">
          <nav className="breadcrumb" aria-label="Você está aqui">
            <Link to="/">Início</Link>
            <span>/</span>
            <span aria-current="page">Escolher aparelho</span>
          </nav>

          <div className="shop-page-head-row">
            <div>
              <span className="eyebrow">Personalize sua capinha</span>
              <h1>Escolha o seu aparelho</h1>
              <p>
                Primeiro escolha a marca. Depois, o modelo exato para carregar o mockup
                correspondente e seguir para a personalização.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="model-catalog-section" id="modelos">
        <div className="container">
          <DeviceJourney />
        </div>
      </section>
    </div>
  );
}
