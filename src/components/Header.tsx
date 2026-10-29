import { useEffect, useState, type FormEvent } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { catalog } from '../data/catalog';
import { site } from '../data/site';
import { buildGeneralWhatsAppUrl } from '../lib/whatsapp';
import { BrandLogo } from './BrandLogo';
import { BagIcon, MenuIcon, SearchIcon, WhatsAppIcon } from './Icons';
import { MobileMenu } from './MobileMenu';
import { ThemeToggle } from './ThemeToggle';

const navLinks = [
  { to: '/', label: 'Início', end: true },
  { to: '/capinhas', label: 'Capinhas' },
  { to: '/contato', label: 'Contato' },
];

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export function Header() {
  const { requestCount, setSelectedModel } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [term, setTerm] = useState('');
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8);
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  function submitSearch(event: FormEvent) {
    event.preventDefault();
    const query = term.trim();
    if (!query) {
      navigate('/capinhas');
      setSearchOpen(false);
      return;
    }

    const normalizedQuery = normalize(query);
    const exactMatch = catalog.models.find(
      (model) => normalize(model.name) === normalizedQuery,
    );
    const modelMatch =
      exactMatch ??
      catalog.models.find((model) => normalize(model.name).includes(normalizedQuery));
    const brandMatch = catalog.brands.find(
      (brand) =>
        normalize(brand.name).includes(normalizedQuery) ||
        normalize(brand.shortName).includes(normalizedQuery),
    );

    if (modelMatch) {
      setSelectedModel(modelMatch.id);
      navigate(`/capinhas?modelo=${encodeURIComponent(modelMatch.id)}`);
    } else if (brandMatch) {
      navigate(`/capinhas?marca=${encodeURIComponent(brandMatch.id)}`);
    } else {
      navigate(`/capinhas?q=${encodeURIComponent(query)}`);
    }
    setSearchOpen(false);
  }

  return (
    <>
      <header className={`site-header${scrolled ? ' is-scrolled' : ''}`}>
        <div className="header-main">
          <div className="container header-main-inner">
            <button
              type="button"
              className="icon-button header-menu-button"
              onClick={() => setMenuOpen(true)}
              aria-label="Abrir menu"
              aria-expanded={menuOpen}
            >
              <MenuIcon width={22} height={22} />
            </button>

            <Link to="/" className="header-logo" aria-label={`${site.fullName} — página inicial`}>
              <BrandLogo eager light />
            </Link>

            <form className="header-search" role="search" onSubmit={submitSearch}>
              <SearchIcon width={17} height={17} />
              <input
                type="search"
                value={term}
                onChange={(event) => setTerm(event.target.value)}
                placeholder="Buscar modelo ou marca"
                aria-label="Buscar modelo ou marca"
              />
            </form>

            <div className="header-actions">
              <ThemeToggle />

              <button
                type="button"
                className="icon-button header-search-toggle"
                onClick={() => setSearchOpen((value) => !value)}
                aria-label={searchOpen ? 'Fechar busca' : 'Abrir busca'}
                aria-expanded={searchOpen}
              >
                <SearchIcon width={20} height={20} />
              </button>

              <a
                className="header-whatsapp"
                href={buildGeneralWhatsAppUrl()}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Falar com a LS Case pelo WhatsApp"
                title="Falar no WhatsApp"
              >
                <WhatsAppIcon width={19} height={19} />
              </a>

              <Link
                to="/solicitacao"
                className="header-cart"
                aria-label={`Solicitação com ${requestCount} ${
                  requestCount === 1 ? 'capinha' : 'capinhas'
                }`}
              >
                <BagIcon width={19} height={19} />
                <span className="header-cart-label">Solicitação</span>
                {requestCount > 0 && <span className="header-cart-count">{requestCount}</span>}
              </Link>
            </div>
          </div>
        </div>

        <div className="header-sub">
          <div className="container header-sub-inner">
            <nav className="header-nav" aria-label="Navegação principal">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  className={({ isActive }) => `header-nav-link${isActive ? ' is-active' : ''}`}
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>

            <a
              className="header-support"
              href={buildGeneralWhatsAppUrl()}
              target="_blank"
              rel="noopener noreferrer"
            >
              <WhatsAppIcon width={15} height={15} />
              <span>Atendimento pelo WhatsApp</span>
              <strong>{site.whatsapp.display}</strong>
            </a>
          </div>
        </div>

        {searchOpen && (
          <div className="mobile-search">
            <form className="container mobile-search-form" role="search" onSubmit={submitSearch}>
              <SearchIcon width={18} height={18} />
              <input
                type="search"
                value={term}
                onChange={(event) => setTerm(event.target.value)}
                placeholder="Buscar modelo ou marca"
                aria-label="Buscar modelo ou marca"
                autoFocus
              />
              <button type="submit" className="btn btn-primary btn-small">
                Buscar
              </button>
            </form>
          </div>
        )}
      </header>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
