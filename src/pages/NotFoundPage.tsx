import { Link } from 'react-router-dom';
import { ArrowRightIcon } from '../components/Icons';
import { usePageMeta } from '../lib/usePageMeta';

export function NotFoundPage() {
  usePageMeta('Página não encontrada | LS Case by LS Celulares');

  return (
    <div className="container not-found">
      <p className="eyebrow">Erro 404</p>
      <h1>Esta página não existe.</h1>
      <p>Volte para a loja e encontre a capinha perfeita para o seu celular.</p>
      <div className="not-found-actions">
        <Link to="/" className="btn btn-primary">
          Ir para o início
          <ArrowRightIcon width={17} height={17} />
        </Link>
        <Link to="/capinhas" className="btn btn-outline">
          Ver capinhas
        </Link>
      </div>
    </div>
  );
}
