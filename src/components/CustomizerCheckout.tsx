import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { getBrandForModel } from '../data/catalog';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import {
  buildOrderItems,
  clearIdempotencyKey,
  createStoragePath,
  getOrCreateIdempotencyKey,
  submitOrder,
  validateOrderForm,
  validateOrderImages,
  type OrderSubmissionResult,
} from '../lib/orderForm';
import type { CustomizerImage, CustomizerDevice, Placement } from '../customizer/types';
import { exportComposition } from '../customizer/exportComposition';
import { ArrowRightIcon, CheckIcon, ShieldIcon } from './Icons';
import { Modal } from './Modal';

interface CustomizerCheckoutProps {
  open: boolean;
  device: CustomizerDevice;
  image: CustomizerImage;
  placement: Placement;
  onClose: () => void;
}

async function functionErrorMessage(error: unknown): Promise<string> {
  const context = (error as { context?: Response } | null)?.context;

  if (context) {
    try {
      const body = await context.json() as { error?: string };
      if (body?.error) return body.error;
    } catch {
      // Mantém a mensagem genérica abaixo.
    }
  }

  return error instanceof Error && error.message
    ? error.message
    : 'Não foi possível enviar o pedido.';
}

export function CustomizerCheckout({
  open,
  device,
  image,
  placement,
  onClose,
}: CustomizerCheckoutProps) {
  const [customerName, setCustomerName] = useState('');
  const [customerContact, setCustomerContact] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [completedOrder, setCompletedOrder] = useState<string | null>(null);
  const [idempotencyKey] = useState(() => getOrCreateIdempotencyKey(
    typeof window === 'undefined' ? null : window.sessionStorage,
  ));

  const configError = !isSupabaseConfigured ? 'Integração Supabase não configurada.' : null;

  function close() {
    if (!submitting) onClose();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitting || completedOrder) return;

    const client = supabase;

    if (!client) {
      setError(configError ?? 'Integração Supabase não configurada.');
      return;
    }

    const originalFile = image.blob instanceof File
      ? image.blob
      : new File([image.blob], image.name, { type: image.type });

    const errors = validateOrderForm({
      customerName,
      customerContact,
      notes,
      items: [{ modelId: device.id, quantity: 1 }],
      images: [originalFile],
    });

    if (Object.keys(errors).length > 0) {
      setError(errors.customerName ?? errors.customerContact ?? errors.notes ?? errors.images ?? 'Revise os dados.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setProgress('Gerando composição final...');

    try {
      const result = await exportComposition(device, image.url, placement);
      const finalFile = new File([result.blob], result.fileName, { type: 'image/png' });

      const files = [originalFile, finalFile];
      const fileError = validateOrderImages(files);

      if (fileError) {
        setError(fileError);
        return;
      }

      const brand = getBrandForModel(device.id);
      const items = buildOrderItems([{ modelId: device.id, quantity: 1 }]);
      const metadata = {
        modelId: device.id,
        brandId: brand?.id ?? null,
        brandName: brand?.name ?? device.brand,
        modelName: device.model,
        mockupId: device.id,
        manifestVersion: device.version,
        placement: { ...placement },
      };

      const orderResult: OrderSubmissionResult = await submitOrder<File>(
        {
          customerName,
          customerContact,
          notes,
          items,
          images: files,
          imageMeta: [
            {
              modelId: device.id,
              kind: 'original',
              metadata: { ...metadata, imageRole: 'original', fileName: originalFile.name },
            },
            {
              modelId: device.id,
              kind: 'composition',
              metadata: {
                ...metadata,
                imageRole: 'composition',
                fileName: finalFile.name,
                originalFileName: originalFile.name,
              },
            },
          ],
          idempotencyKey,
        },
        {
          createOrder: async (payload) => {
            const { data, error: invokeError } = await client.functions.invoke<{
              orderId?: string;
              uploadToken?: string | null;
            }>('create-order', { body: payload });

            if (invokeError) throw new Error(await functionErrorMessage(invokeError));
            if (!data?.orderId) throw new Error('O servidor não retornou o código do pedido.');

            return {
              orderId: data.orderId,
              uploadToken: data.uploadToken ?? null,
            };
          },
          uploadImage: async (path, file) => {
            const { error: uploadError } = await client.storage
              .from('order-images')
              .upload(path, file, { contentType: file.type, upsert: false });

            if (uploadError) throw uploadError;
          },
          attachImages: async (orderId, attachedImages) => {
            const { error: attachError } = await client.rpc('attach_order_images', {
              p_order_id: orderId,
              p_images: attachedImages,
            });

            if (attachError) throw attachError;
          },
          makePath: (orderId, uploadToken, file) => createStoragePath(orderId, uploadToken, file),
          releaseUploadToken: async (orderId, uploadToken) => {
            const { error: releaseError } = await client.rpc('release_order_upload_token', {
              p_order_id: orderId,
              p_token: uploadToken,
            });

            if (releaseError) throw releaseError;
          },
          onProgress: (current, total) => {
            setProgress(`Enviando ${current} de ${total} arquivos...`);
          },
        },
      );

      if (orderResult.failedImages.length > 0 || orderResult.attachError) {
        setError(
          `O pedido ${orderResult.orderId.slice(0, 8)} foi criado, mas alguns arquivos não foram registrados. ${orderResult.attachError ?? 'Tente novamente ou fale com o atendimento.'}`,
        );
        return;
      }

      clearIdempotencyKey(window.sessionStorage);
      setCompletedOrder(orderResult.orderId);
      setProgress(null);
    } catch (submitError) {
      setError(await functionErrorMessage(submitError));
      setProgress(null);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title={completedOrder ? 'Pedido recebido' : 'Finalizar pedido'}
      size="sm"
    >
      {completedOrder ? (
        <div className="customizer-checkout-success">
          <span className="order-success-icon" aria-hidden="true">
            <CheckIcon width={24} height={24} />
          </span>
          <h3>Pedido enviado</h3>
          <p>Guarde o código abaixo para falar com a LS Case.</p>
          <code>{completedOrder}</code>
          <p className="customizer-checkout-hint">
            A fotografia original e a composição final foram vinculadas a este pedido.
          </p>
          <Link to="/" className="btn btn-primary btn-block" onClick={onClose}>
            Voltar para a loja
            <ArrowRightIcon width={16} height={16} />
          </Link>
          <button type="button" className="btn btn-outline btn-block" onClick={onClose}>
            Continuar no personalizador
          </button>
        </div>
      ) : (
        <form className="customizer-checkout-form" onSubmit={handleSubmit} noValidate>
          <div className="customizer-checkout-summary">
            <span className="eyebrow">Sua capinha</span>
            <strong>{device.brand} {device.model}</strong>
            <span>{image.name}</span>
          </div>

          <label className="field order-field">
            <span className="field-label">Nome *</span>
            <input
              type="text"
              value={customerName}
              onChange={(event) => setCustomerName(event.target.value)}
              autoComplete="name"
              maxLength={120}
              disabled={submitting}
            />
          </label>

          <label className="field order-field">
            <span className="field-label">Telefone ou WhatsApp *</span>
            <input
              type="tel"
              value={customerContact}
              onChange={(event) => setCustomerContact(event.target.value)}
              autoComplete="tel"
              placeholder="(24) 99999-9999"
              maxLength={80}
              disabled={submitting}
            />
          </label>

          <label className="field order-field">
            <span className="field-label">Observações (opcional)</span>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              maxLength={1000}
              rows={3}
              disabled={submitting}
            />
          </label>

          {configError && <p className="order-form-notice" role="status">{configError}</p>}
          {progress && <p className="customizer-checkout-hint" role="status">{progress}</p>}
          {error && <p className="form-error" role="alert">{error}</p>}

          <button type="submit" className="btn btn-primary btn-block" disabled={submitting || Boolean(configError)}>
            {submitting ? 'Enviando pedido...' : 'Enviar pedido'}
            {!submitting && <ArrowRightIcon width={17} height={17} />}
          </button>

          <p className="customizer-checkout-security">
            <ShieldIcon width={14} height={14} />
            A fotografia original e a composição final serão enviadas para o armazenamento privado.
          </p>
        </form>
      )}
    </Modal>
  );
}
