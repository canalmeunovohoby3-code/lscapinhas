import { Link, useSearchParams } from 'react-router-dom';
import { DeviceJourney } from '../components/DeviceJourney';
import { HomeCarousel } from '../components/HomeCarousel';
import { LocationSection } from '../components/LocationSection';
import { ArrowRightIcon, BagIcon, SlidersIcon, SmartphoneIcon, SparklesIcon } from '../components/Icons';
import { activeHomeBanners } from '../data/banners';
import { site } from '../data/site';
import { usePageMeta } from '../lib/usePageMeta';

export function HomePage() {
  const [searchParams] = useSearchParams();
  const isBrandStep = !searchParams.get('marca') && !searchParams.get('modelo');

  usePageMeta(
    `Personalize sua capinha | ${site.fullName}`,
    'Escolha a marca e o modelo do seu celular e personalize sua capinha com uma fotografia.',
  );

  return (
    <div className="shop-home">
      <h1 className="sr-only">
        Capinhas personalizadas para o seu celular — LS Case by LS Celulares
      </h1>

      <HomeCarousel banners={activeHomeBanners} />

      <section className="how-it-works">
        <div className="container">
          <div className="section-intro how-intro">
            <p className="eyebrow">Personalização de alta precisão</p>
            <h2>Do conceito à capinha, sem limites.</h2>
            <p>
              Escolha o aparelho, envie uma única fotografia e ajuste a arte sobre
              o mockup real. Uma experiência direta, precisa e feita para o seu celular.
            </p>
          </div>

          <div className="how-grid">
            <article className="how-step">
              <div className="how-step-top">
                <span className="how-step-icon" aria-hidden="true">
                  <SmartphoneIcon width={20} height={20} />
                </span>
                <span className="how-step-number">01</span>
              </div>
              <h3>Escolha o aparelho</h3>
              <p>Selecione a marca e o modelo exato para carregar o mockup correspondente.</p>
            </article>

            <article className="how-step">
              <div className="how-step-top">
                <span className="how-step-icon" aria-hidden="true">
                  <SparklesIcon width={20} height={20} />
                </span>
                <span className="how-step-number">02</span>
              </div>
              <h3>Personalize a sua capinha</h3>
              <p>Envie uma fotografia e ajuste posição, zoom e rotação com precisão.</p>
            </article>

            <article className="how-step">
              <div className="how-step-top">
                <span className="how-step-icon" aria-hidden="true">
                  <BagIcon width={20} height={20} />
                </span>
                <span className="how-step-number">03</span>
              </div>
              <h3>Finalize o pedido</h3>
              <p>Revise a composição e envie o pedido para a equipe da LS Case.</p>
            </article>
          </div>

          <p className="how-note">
            <SlidersIcon width={14} height={14} />
            Uma fotografia por capinha. O rascunho é salvo automaticamente neste navegador.
          </p>
        </div>
      </section>

      <section
        className={`inspirations device-selection${isBrandStep ? ' device-selection--brand' : ''}`}
        id="escolha-seu-celular"
      >
        <div className="container">
          <div className="inspirations-head">
            <div>
              <p className="eyebrow">Seu aparelho</p>
              <h2>Escolha o seu celular.</h2>
              <p>
                Marca, modelo e personalização no mesmo lugar. A personalização abre
                somente para os aparelhos com mockup disponível.
              </p>
            </div>
            <Link to="/#escolha-seu-celular" className="inline-link">
              Ver todos os aparelhos
              <ArrowRightIcon width={15} height={15} />
            </Link>
          </div>

          <DeviceJourney />
        </div>
      </section>

      <LocationSection />
    </div>
  );
}
