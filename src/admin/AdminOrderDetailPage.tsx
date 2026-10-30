import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowRightIcon, WhatsAppIcon } from '../components/Icons';
import { supabase } from '../lib/supabase';
import { usePageMeta } from '../lib/usePageMeta';
import { formatDateTime, shortOrderId } from './format';
import { formatOrderItemLabel, resolveOrderItem } from './orderItems';
import {
  STATUS_OPTIONS,
  getStatusLabel,
  getStatusTone,
} from './orderStatus';
import type { AdminOrder, AdminOrderImage } from './types';
import type { OrderStatus } from '../types/orders';
import { buildAdminWhatsAppUrl } from './whatsapp';

function imageKindLabel(kind: AdminOrderImage['kind']): string {
  if (kind === 'composition') return 'Composição final';
  if (kind === 'original') return 'Fotografia original';
  return 'Referência';
}

function formatDesignMetadata(metadata: AdminOrderImage['metadata']): string | null {
  if (!metadata) return null;

  const placement = metadata.placement as
    | { x?: number; y?: number; scale?: number; rotation?: number }
    | undefined;
  const version = typeof metadata.manifestVersion === 'string' ? metadata.manifestVersion : null;

  if (!placement && !version) return null;

  const parts: string[] = [];

  if (version) parts.push(`Mockup v${version}`);

  if (placement) {
    const x = typeof placement.x === 'number' ? placement.x.toFixed(2) : '0.00';
    const y = typeof placement.y === 'number' ? placement.y.toFixed(2) : '0.00';
    const scale = typeof placement.scale === 'number' ? Math.round(placement.scale * 100) : 100;
    const rotation = typeof placement.rotation === 'number' ? placement.rotation : 0;
    parts.push(`posição ${x}/${y} · zoom ${scale}% · rotação ${rotation}°`);
  }

  return parts.join(' · ');
}

