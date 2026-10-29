import { Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { CheckIcon, CloseIcon } from './Icons';

export function Toast() {
  const { toast, dismissToast, requestCount } = useStore();

  if (!toast) return null;

  return (
    <div className="toast" role="status" aria-live="polite" key={toast.id}>
      <span className="toast-icon" aria-hidden="true">
        <CheckIcon width={16} height={16} />
      </span>
      <span className="toast-message">{toast.message}</span>
      {requestCount > 0 && (
        <Link to="/solicitacao" className="toast-link" onClick={dismissToast}>
          Ver solicitação
        </Link>
      )}
      <button type="button" className="toast-close" onClick={dismissToast} aria-label="Fechar aviso">
        <CloseIcon width={16} height={16} />
      </button>
    </div>
  );
}
