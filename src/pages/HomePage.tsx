import { Link } from 'react-router-dom';
import { HomeCarousel } from '../components/HomeCarousel';
import { ModelCardGrid } from '../components/ModelCardGrid';
import { RequestBuilder } from '../components/RequestBuilder';
import { ArrowRightIcon, BagIcon, SmartphoneIcon } from '../components/Icons';
import { activeHomeBanners } from '../data/banners';
import { getBrandById, getModelById } from '../data/catalog';
import { site } from '../data/site';
import { usePageMeta } from '../lib/usePageMeta';

const FEATURED_MODEL_IDS = ['iphone-16', 'galaxy-s25', 'moto-g84', 'redmi-note-14'];
const featuredModels = FEATURED_MODEL_IDS.flatMap((id) => {
  const model = getModelById(id);
  const brand = model ? getBrandById(model.brandId) : undefined;
  return model && brand ? [{ brand, model }] : [];
});

export function HomePage() {
  usePageMeta(
    `${site.fullName} | Capinhas personalizadas`,
    'Escolha o modelo do seu celular e solicite uma capinha personalizada. Envie sua foto ou arte pelo formulário do site.',
  );

  return (
    <div className="shop-home">
      <h1 className="sr-only">
        Capinhas personalizadas para o seu celular — LS Case by LS Celulares
      </h1>

      <HomeCarousel banners={activeHomeBanners} />

      <section className="home-selector" id="escolha-seu-celular">
        <div className="container">
          <RequestBuilder idPrefix="home-request" />
        </div>
      </section>

      <section className="how-it-works">
        <div className="container">
          <div className="section-intro how-intro">
            <p className="eyebrow">Como funciona</p>
            <h2>Da escolha do modelo à sua arte no pedido.</h2>
            <p>
              Sem cadastro e sem pagamento no site. Você escolhe o aparelho, informa a
              quantidade e envia a imagem que deseja imprimir pelo formulário.
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
              <h3>Escolha o modelo</h3>
              <p>Selecione a marca e o modelo exato do seu celular.</p>
            </article>

            <article className="how-step">
              <div className="how-step-top">
                <span className="how-step-icon" aria-hidden="true">
                  <BagIcon width={20} height={20} />
                </span>
                <span className="how-step-number">02</span>
              </div>
              <h3>Informe a quantidade</h3>
              <p>Adicione uma ou mais capinhas à sua solicitação.</p>
            </article>

            <article className="how-step">
              <div className="how-step-top">
                <span className="how-step-icon" aria-hidden="true">
                  <ArrowRightIcon width={20} height={20} />
                </span>
                <span className="how-step-number">03</span>
              </div>
              <h3>Envie sua arte</h3>
              <p>
                Finalize pelo site e anexe a foto ou arte que deseja imprimir.
              </p>
            </article>
          </div>

          <p className="how-note">
            O valor e as condições de pagamento são combinados diretamente no atendimento.
          </p>
        </div>
      </section>

      <section className="inspirations">
        <div className="container">
          <div className="inspirations-head">
            <div>
              <p className="eyebrow">Modelos em destaque</p>
              <h2>Escolha o aparelho e personalize do seu jeito.</h2>
              <p>Selecione um modelo e envie sua foto ou arte pelo formulário do site.</p>
            </div>
            <Link to="/capinhas" className="inline-link">
              Ver catálogo de modelos
              <ArrowRightIcon width={15} height={15} />
            </Link>
          </div>

          <ModelCardGrid entries={featuredModels} eagerCount={4} />
        </div>
      </section>
    </div>
  );
}