export function AdminOrderDetailPage() {
  usePageMeta('Detalhes do pedido | Admin LS Case');
  const { orderId = '' } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<AdminOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusSaving, setStatusSaving] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [imageErrors, setImageErrors] = useState<Record<string, string>>({});

  const loadImages = useCallback(async (images: AdminOrderImage[]) => {
    if (!supabase || images.length === 0) return;

    const { data, error: signedError } = await supabase.storage
      .from('order-images')
      .createSignedUrls(images.map((image) => image.storage_path), 600);

    if (signedError) {
      const message = 'Não foi possível gerar os links temporários das imagens.';
      setImageErrors(Object.fromEntries(images.map((image) => [image.storage_path, message])));
      return;
    }

    const urls: Record<string, string> = {};
    const failures: Record<string, string> = {};

    for (const item of data ?? []) {
      if (!item.path) continue;

      if (item.signedUrl) {
        urls[item.path] = item.signedUrl;
      } else {
        failures[item.path] = 'Não foi possível carregar esta imagem.';
      }
    }

    setSignedUrls(urls);
    setImageErrors(failures);
  }, []);

  const loadOrder = useCallback(async () => {
    if (!supabase) {
      setError('Supabase não configurado.');
      setLoading(false);
      return;
    }

    if (!orderId) {
      setError('Pedido não informado.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: queryError } = await supabase
      .from('orders')
      .select('id, created_at, updated_at, customer_name, customer_contact, status, notes, order_items(*), order_images(*)')
      .eq('id', orderId)
      .single();

    if (queryError) {
      setError('Pedido não encontrado ou sem permissão para consultá-lo.');
      setLoading(false);
      return;
    }

    const nextOrder = data as AdminOrder;
    setOrder(nextOrder);
    setLoading(false);
    await loadImages(nextOrder.order_images ?? []);
  }, [loadImages, orderId]);

  useEffect(() => {
    void loadOrder();
  }, [loadOrder]);

  async function updateStatus(nextStatus: OrderStatus) {
    if (!supabase || !order || statusSaving) return;

    setStatusSaving(true);
    setStatusError(null);
    setStatusNotice(null);

    const { data, error: updateError } = await supabase
      .from('orders')
      .update({ status: nextStatus })
      .eq('id', order.id)
      .select('id, status, updated_at')
      .single();

    if (updateError) {
      setStatusError('Não foi possível atualizar a situação. Tente novamente.');
      setStatusSaving(false);
      return;
    }

    setOrder((current) => current
      ? { ...current, status: data.status as OrderStatus, updated_at: data.updated_at }
      : current);
    setStatusNotice('Situação atualizada com sucesso.');
    setStatusSaving(false);
  }

  async function deleteOrder() {
    if (!supabase || !order || deleting) return;

    setDeleting(true);
    setDeleteError(null);

    try {
      const paths = (order.order_images ?? []).map((image) => image.storage_path);

      const { data, error: deleteOrderError } = await supabase.rpc('admin_delete_order', {
        p_order_id: order.id,
      });

      if (deleteOrderError) throw deleteOrderError;
      if (data !== true) throw new Error('Pedido não encontrado.');

      let storageWarning = false;

      if (paths.length > 0) {
        const { error: storageError } = await supabase.storage
          .from('order-images')
          .remove(paths);

        storageWarning = Boolean(storageError);
      }

      navigate('/admin/pedidos', {
        replace: true,
        state: {
          adminNotice: storageWarning
            ? 'Pedido, itens e referências excluídos; alguns arquivos não puderam ser removidos do Storage.'
            : 'Pedido, itens e arquivos excluídos.',
        },
      });
    } catch {
      setDeleteError(
        'A exclusão foi interrompida. Revise o pedido no painel e tente novamente.',
      );
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-loading-inline" role="status">Carregando pedido...</div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="admin-page">
        <div className="admin-alert admin-alert--error" role="alert">
          {error ?? 'Pedido não encontrado.'}
        </div>
        <Link to="/admin/pedidos" className="admin-inline-link">
          Voltar para pedidos
          <ArrowRightIcon width={14} height={14} />
        </Link>
      </div>
    );
  }

  const items = order.order_items ?? [];
  const images = order.order_images ?? [];
  const whatsappUrl = buildAdminWhatsAppUrl(order.customer_name, order.customer_contact);

  return (
    <div className="admin-page">
      <nav className="admin-breadcrumb" aria-label="Você está aqui">
        <Link to="/admin">Dashboard</Link>
        <span>/</span>
        <Link to="/admin/pedidos">Pedidos</Link>
        <span>/</span>
        <span aria-current="page">{shortOrderId(order.id)}</span>
      </nav>

      <div className="admin-detail-head">
        <div>
          <p className="admin-eyebrow">Detalhes do pedido</p>
          <h1>{order.customer_name?.trim() || 'Cliente sem nome'}</h1>
          <p className="admin-detail-subtitle">
            Pedido <strong>{order.id}</strong> · {formatDateTime(order.created_at)}
          </p>
        </div>

        <div className="admin-detail-actions">
          {whatsappUrl ? (
            <a
              href={whatsappUrl}
              className="admin-whatsapp-button"
              target="_blank"
              rel="noopener noreferrer"
            >
              <WhatsAppIcon width={18} height={18} />
              Conversar com cliente no WhatsApp
            </a>
          ) : (
            <button
              type="button"
              className="admin-whatsapp-button admin-whatsapp-button--disabled"
              disabled
              title="Número de WhatsApp ausente ou inválido."
            >
              <WhatsAppIcon width={18} height={18} />
              WhatsApp indisponível
            </button>
          )}
          {!whatsappUrl && (
            <p className="admin-detail-hint">Número de contato ausente ou inválido.</p>
          )}
        </div>
      </div>

      <div className="admin-detail-grid">
        <section className="admin-card" aria-labelledby="admin-customer-title">
          <div className="admin-card-head">
            <div>
              <h2 id="admin-customer-title">Cliente</h2>
              <p>Dados informados no pedido.</p>
            </div>
          </div>
          <dl className="admin-data-list">
            <div>
              <dt>Nome</dt>
              <dd>{order.customer_name?.trim() || 'Não informado'}</dd>
            </div>
            <div>
              <dt>WhatsApp</dt>
              <dd>{order.customer_contact?.trim() || 'Não informado'}</dd>
            </div>
            <div>
              <dt>Recebido em</dt>
              <dd>{formatDateTime(order.created_at)}</dd>
            </div>
            <div>
              <dt>Situação</dt>
              <dd>
                <span className={`admin-status ${getStatusTone(order.status)}`}>
                  {getStatusLabel(order.status)}
                </span>
              </dd>
            </div>
          </dl>
        </section>

        <section className="admin-card" aria-labelledby="admin-status-title">
          <div className="admin-card-head">
            <div>
              <h2 id="admin-status-title">Andamento</h2>
              <p>Atualize a situação após confirmar a gravação.</p>
            </div>
          </div>

          <label className="field admin-field">
            <span className="field-label">Situação do pedido</span>
            <select
              className="select-field"
              value={order.status}
              onChange={(event) => void updateStatus(event.target.value as OrderStatus)}
              disabled={statusSaving}
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>

          {statusSaving && <p className="admin-detail-hint">Salvando situação...</p>}
          {statusError && <p className="admin-alert admin-alert--error" role="alert">{statusError}</p>}
          {statusNotice && <p className="admin-alert admin-alert--success" role="status">{statusNotice}</p>}
        </section>

        <section className="admin-card admin-card--wide" aria-labelledby="admin-items-title">
          <div className="admin-card-head">
            <div>
              <h2 id="admin-items-title">Modelos selecionados</h2>
              <p>Itens registrados neste pedido.</p>
            </div>
          </div>
          {items.length === 0 ? (
            <p className="admin-muted">Nenhum item registrado.</p>
          ) : (
            <ul className="admin-item-list">
              {items.map((item) => {
                const { brandName, modelName } = resolveOrderItem(item);

                return (
                  <li key={item.id} className="admin-item">
                    <div>
                      <span className="admin-item-brand">{brandName}</span>
                      <strong>{modelName}</strong>
                    </div>
                    <span className="admin-item-qty">×{item.quantity}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="admin-card" aria-labelledby="admin-notes-title">
          <div className="admin-card-head">
            <div>
              <h2 id="admin-notes-title">Observações</h2>
              <p>Informações enviadas pelo cliente.</p>
            </div>
          </div>
          <p className="admin-notes">{order.notes?.trim() || 'Nenhuma observação enviada.'}</p>
        </section>

        <section className="admin-card admin-card--wide" aria-labelledby="admin-images-title">
          <div className="admin-card-head">
            <div>
              <h2 id="admin-images-title">Fotografias e composições</h2>
              <p>Links temporários gerados a partir do bucket privado. Cada arquivo indica o item correspondente.</p>
            </div>
          </div>

          {images.length === 0 ? (
            <p className="admin-muted">Nenhuma imagem anexada.</p>
          ) : (
            <div className="admin-image-grid">
              {images.map((image) => {
                const signedUrl = signedUrls[image.storage_path];
                const imageError = imageErrors[image.storage_path];
                const linkedItem = items.find((item) => item.id === image.order_item_id);
                const design = formatDesignMetadata(image.metadata);

                return (
                  <div key={image.id} className="admin-image-card">
                    {signedUrl ? (
                      <a
                        href={signedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="admin-image-link"
                        aria-label={`Abrir ${image.file_name ?? 'imagem'}`}
                      >
                        <img src={signedUrl} alt={image.file_name ?? 'Imagem do pedido'} />
                      </a>
                    ) : (
                      <div className="admin-image-error" role="alert">
                        {imageError ?? 'Carregando imagem...'}
                      </div>
                    )}
                    <span className="admin-image-kind">{imageKindLabel(image.kind)}</span>
                    <span className="admin-image-name">{image.file_name ?? 'Imagem'}</span>
                    <span className="admin-image-meta">
                      {linkedItem ? formatOrderItemLabel(linkedItem) : 'Sem item vinculado'}
                    </span>
                    {design && <span className="admin-image-meta">{design}</span>}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="admin-card admin-card--wide admin-danger-zone" aria-labelledby="admin-delete-title">
          <div className="admin-card-head">
            <div>
              <h2 id="admin-delete-title">Excluir pedido</h2>
              <p>Esta ação remove o pedido, os itens e as referências de imagens.</p>
            </div>
          </div>

          {!confirmDelete ? (
            <button
              type="button"
              className="admin-danger-button"
              onClick={() => setConfirmDelete(true)}
              disabled={deleting}
            >
              Excluir este pedido
            </button>
          ) : (
            <div className="admin-confirm-delete" role="alertdialog" aria-labelledby="admin-confirm-delete-title">
              <p id="admin-confirm-delete-title">
                Tem certeza? O pedido e seus dados serão removidos permanentemente.
              </p>
              <div className="admin-confirm-delete-actions">
                <button
                  type="button"
                  className="admin-danger-button"
                  onClick={() => void deleteOrder()}
                  disabled={deleting}
                >
                  {deleting ? 'Excluindo...' : 'Confirmar exclusão'}
                </button>
                <button
                  type="button"
                  className="admin-button-secondary"
                  onClick={() => setConfirmDelete(false)}
                  disabled={deleting}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {deleteError && (
            <p className="admin-alert admin-alert--error" role="alert">{deleteError}</p>
          )}
        </section>
      </div>
    </div>
  );
}
