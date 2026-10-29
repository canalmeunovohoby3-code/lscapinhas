import {
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react';
import { Link } from 'react-router-dom';
import { getBrandForModel, getModelById } from '../data/catalog';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import {
  MAX_IMAGES,
  buildOrderItems,
  clearIdempotencyKey,
  createStoragePath,
  getOrCreateIdempotencyKey,
  submitOrder,
  validateOrderForm,
  validateOrderImages,
  type OrderFormErrors,
  type OrderSubmissionResult,
} from '../lib/orderForm';
import { pluralize } from '../lib/format';
import { useStore } from '../context/StoreContext';
import { ArrowRightIcon, ShieldIcon, SmartphoneIcon, TrashIcon } from './Icons';

interface OrderFormProps {
  onCompleted: (result: OrderSubmissionResult) => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function getFunctionErrorMessage(error: unknown): Promise<string> {
  const context = (error as { context?: Response } | null)?.context;

  if (context) {
    try {
      const body = await context.json() as { error?: string };
      if (body?.error) return body.error;
    } catch {
      // Mantém a mensagem genérica abaixo.
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'Não foi possível enviar o pedido. Tente novamente.';
}

export function OrderForm({ onCompleted }: OrderFormProps) {
  const { requestItems, requestNotes, setRequestNotes } = useStore();
  const [customerName, setCustomerName] = useState('');
  const [customerContact, setCustomerContact] = useState('');
  const [notes, setNotes] = useState(requestNotes);
  const [files, setFiles] = useState<File[]>([]);
  const [fieldErrors, setFieldErrors] = useState<OrderFormErrors>({});
  const [fileError, setFileError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [partialResult, setPartialResult] = useState<OrderSubmissionResult | null>(null);
  const submittingRef = useRef(false);
  const [idempotencyKey] = useState(() => getOrCreateIdempotencyKey(
    typeof window === 'undefined' ? null : window.sessionStorage,
  ));

  const configError = !isSupabaseConfigured
    ? 'Integração Supabase não configurada. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.'
    : null;

  const resolvedItems = requestItems.flatMap((item) => {
    const model = getModelById(item.modelId);
    const brand = getBrandForModel(item.modelId);
    return model && brand ? [{ item, model, brand }] : [];
  });
  const totalUnits = requestItems.reduce((sum, item) => sum + item.quantity, 0);

  function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? []);
    event.target.value = '';

    if (selected.length === 0) return;

    const error = validateOrderImages(selected);

    if (error) {
      setFileError(error);
      return;
    }

    setFileError(null);
    setFiles(selected);
    setFieldErrors((current) => ({ ...current, images: undefined }));
  }

  function removeFile(index: number) {
    setFiles((current) => current.filter((_, fileIndex) => fileIndex !== index));
    setFileError(null);
    setFieldErrors((current) => ({ ...current, images: undefined }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submittingRef.current) return;

    setFormError(null);

    const trimmed = {
      customerName: customerName.trim(),
      customerContact: customerContact.trim(),
      notes: notes.trim(),
    };
    const errors = validateOrderForm({
      ...trimmed,
      items: requestItems,
      images: files,
    });

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      setFormError('Revise os campos destacados antes de enviar.');
      return;
    }

    const client = supabase;

    if (!client) {
      setFormError(
        'Integração Supabase não configurada. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.',
      );
      return;
    }

    let items: ReturnType<typeof buildOrderItems>;

    try {
      items = buildOrderItems(requestItems);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Revise os modelos selecionados.');
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    setProgress('Criando pedido...');

    try {
      const result = await submitOrder<File>({
        ...trimmed,
        items,
        images: files,
        idempotencyKey,
      }, {
        createOrder: async (payload) => {
          const { data, error } = await client.functions.invoke<{
            orderId?: string;
            uploadToken?: string | null;
          }>(
            'create-order',
            { body: payload },
          );

          if (error) {
            throw new Error(await getFunctionErrorMessage(error));
          }

          if (!data?.orderId) {
            throw new Error('O servidor não retornou o código do pedido.');
          }

          return {
            orderId: data.orderId,
            uploadToken: data.uploadToken ?? null,
          };
        },
        uploadImage: async (path, file) => {
          const { error } = await client.storage
            .from('order-images')
            .upload(path, file, {
              contentType: file.type,
              upsert: false,
            });

          if (error) throw error;
        },
        attachImages: async (orderId, images) => {
          const { error } = await client.rpc('attach_order_images', {
            p_order_id: orderId,
            p_images: images,
          });

          if (error) throw error;
        },
        makePath: (orderId, uploadToken, file) => (
          createStoragePath(orderId, uploadToken, file)
        ),
        releaseUploadToken: async (orderId, uploadToken) => {
          const { error } = await client.rpc('release_order_upload_token', {
            p_order_id: orderId,
            p_token: uploadToken,
          });

          if (error) throw error;
        },
        onProgress: (current, total) => {
          setProgress(`Enviando imagem ${current} de ${total}...`);
        },
      });

      if (result.failedImages.length > 0 || result.attachError) {
        setPartialResult(result);
        return;
      }

      clearIdempotencyKey(
        typeof window === 'undefined' ? null : window.sessionStorage,
      );
      onCompleted(result);
    } catch (error) {
      setFormError(await getFunctionErrorMessage(error));
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
      setProgress(null);
    }
  }

  async function releaseUploadAuthorization(orderId: string, uploadToken: string) {
    if (!supabase) return;

    try {
      await supabase.rpc('release_order_upload_token', {
        p_order_id: orderId,
        p_token: uploadToken,
      });
    } catch {
      // O token também expira sozinho; não invalidar o pedido por essa limpeza.
    }
  }

  async function retryPartialImages() {
    const client = supabase;
    const partial = partialResult;

    if (!client || !partial || !partial.uploadToken || submittingRef.current) return;

    submittingRef.current = true;
    setSubmitting(true);
    setProgress('Reenviando imagens pendentes...');

    try {
      let uploaded = [...partial.uploaded];
      let failedImages = [...partial.failedImages];
      let attachError = partial.attachError;

      if (attachError && uploaded.length > 0) {
        const { error } = await client.rpc('attach_order_images', {
          p_order_id: partial.orderId,
          p_images: uploaded,
        });

        if (error) throw error;
        attachError = null;
      }

      const failedFiles = files.filter((file) => failedImages.includes(file.name));
      const newUploads: typeof uploaded = [];

      for (const file of failedFiles) {
        const path = createStoragePath(partial.orderId, partial.uploadToken, file);

        try {
          const { error } = await client.storage
            .from('order-images')
            .upload(path, file, {
              contentType: file.type,
              upsert: false,
            });

          if (error) throw error;

          newUploads.push({
            path,
            fileName: file.name,
            contentType: file.type,
            sizeBytes: file.size,
          });
          failedImages = failedImages.filter((name) => name !== file.name);
        } catch {
          // A imagem continua na lista de falhas para uma próxima tentativa.
        }
      }

      if (newUploads.length > 0) {
        const { error } = await client.rpc('attach_order_images', {
          p_order_id: partial.orderId,
          p_images: newUploads,
        });

        if (error) {
          attachError = 'Algumas imagens foram enviadas, mas não puderam ser registradas.';
        }
      }

      uploaded = [...uploaded, ...newUploads];

      const next = {
        ...partial,
        uploaded,
        failedImages,
        attachError,
      };

      if (failedImages.length === 0 && !attachError) {
        await releaseUploadAuthorization(partial.orderId, partial.uploadToken);
        clearIdempotencyKey(
          typeof window === 'undefined' ? null : window.sessionStorage,
        );
        setPartialResult(null);
        onCompleted(next);
      } else {
        setPartialResult(next);
      }
    } catch (error) {
      setFormError(await getFunctionErrorMessage(error));
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
      setProgress(null);
    }
  }

  async function finishWithoutRetry() {
    if (!partialResult || submitting) return;

    if (partialResult.uploadToken) {
      await releaseUploadAuthorization(partialResult.orderId, partialResult.uploadToken);
    }

    clearIdempotencyKey(
      typeof window === 'undefined' ? null : window.sessionStorage,
    );
    const result = partialResult;
    setPartialResult(null);
    onCompleted(result);
  }

  return (
    <form className="order-form" onSubmit={handleSubmit} noValidate aria-busy={submitting}>
      <div className="order-form-layout">
        <div className="order-form-main">
          <section className="order-form-card" aria-labelledby="order-data-title">
            <div className="order-form-section-head">
              <h2 id="order-data-title">Seus dados</h2>
              <p>Usaremos apenas para identificar e atender o pedido.</p>
            </div>

            <div className="order-fields-grid">
              <label className="field order-field">
                <span className="field-label">Nome *</span>
                <input
                  type="text"
                  value={customerName}
                  onChange={(event) => {
                    setCustomerName(event.target.value);
                    setFieldErrors((current) => ({ ...current, customerName: undefined }));
                  }}
                  autoComplete="name"
                  maxLength={120}
                  disabled={submitting}
                  aria-invalid={Boolean(fieldErrors.customerName)}
                  aria-describedby={fieldErrors.customerName ? 'order-name-error' : undefined}
                />
                {fieldErrors.customerName && (
                  <span className="order-field-error" id="order-name-error">
                    {fieldErrors.customerName}
                  </span>
                )}
              </label>

              <label className="field order-field">
                <span className="field-label">Telefone ou WhatsApp *</span>
                <input
                  type="tel"
                  value={customerContact}
                  onChange={(event) => {
                    setCustomerContact(event.target.value);
                    setFieldErrors((current) => ({ ...current, customerContact: undefined }));
                  }}
                  autoComplete="tel"
                  placeholder="(24) 99999-9999"
                  maxLength={80}
                  disabled={submitting}
                  aria-invalid={Boolean(fieldErrors.customerContact)}
                  aria-describedby={
                    fieldErrors.customerContact ? 'order-contact-error' : undefined
                  }
                />
                {fieldErrors.customerContact && (
                  <span className="order-field-error" id="order-contact-error">
                    {fieldErrors.customerContact}
                  </span>
                )}
              </label>
            </div>

            <label className="field order-field">
              <span className="field-label">Observações (opcional)</span>
              <textarea
                value={notes}
                onChange={(event) => {
                  setNotes(event.target.value);
                  setRequestNotes(event.target.value);
                  setFieldErrors((current) => ({ ...current, notes: undefined }));
                }}
                placeholder="Ex.: quero a foto inteira, sem cortes."
                rows={4}
                maxLength={1000}
                disabled={submitting}
                aria-invalid={Boolean(fieldErrors.notes)}
                aria-describedby={fieldErrors.notes ? 'order-notes-error' : undefined}
              />
              {fieldErrors.notes && (
                <span className="order-field-error" id="order-notes-error">
                  {fieldErrors.notes}
                </span>
              )}
            </label>
          </section>

          <section className="order-form-card" aria-labelledby="order-images-title">
            <div className="order-form-section-head">
              <h2 id="order-images-title">Imagens de referência</h2>
              <p>Envie a foto ou arte que deseja usar. Você pode anexar até 12 imagens.</p>
            </div>

            <label className="order-file-drop" htmlFor="order-images">
              <span className="order-file-drop-icon" aria-hidden="true">
                <SmartphoneIcon width={22} height={22} />
              </span>
              <span>
                <strong>Selecionar imagens</strong>
                <small>JPEG, PNG ou WebP · até 10 MB cada</small>
              </span>
              <input
                id="order-images"
                type="file"
                className="sr-only"
                accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                multiple
                onChange={handleFiles}
                disabled={submitting}
                aria-describedby="order-images-hint"
              />
            </label>
            <p className="order-file-hint" id="order-images-hint">
              Máximo de {MAX_IMAGES} imagens. Nenhum arquivo é armazenado no site; o envio vai
              para o armazenamento privado do Supabase.
            </p>

            {(fileError || fieldErrors.images) && (
              <p className="order-field-error" role="alert">
                {fileError || fieldErrors.images}
              </p>
            )}

            {files.length > 0 && (
              <ul className="order-file-list">
                {files.map((file, index) => (
                  <li key={`${file.name}-${file.size}-${index}`} className="order-file-item">
                    <span className="order-file-name">{file.name}</span>
                    <span className="order-file-size">{formatFileSize(file.size)}</span>
                    <button
                      type="button"
                      className="order-file-remove"
                      onClick={() => removeFile(index)}
                      disabled={submitting}
                      aria-label={`Remover ${file.name}`}
                    >
                      <TrashIcon width={15} height={15} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {partialResult && (
            <section className="order-form-card order-partial" aria-labelledby="order-partial-title">
              <div className="order-form-section-head">
                <h2 id="order-partial-title">Pedido criado — imagens pendentes</h2>
                <p>
                  O pedido <code>{partialResult.orderId}</code> foi registrado. Algumas
                  imagens ainda precisam ser enviadas.
                </p>
              </div>

              {partialResult.failedImages.length > 0 && (
                <p className="order-partial-warning">
                  Não foi possível enviar: {partialResult.failedImages.join(', ')}.
                </p>
              )}
              {partialResult.attachError && (
                <p className="order-partial-warning">{partialResult.attachError}</p>
              )}

              <div className="order-partial-actions">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => void retryPartialImages()}
                  disabled={submitting}
                >
                  Tentar novamente imagens
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => void finishWithoutRetry()}
                  disabled={submitting}
                >
                  Continuar sem reenviar
                </button>
              </div>
            </section>
          )}

          {configError && (
            <p className="order-form-notice" role="status">
              {configError}
            </p>
          )}

          {formError && (
            <p className="form-error order-form-error" role="alert">
              {formError}
            </p>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-block btn-large order-submit"
            disabled={submitting || Boolean(configError) || Boolean(partialResult)}
            aria-busy={submitting}
          >
            {submitting ? progress ?? 'Enviando pedido...' : 'Enviar pedido'}
            {!submitting && <ArrowRightIcon width={18} height={18} />}
          </button>

          <p className="order-form-security">
            <ShieldIcon width={15} height={15} />
            Nenhum pagamento é feito neste site.
          </p>
        </div>

        <aside className="order-form-summary" aria-label="Resumo do pedido">
          <div className="order-summary-head">
            <h2>Resumo do pedido</h2>
            <p>
              {resolvedItems.length} {pluralize(resolvedItems.length, 'modelo', 'modelos')} ·{' '}
              {totalUnits} {pluralize(totalUnits, 'capinha', 'capinhas')}
            </p>
          </div>

          <ul className="order-summary-items">
            {resolvedItems.map(({ model, brand, item }) => (
              <li key={model.id} className="order-summary-item">
                <div>
                  <span className="order-summary-brand">{brand.shortName}</span>
                  <strong>{model.name}</strong>
                </div>
                <span className="order-summary-qty">×{item.quantity}</span>
              </li>
            ))}
          </ul>

          <Link to="/solicitacao" className="inline-link order-summary-edit">
            <ArrowRightIcon width={15} height={15} className="icon-flip" />
            Editar modelos
          </Link>

          <p className="order-summary-note">
            O valor e as condições de pagamento serão combinados no atendimento pelo WhatsApp.
          </p>
        </aside>
      </div>
    </form>
  );
}
