import { Link, NavLink } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { site } from '../data/site';
import { buildGeneralWhatsAppUrl } from '../lib/whatsapp';
import { BagIcon, SmartphoneIcon, WhatsAppIcon } from './Icons';
import { Modal } from './Modal';

const links = [
  { to: '/', label: 'Início', end: true },
  { to: '/capinhas', label: 'Capinhas' },
  { to: '/contato', label: 'Contato' },
];

export function MobileMenu({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { requestCount, selectedModel } = useStore();

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Menu"
      size="sm"
      panelClassName="modal-panel--drawer"
    >
      <nav className="mobile-nav" aria-label="Navegação principal">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            onClick={onClose}
            className={({ isActive }) => `mobile-nav-link${isActive ? ' is-active' : ''}`}
          >
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className="mobile-menu-divider" />

      {selectedModel && (
        <Link to="/capinhas" className="mobile-model" onClick={onClose}>
          <SmartphoneIcon width={18} height={18} />
          <span>
            Seu aparelho
            <strong>{selectedModel.name}</strong>
          </span>
          <span className="mobile-model-change">alterar</span>
        </Link>
      )}

      <Link to="/solicitacao" className="mobile-cart-link" onClick={onClose}>
        <BagIcon width={18} height={18} />
        Solicitação
        {requestCount > 0 && <span className="mobile-cart-count">{requestCount}</span>}
      </Link>

      <a
        className="btn btn-primary mobile-menu-whatsapp"
        href={buildGeneralWhatsAppUrl()}
        target="_blank"
        rel="noopener noreferrer"
      >
        <WhatsAppIcon width={18} height={18} />
        Falar no WhatsApp
      </a>
      <p className="mobile-menu-phone">{site.whatsapp.display}</p>
    </Modal>
  );
}
