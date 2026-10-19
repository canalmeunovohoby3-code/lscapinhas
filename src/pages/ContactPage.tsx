import { Link } from 'react-router-dom';
import { site } from '../data/site';
import { usePageMeta } from '../lib/usePageMeta';
import { buildGeneralWhatsAppUrl } from '../lib/whatsapp';
import {
  ArrowRightIcon,
  SmartphoneIcon,
  SparklesIcon,
  WhatsAppIcon,
} from '../components/Icons';

export function ContactPage() {
  usePageMeta(
    `Contato | ${site.fullName}`,
    'Fale com a LS Case pelo WhatsApp para tirar dúvidas sobre capinhas, modelos compatíveis e personalização.',
  );

  return (
    <div className="contact-page">
      <div className="container">
        <nav className="breadcrumb" aria-label="Você está aqui">
          <Link to="/">Início</Link>
          <span>/</span>
          <span aria-current="page">Contato</span>
        </nav>

        <div className="contact-hero">
          <div className="contact-copy">
            <p className="eyebrow">Contato</p>
            <h1>Fale com a LS Case</h1>
            <p>
              Atendimento direto pelo WhatsApp para dúvidas sobre capinhas, compatibilidade,
              personalização e pedidos.
            </p>
          </div>

          <div className="contact-card">
            <span className="contact-card-icon" aria-hidden="true">
              <WhatsAppIcon width={26} height={26} />
            </span>
            <p className="contact-card-label">WhatsApp da loja</p>
            <a className="contact-phone" href={buildGeneralWhatsAppUrl()} target="_blank" rel="noopener noreferrer">
              {site.whatsapp.display}
            </a>
            <a
              className="btn btn-primary btn-large"
              href={buildGeneralWhatsAppUrl()}
              target="_blank"
              rel="noopener noreferrer"
            >
              <WhatsAppIcon width={18} height={18} />
              Iniciar conversa
            </a>
            <p className="contact-card-note">
              Ao abrir o WhatsApp, envie seu modelo de celular para agilizar o atendimento.
            </p>
          </div>
        </div>

        <div className="contact-grid">
          <article className="contact-tile">
            <SmartphoneIcon width={22} height={22} />
            <h2>Antes de escolher</h2>
            <p>
              Tenha em mãos a marca e o modelo do seu celular. A vitrine mostra apenas as capinhas
              compatíveis com o aparelho selecionado.
            </p>
            <Link to="/#escolha-seu-celular" className="inline-link">
              Escolher meu modelo
              <ArrowRightIcon width={15} height={15} />
            </Link>
          </article>

          <article className="contact-tile">
            <SparklesIcon width={22} height={22} />
            <h2>Dúvidas sobre uma capinha</h2>
            <p>
              Fale com a loja para confirmar disponibilidade, variações e detalhes da capinha que
              você encontrou no catálogo.
            </p>
            <Link to="/capinhas" className="inline-link">
              Ver capinhas
              <ArrowRightIcon width={15} height={15} />
            </Link>
          </article>

          <article className="contact-tile contact-tile--info">
            <h2>Informações da loja</h2>
            <dl>
              <div>
                <dt>WhatsApp</dt>
                <dd>{site.whatsapp.display}</dd>
              </div>
              <div>
                <dt>Pedidos</dt>
                <dd>Pelo WhatsApp</dd>
              </div>
            </dl>
            <p className="contact-info-note">
              Prazos, frete, formas de pagamento e políticas são confirmados no atendimento.
            </p>
          </article>
        </div>
      </div>
    </div>
  );
}
