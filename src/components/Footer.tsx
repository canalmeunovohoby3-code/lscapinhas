import { Link } from 'react-router-dom';
import { site } from '../data/site';
import { buildGeneralWhatsAppUrl } from '../lib/whatsapp';
import { BrandLogo } from './BrandLogo';
import { WhatsAppIcon } from './Icons';

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <div className="footer-logos">
              <Link
                to="/"
                className="footer-brand-logo"
                aria-label={`${site.fullName} — página inicial`}
              >
                <BrandLogo light />
              </Link>
              <img
                className="footer-assistance-logo"
                src="/logorodape.png"
                alt="LS Mania Celular — Assistência Técnica e Acessórios"
                width={476}
                height={180}
                loading="lazy"
              />
            </div>
            <p>{site.description}</p>
          </div>

          <nav className="footer-column" aria-label="Navegação do rodapé">
            <h3>Navegação</h3>
            <Link to="/">Início</Link>
            <Link to="/capinhas">Capinhas</Link>
            <Link to="/contato">Contato</Link>
            <Link to="/solicitacao">Solicitação</Link>
          </nav>

          <div className="footer-column">
            <h3>Atendimento</h3>
            <a
              href={buildGeneralWhatsAppUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="footer-whatsapp"
            >
              <WhatsAppIcon width={16} height={16} />
              {site.whatsapp.display}
            </a>
            <p className="footer-muted">Pedidos, dúvidas e compatibilidade pelo WhatsApp.</p>
            {site.addressLines && (
              <address className="footer-address">
                {site.addressLines.map((line) => (
                  <span key={line}>{line}</span>
                ))}
              </address>
            )}
            {site.instagramUrl && (
              <a href={site.instagramUrl} target="_blank" rel="noopener noreferrer">
                Instagram
              </a>
            )}
            <p className="footer-muted footer-policies">{site.policiesNote}</p>
          </div>
        </div>

        <div className="footer-bottom">
          <p>
            © {year} {site.fullName}. Todos os direitos reservados.
          </p>
          <p className="footer-demo-note">Catálogo demonstrativo sujeito à atualização.</p>
          <Link to="/admin/login" className="footer-admin-link">
            Área administrativa
          </Link>
        </div>
      </div>
    </footer>
  );
}
