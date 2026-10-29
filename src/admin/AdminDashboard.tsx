import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRightIcon } from '../components/Icons';
import { supabase } from '../lib/supabase';
import { usePageMeta } from '../lib/usePageMeta';
import { formatDateTime, shortOrderId } from './format';
import { getDashboardCounts, getStatusLabel, getStatusTone } from './orderStatus';
import type { AdminOrderSummary } from './types';

export function AdminDashboard() {
  usePageMeta('Dashboard | Admin LS Case');
  const [orders, setOrders] = useState<AdminOrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    if (!supabase) {
      setError('Supabase não configurado.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: queryError } = await supabase
      .from('orders')
      .select('id, created_at, customer_name, customer_contact, status')
      .order('created_at', { ascending: false });

    if (queryError) {
      setError('Não foi possível carregar o dashboard. Tente novamente.');
      setLoading(false);
      return;
    }

    setOrders((data ?? []) as AdminOrderSummary[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  const counts = getDashboardCounts(orders);
  const recentOrders = orders.slice(0, 6);

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <p className="admin-eyebrow">Visão geral</p>
          <h1>Dashboard</h1>
          <p>Acompanhe os pedidos recebidos e o andamento do atendimento.</p>
        </div>
        <button type="button" className="admin-button-secondary" onClick={() => void loadOrders()}>
          Atualizar
        </button>
      </div>

      {error && (
        <div className="admin-alert admin-alert--error" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <div className="admin-loading-inline" role="status">
          Carregando indicadores...
        </div>
      ) : (
        <>
          <div className="admin-stats">
            <div className="admin-stat admin-stat--total">
              <span className="admin-stat-label">Total de pedidos</span>
              <strong>{counts.total}</strong>
            </div>
            <div className="admin-stat admin-stat--new">
              <span className="admin-stat-label">Novos / pendentes</span>
              <strong>{counts.newOrders}</strong>
            </div>
            <div className="admin-stat admin-stat--service">
              <span className="admin-stat-label">Em atendimento</span>
              <strong>{counts.inService}</strong>
            </div>
            <div className="admin-stat admin-stat--done">
              <span className="admin-stat-label">Concluídos</span>
              <strong>{counts.completed}</strong>
            </div>
            <div className="admin-stat admin-stat--cancelled">
              <span className="admin-stat-label">Cancelados</span>
              <strong>{counts.cancelled}</strong>
            </div>
          </div>

          <section className="admin-card" aria-labelledby="recent-orders-title">
            <div className="admin-card-head">
              <div>
                <h2 id="recent-orders-title">Pedidos recentes</h2>
                <p>Os últimos pedidos registrados no banco.</p>
              </div>
              <Link to="/admin/pedidos" className="admin-inline-link">
                Ver todos
                <ArrowRightIcon width={15} height={15} />
              </Link>
            </div>

            {recentOrders.length === 0 ? (
              <div className="admin-empty">
                <span className="admin-empty-mark" aria-hidden="true">0</span>
                <h3>Nenhum pedido recebido ainda</h3>
                <p>Quando o primeiro pedido for enviado pelo site, ele aparecerá aqui.</p>
              </div>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Pedido</th>
                      <th>Cliente</th>
                      <th>Data</th>
                      <th>Situação</th>
                      <th aria-label="Ações" />
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((order) => (
                      <tr key={order.id}>
                        <td>
                          <span className="admin-order-code" title={order.id}>
                            {shortOrderId(order.id)}
                          </span>
                        </td>
                        <td>
                          <div className="admin-customer-cell">
                            <strong>{order.customer_name?.trim() || 'Sem nome'}</strong>
                            <span>{order.customer_contact?.trim() || 'Sem contato'}</span>
                          </div>
                        </td>
                        <td className="admin-nowrap">{formatDateTime(order.created_at)}</td>
                        <td>
                          <span className={`admin-status ${getStatusTone(order.status)}`}>
                            {getStatusLabel(order.status)}
                          </span>
                        </td>
                        <td className="admin-table-action">
                          <Link to={`/admin/pedidos/${order.id}`} className="admin-inline-link">
                            Detalhes
                            <ArrowRightIcon width={14} height={14} />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
