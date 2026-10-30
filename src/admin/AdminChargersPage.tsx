import {
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react';
import { PlusIcon, TrashIcon } from '../components/Icons';
import { formatChargerPrice, getChargerImageUrl, CHARGER_IMAGE_BUCKET } from '../lib/chargers';
import { supabase } from '../lib/supabase';
import { usePageMeta } from '../lib/usePageMeta';
import type { Charger } from '../types/chargers';
import {
  createChargerImagePath,
  validateChargerImage,
} from './chargerFiles';

interface ChargerForm {
  name: string;
  description: string;
  price: string;
}

const EMPTY_FORM: ChargerForm = {
  name: '',
  description: '',
  price: '',
};

function parsePrice(value: string): number | null {
  const cleaned = value.replace(/[^\d,.-]/g, '');
  const normalized = cleaned.includes(',')
    ? cleaned.replace(/\./g, '').replace(',', '.')
    : cleaned;
  const amount = Number(normalized);

  if (!Number.isFinite(amount) || amount < 0) return null;

  return Math.round(amount * 100);
}

function formatPriceInput(priceCents: number): string {
  return (priceCents / 100).toFixed(2).replace('.', ',');
}

export function AdminChargersPage() {
  usePageMeta('Gerenciar carregadores | Admin LS Case');

  const [chargers, setChargers] = useState<Charger[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ChargerForm>(EMPTY_FORM);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  async function loadChargers() {
    if (!supabase) {
      setError('Supabase não configurado.');
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error: queryError } = await supabase
      .from('chargers')
      .select('id, name, description, price_cents, image_path, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (queryError) {
      setError('Não foi possível carregar os carregadores.');
    } else {
      setChargers((data ?? []) as Charger[]);
    }
    setLoading(false);
  }

  useEffect(() => {
    void loadChargers();
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setFormOpen(false);
    setImageFile(null);
    setFormError(null);
    setPreviewUrl(null);
  }

  function openCreate() {
    resetForm();
    setFormOpen(true);
    setError(null);
    setNotice(null);
  }

  function openEdit(charger: Charger) {
    setEditingId(charger.id);
    setForm({
      name: charger.name,
      description: charger.description,
      price: formatPriceInput(charger.price_cents),
    });
    setImageFile(null);
    setPreviewUrl(null);
    setFormError(null);
    setFormOpen(true);
    setError(null);
    setNotice(null);
  }

  function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) return;

    const validation = validateChargerImage(file);
    if (validation) {
      setFormError(validation);
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setFormError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !supabase) return;

    const name = form.name.trim();
    const description = form.description.trim();
    const priceCents = parsePrice(form.price);

    if (!name || !description) {
      setFormError('Informe o nome e a descrição do carregador.');
      return;
    }

    if (priceCents === null) {
      setFormError('Informe um preço válido.');
      return;
    }

    if (!editingId && !imageFile) {
      setFormError('Selecione uma foto para o carregador.');
      return;
    }

    setBusy(true);
    setFormError(null);
    setError(null);
    setNotice(null);

    const editingCharger = editingId
      ? chargers.find((charger) => charger.id === editingId) ?? null
      : null;
    let uploadedPath: string | null = null;

    try {
      if (imageFile) {
        uploadedPath = createChargerImagePath(imageFile);
        const { error: uploadError } = await supabase.storage
          .from(CHARGER_IMAGE_BUCKET)
          .upload(uploadedPath, imageFile, {
            contentType: imageFile.type,
            cacheControl: '0',
            upsert: false,
          });

        if (uploadError) throw uploadError;
      }

      if (editingId) {
        const nextImagePath = uploadedPath ?? editingCharger?.image_path;
        if (!nextImagePath) throw new Error('Imagem atual não encontrada.');

        const { data: updated, error: updateError } = await supabase
          .from('chargers')
          .update({
            name,
            description,
            price_cents: priceCents,
            image_path: nextImagePath,
          })
          .eq('id', editingId)
          .select('id');

        if (updateError) throw updateError;
        if (!updated || updated.length === 0) {
          throw new Error('Carregador não encontrado.');
        }

        if (uploadedPath && editingCharger?.image_path) {
          const { error: removeError } = await supabase.storage
            .from(CHARGER_IMAGE_BUCKET)
            .remove([editingCharger.image_path]);

          if (removeError) {
            setNotice('Carregador salvo, mas a foto antiga não pôde ser removida do Storage.');
          }
        }
      } else {
        if (!uploadedPath) throw new Error('Imagem obrigatória.');
        const { error: insertError } = await supabase.from('chargers').insert({
          name,
          description,
          price_cents: priceCents,
          image_path: uploadedPath,
        });

        if (insertError) throw insertError;
      }

      resetForm();
      setNotice(editingId ? 'Carregador atualizado.' : 'Carregador cadastrado.');
      await loadChargers();
    } catch {
      if (uploadedPath) {
        await supabase.storage.from(CHARGER_IMAGE_BUCKET).remove([uploadedPath]);
      }
      setFormError('Não foi possível salvar o carregador. Tente novamente.');
    } finally {
      setBusy(false);
    }
  }

  async function deleteCharger(charger: Charger) {
    if (!supabase || busy) return;
    if (!window.confirm(`Excluir o carregador "${charger.name}"? Essa ação não pode ser desfeita.`)) {
      return;
    }

    setBusy(true);
    setError(null);
    setNotice(null);

    const { data: deleted, error: deleteError } = await supabase
      .from('chargers')
      .delete()
      .eq('id', charger.id)
      .select('id');

    if (deleteError || !deleted || deleted.length === 0) {
      setError('Não foi possível excluir o carregador.');
      setBusy(false);
      return;
    }

    const { error: storageError } = await supabase.storage
      .from(CHARGER_IMAGE_BUCKET)
      .remove([charger.image_path]);

    await loadChargers();
    setBusy(false);

    if (storageError) {
      setError('Carregador excluído, mas a foto não pôde ser removida do Storage.');
    } else {
      setNotice('Carregador excluído.');
    }
  }

  const editingCharger = editingId
    ? chargers.find((charger) => charger.id === editingId) ?? null
    : null;
  const existingImageUrl = editingCharger
    ? getChargerImageUrl(editingCharger.image_path)
    : null;

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <p className="admin-eyebrow">Loja</p>
          <h1>Gerenciar Carregadores</h1>
          <p>Cadastre e atualize os carregadores exibidos na seção pública.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openCreate} disabled={busy}>
          <PlusIcon width={16} height={16} />
          Novo carregador
        </button>
      </div>

      {error && <div className="admin-alert admin-alert--error" role="alert">{error}</div>}
      {notice && <div className="admin-alert admin-alert--success" role="status">{notice}</div>}

      {formOpen && (
        <section className="admin-card" aria-labelledby="charger-form-title">
          <div className="admin-card-head">
            <div>
              <h2 id="charger-form-title">
                {editingId ? 'Editar carregador' : 'Cadastrar carregador'}
              </h2>
              <p>Preencha os dados e envie uma foto do produto.</p>
            </div>
          </div>

          <form className="admin-charger-form" onSubmit={(event) => void handleSubmit(event)}>
            <div className="admin-charger-form-fields">
              <label className="field admin-field">
                <span className="field-label">Nome</span>
                <input
                  type="text"
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  maxLength={120}
                  required
                  disabled={busy}
                />
              </label>

              <label className="field admin-field">
                <span className="field-label">Preço (R$)</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={form.price}
                  onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))}
                  placeholder="0,00"
                  required
                  disabled={busy}
                />
              </label>

              <label className="field admin-field admin-charger-form-description">
                <span className="field-label">Descrição</span>
                <textarea
                  value={form.description}
                  onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                  rows={4}
                  maxLength={2000}
                  required
                  disabled={busy}
                />
              </label>

              <div className="field admin-field admin-charger-form-photo">
                <span className="field-label">Foto</span>
                <div className="admin-charger-photo-row">
                  <div className="admin-charger-photo-preview">
                    {previewUrl ? (
                      <img src={previewUrl} alt="Prévia da nova foto" />
                    ) : existingImageUrl ? (
                      <img src={existingImageUrl} alt={editingCharger?.name ?? 'Carregador'} />
                    ) : (
                      <span>Sem foto</span>
                    )}
                  </div>
                  <label className="admin-catalog-upload admin-charger-upload">
                    <span>
                      <strong>{imageFile ? 'Trocar foto' : 'Selecionar foto'}</strong>
                      <small>JPEG, PNG ou WebP · até 10 MB</small>
                    </span>
                    <input
                      type="file"
                      className="sr-only"
                      accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                      onChange={handleFile}
                      disabled={busy}
                    />
                  </label>
                </div>
              </div>
            </div>

            {formError && <p className="admin-alert admin-alert--error" role="alert">{formError}</p>}

            <div className="admin-charger-form-actions">
              <button type="button" className="admin-button-secondary" onClick={resetForm} disabled={busy}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" disabled={busy}>
                {busy ? 'Salvando...' : editingId ? 'Salvar alterações' : 'Cadastrar carregador'}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="admin-card" aria-labelledby="chargers-list-title">
        <div className="admin-card-head">
          <div>
            <h2 id="chargers-list-title">Carregadores cadastrados</h2>
            <p>{loading ? 'Carregando...' : `${chargers.length} item(ns)`}</p>
          </div>
          <button type="button" className="admin-button-secondary" onClick={() => void loadChargers()} disabled={busy}>
            Atualizar
          </button>
        </div>

        {loading ? (
          <div className="admin-loading-inline" role="status">Carregando carregadores...</div>
        ) : chargers.length === 0 ? (
          <div className="admin-empty">
            <span className="admin-empty-mark" aria-hidden="true">0</span>
            <h3>Nenhum carregador cadastrado</h3>
            <p>Cadastre o primeiro carregador para exibi-lo no site.</p>
          </div>
        ) : (
          <div className="admin-chargers-grid">
            {chargers.map((charger) => {
              const imageUrl = getChargerImageUrl(charger.image_path);

              return (
                <article key={charger.id} className="admin-charger-item">
                  <div className="admin-charger-item-media">
                    {imageUrl ? (
                      <img src={imageUrl} alt={charger.name} />
                    ) : (
                      <span>Imagem indisponível</span>
                    )}
                  </div>
                  <div className="admin-charger-item-body">
                    <strong>{charger.name}</strong>
                    <p>{charger.description}</p>
                    <span className="admin-charger-item-price">
                      {formatChargerPrice(charger.price_cents)}
                    </span>
                  </div>
                  <div className="admin-charger-item-actions">
                    <button
                      type="button"
                      className="admin-catalog-action"
                      onClick={() => openEdit(charger)}
                      disabled={busy}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className="admin-catalog-action admin-catalog-action--danger"
                      onClick={() => void deleteCharger(charger)}
                      disabled={busy}
                    >
                      <TrashIcon width={13} height={13} />
                      Excluir
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
