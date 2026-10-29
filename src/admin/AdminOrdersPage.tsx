import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRightIcon } from '../components/Icons';
import { supabase } from '../lib/supabase';
import { usePageMeta } from '../lib/usePageMeta';
import { formatDateTime, shortOrderId } from './format';
import {
  STATUS_OPTIONS,
  getStatusLabel,
  getStatusTone,
} from './orderStatus';
import type { AdminOrder } from './types';
import type { OrderStatus } from '../types/orders';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function AdminOrdersPage() {
  usePageMeta('Pedidos | Admin LS Case');
  const location = useLocation();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [notice] = useState<string | null>(() => {
    const state = location.state as { adminNotice?: string } | null;
    return state?.adminNotice ?? null;
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'' | OrderStatus>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const loadOrders = useCallback(async () => {
    if (!supabase) {
      setError('Supabase não configurado.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    let query = supabase
      .from('orders')
      .select('id, created_at, updated_at, customer_name, customer_contact, status, notes, order_items(*)')
      .order('created_at', { ascending: false });

    if (statusFilter) query = query.eq('status', statusFilter);
    if (dateFrom) query = query.gte('created_at', `${dateFrom}T00:00:00`);
    if (dateTo) query = query.lte('created_at', `${dateTo}T23:59:59`);

    const term = search.trim();

    if (term) {
      const safeTerm = term.replace(/[(),]/g, ' ').trim();
      if (safeTerm) {
        const filters = [
          `customer_name.ilike.%${safeTerm}%`,
          `customer_contact.ilike.%${safeTerm}%`,
        ];

        if (UUID_PATTERN.test(term)) {
          filters.push(`id.eq.${term}`);
        }

        query = query.or(filters.join(','));
      }
    }

    const { data, error: queryError } = await query;

    if (queryError) {
      setError('Não foi possível carregar os pedidos. Tente novamente.');
      setLoading(false);
      return;
    }

    setOrders((data ?? []) as AdminOrder[]);
    setLoading(false);
  }, [dateFrom, dateTo, search, statusFilter]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  function handleFilter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSearch(searchInput.trim());
  }

  function clearFilters() {
    setSearchInput('');
    setSearch('');
    setStatusFilter('');
    setDateFrom('');
    setDateTo('');
  }

  const hasFilters = Boolean(search || statusFilter || dateFrom || dateTo);

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <p className="admin-eyebrow">Atendimento</p>
          <h1>Pedidos</h1>
          <p>Consulte, filtre e acompanhe todos os pedidos recebidos.</p>
        </div>
      </div>

      <form className="admin-filter-bar" onSubmit={handleFilter}>
        <label className="field admin-field admin-filter-search">
          <span className="field-label">Buscar</span>
          <input
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Nome, WhatsApp ou código"
          />
        </label>

        <label className="field admin-field">
          <span className="field-label">Situação</span>
          <select
            className="select-field"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as '' | OrderStatus)}
          >
            <option value="">Todas</option>
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="field admin-field">
          <span className="field-label">De</span>
          <input
            type="date"
            value={dateFrom}
            onChange={(event) => setDateFrom(event.target.value)}
          />
        </label>

        <label className="field admin-field">
          <span className="field-label">Até</span>
          <input
            type="date"
            value={dateTo}
            onChange={(event) => setDateTo(event.target.value)}
          />
        </label>

        <div className="admin-filter-actions">
          <button type="submit" className="btn btn-primary">Filtrar</button>
          {hasFilters && (
            <button type="button" className="admin-button-secondary" onClick={clearFilters}>
              Limpar
            </button>
          )}
        </div>
      </form>

      {error && (
        <div className="admin-alert admin-alert--error" role="alert">
          {error}
        </div>
      )}

      {notice && (
        <div className="admin-alert admin-alert--success" role="status">
          {notice}
        </div>
      )}

      <section className="admin-card" aria-label="Lista de pedidos">
        <div className="admin-card-head">
          <div>
            <h2>Pedidos recebidos</h2>
            <p>{loading ? 'Carregando...' : `${orders.length} pedido(s) encontrado(s)`}</p>
          </div>
          <button type="button" className="admin-button-secondary" onClick={() => void loadOrders()}>
            Atualizar
          </button>
        </div>

        {loading ? (
          <div className="admin-loading-inline" role="status">
            Carregando pedidos...
          </div>
        ) : orders.length === 0 ? (
          <div className="admin-empty">
            <span className="admin-empty-mark" aria-hidden="true">0</span>
            <h3>Nenhum pedido encontrado</h3>
            <p>
              {hasFilters
                ? 'Ajuste os filtros para ampliar a busca.'
                : 'Quando um pedido for enviado pelo site, ele aparecerá aqui.'}
            </p>
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table admin-table--orders">
              <thead>
                <tr>
                  <th>Pedido</th>
                  <th>Cliente</th>
                  <th>WhatsApp</th>
                  <th>Data</th>
                  <th>Modelos</th>
                  <th>Situação</th>
                  <th aria-label="Ações" />
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const items = order.order_items ?? [];
                  return (
                    <tr key={order.id}>
                      <td>
                        <span className="admin-order-code" title={order.id}>
                          {shortOrderId(order.id)}
                        </span>
                      </td>
                      <td>
                        <strong>{order.customer_name?.trim() || 'Sem nome'}</strong>
                      </td>
                      <td className="admin-nowrap">{order.customer_contact?.trim() || '—'}</td>
                      <td className="admin-nowrap">{formatDateTime(order.created_at)}</td>
                      <td>
                        <span className="admin-models-cell">
                          {items.length > 0
                            ? items.map((item) => `${item.model_name} ×${item.quantity}`).join(', ')
                            : '—'}
                        </span>
                      </td>
                      <td>
                        <span className={`admin-status ${getStatusTone(order.status)}`}>
                          {getStatusLabel(order.status)}
                        </span>
                      </td>
                      <td className="admin-table-action">
                        <Link to={`/admin/pedidos/${order.id}`} className="admin-inline-link">
                          Ver detalhes
                          <ArrowRightIcon width={14} height={14} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
