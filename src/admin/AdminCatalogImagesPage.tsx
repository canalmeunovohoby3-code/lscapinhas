import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
} from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckIcon, PlusIcon, TrashIcon } from '../components/Icons';
import { catalog } from '../data/catalog';
import {
  getCatalogImageUrl,
  type CatalogModelImage,
} from '../lib/catalogImages';
import { supabase } from '../lib/supabase';
import { usePageMeta } from '../lib/usePageMeta';
import {
  CATALOG_IMAGE_BUCKET,
  MAX_CATALOG_IMAGES,
  createCatalogImagePath,
  validateCatalogImageFiles,
} from './catalogImageFiles';
import {
  findCatalogSelection,
  groupCatalogImages,
  resolveInitialCatalogSelection,
  type CatalogImageSummary,
  type CatalogSelection,
} from './catalogSelection';

interface Replacement {
  image: CatalogModelImage;
  file: File;
  preview: string;
}

function CatalogImagePreview({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  if (failed) {
    return (
      <div className="admin-image-error" role="alert">
        <span>Não foi possível carregar a imagem.</span>
        <button
          type="button"
          className="admin-catalog-action"
          onClick={() => {
            setFailed(false);
            setAttempt((current) => current + 1);
          }}
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <img
      key={attempt}
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
    />
  );
}

export function AdminCatalogImagesPage() {
  usePageMeta('Fotos do catálogo | Admin LS Case');

  const [searchParams, setSearchParams] = useSearchParams();
  const initialSelection = findCatalogSelection(
    searchParams.get('marca'),
    searchParams.get('modelo'),
  );
  const [brandId, setBrandId] = useState(initialSelection.brandId);
  const [modelId, setModelId] = useState(initialSelection.modelId);
  const [images, setImages] = useState<CatalogModelImage[]>([]);
  const [summaries, setSummaries] = useState<CatalogImageSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [replacement, setReplacement] = useState<Replacement | null>(null);
  const [replacementError, setReplacementError] = useState<string | null>(null);

  const brand = catalog.brands.find((entry) => entry.id === brandId);
  const model = brand?.models.find((entry) => entry.id === modelId);

  const pendingPreviews = useMemo(
    () => pendingFiles.map((file) => URL.createObjectURL(file)),
    [pendingFiles],
  );

  useEffect(() => () => {
    pendingPreviews.forEach((url) => URL.revokeObjectURL(url));
  }, [pendingPreviews]);

  useEffect(() => () => {
    if (replacement) URL.revokeObjectURL(replacement.preview);
  }, [replacement]);

  const loadImages = useCallback(async () => {
    if (!supabase) {
      setError('Supabase não configurado.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: queryError } = await supabase
      .from('catalog_model_images')
      .select('id, brand_id, model_id, storage_path, alt_text, sort_order')
      .eq('brand_id', brandId)
      .eq('model_id', modelId)
      .order('sort_order', { ascending: true });

    if (queryError) {
      setError('Não foi possível carregar as fotos deste modelo.');
      setLoading(false);
      return;
    }

    setImages((data ?? []) as CatalogModelImage[]);
    setLoading(false);
  }, [brandId, modelId]);

  useEffect(() => {
    void loadImages();
  }, [loadImages]);

  const loadSummaries = useCallback(async () => {
    if (!supabase) return;

    const { data, error: summaryError } = await supabase
      .from('catalog_model_images')
      .select('brand_id, model_id, storage_path, sort_order')
      .order('sort_order', { ascending: true });

    if (summaryError) return;

    setSummaries(groupCatalogImages(data ?? []));
  }, []);

  useEffect(() => {
    void loadSummaries();
  }, [loadSummaries]);

  useEffect(() => {
    if (summaries.length === 0) return;
    if (searchParams.get('marca') || searchParams.get('modelo')) return;

    const first = resolveInitialCatalogSelection(null, null, summaries);
    setBrandId(first.brandId);
    setModelId(first.modelId);
    setSearchParams(
      { marca: first.brandId, modelo: first.modelId },
      { replace: true },
    );
  }, [searchParams, setSearchParams, summaries]);

  function applySelection(next: CatalogSelection) {
    setBrandId(next.brandId);
    setModelId(next.modelId);
    setSearchParams(
      { marca: next.brandId, modelo: next.modelId },
      { replace: true },
    );
    setPendingFiles([]);
    setFileError(null);
    setReplacement(null);
    setReplacementError(null);
    setNotice(null);
    setError(null);
  }

  function handleBrandChange(nextBrandId: string) {
    applySelection(findCatalogSelection(nextBrandId, null));
  }

  function handleModelChange(nextModelId: string) {
    applySelection(findCatalogSelection(brandId, nextModelId));
  }

  function handlePendingFiles(event: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? []);
    event.target.value = '';

    if (selected.length === 0) return;

    const validation = validateCatalogImageFiles(
      selected,
      images.length + pendingFiles.length,
    );

    if (validation) {
      setFileError(validation);
      return;
    }

    setFileError(null);
    setPendingFiles((current) => [...current, ...selected]);
  }

  function removePending(index: number) {
    setPendingFiles((current) => current.filter((_, fileIndex) => fileIndex !== index));
  }

  async function savePending() {
    if (!supabase || !model || pendingFiles.length === 0 || busy) return;

    setBusy(true);
    setError(null);
    setNotice(null);

    const uploadedPaths: string[] = [];

    try {
      const rows: Array<{
        brand_id: string;
        model_id: string;
        storage_path: string;
        alt_text: string;
        sort_order: number;
      }> = [];

      for (const [index, file] of pendingFiles.entries()) {
        const path = createCatalogImagePath(brandId, modelId, file);
        const { error: uploadError } = await supabase.storage
          .from(CATALOG_IMAGE_BUCKET)
          .upload(path, file, {
            contentType: file.type,
            upsert: false,
          });

        if (uploadError) throw uploadError;

        uploadedPaths.push(path);
        rows.push({
          brand_id: brandId,
          model_id: modelId,
          storage_path: path,
          alt_text: `Foto de capinha para ${model.name}`,
          sort_order: images.length + index,
        });
      }

      const { error: insertError } = await supabase
        .from('catalog_model_images')
        .insert(rows);

      if (insertError) throw insertError;

      setPendingFiles([]);
      setNotice(`${rows.length} foto(s) adicionada(s) ao modelo ${model.name}.`);
      await Promise.all([loadImages(), loadSummaries()]);
    } catch {
      if (uploadedPaths.length > 0) {
        await supabase.storage.from(CATALOG_IMAGE_BUCKET).remove(uploadedPaths);
      }
      setError('Não foi possível salvar as fotos. Tente novamente.');
    } finally {
      setBusy(false);
    }
  }

  async function removeImage(image: CatalogModelImage) {
    if (!supabase || busy) return;
    if (!window.confirm('Remover esta foto do modelo? Essa ação não pode ser desfeita.')) return;

    setBusy(true);
    setError(null);
    setNotice(null);

    try {
      const { error: storageError } = await supabase.storage
        .from(CATALOG_IMAGE_BUCKET)
        .remove([image.storage_path]);

      if (storageError) throw storageError;

      const { error: deleteError } = await supabase
        .from('catalog_model_images')
        .delete()
        .eq('id', image.id);

      if (deleteError) throw deleteError;

      setNotice('Foto removida.');
      await Promise.all([loadImages(), loadSummaries()]);
    } catch {
      setError('Não foi possível remover a foto. Tente novamente.');
    } finally {
      setBusy(false);
    }
  }

  function handleReplacementFile(
    image: CatalogModelImage,
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) return;

    const validation = validateCatalogImageFiles([file]);

    if (validation) {
      setReplacementError(validation);
      return;
    }

    setReplacementError(null);
    setReplacement({
      image,
      file,
      preview: URL.createObjectURL(file),
    });
  }

  async function confirmReplacement() {
    if (!supabase || !model || !replacement || busy) return;

    setBusy(true);
    setError(null);
    setNotice(null);
    setReplacementError(null);

    const oldImage = replacement.image;
    let newPath: string | null = null;

    try {
      newPath = createCatalogImagePath(brandId, modelId, replacement.file);

      const { error: uploadError } = await supabase.storage
        .from(CATALOG_IMAGE_BUCKET)
        .upload(newPath, replacement.file, {
          contentType: replacement.file.type,
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { error: insertError } = await supabase
        .from('catalog_model_images')
        .insert({
          brand_id: brandId,
          model_id: modelId,
          storage_path: newPath,
          alt_text: `Foto de capinha para ${model.name}`,
          sort_order: oldImage.sort_order,
        });

      if (insertError) throw insertError;

      const { error: storageDeleteError } = await supabase.storage
        .from(CATALOG_IMAGE_BUCKET)
        .remove([oldImage.storage_path]);

      const { error: rowDeleteError } = await supabase
        .from('catalog_model_images')
        .delete()
        .eq('id', oldImage.id);

      if (storageDeleteError || rowDeleteError) {
        setError(
          'A nova foto foi salva, mas a foto anterior não pôde ser removida completamente.',
        );
      } else {
        setNotice('Foto substituída.');
      }

      setReplacement(null);
      await Promise.all([loadImages(), loadSummaries()]);
    } catch {
      if (newPath) {
        await supabase.storage.from(CATALOG_IMAGE_BUCKET).remove([newPath]);
      }
      setError('Não foi possível substituir a foto. Tente novamente.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <p className="admin-eyebrow">Catálogo</p>
          <h1>Fotos dos modelos</h1>
          <p>Gerencie as imagens de capinhas exibidas no catálogo público.</p>
        </div>
      </div>

      {summaries.length > 0 && (
        <section className="admin-card admin-catalog-summary" aria-labelledby="catalog-summary-title">
          <div className="admin-card-head">
            <div>
              <h2 id="catalog-summary-title">Modelos com fotos</h2>
              <p>Abra um modelo abaixo para visualizar, substituir ou remover as fotos.</p>
            </div>
          </div>

          <div className="admin-catalog-summary-grid">
            {summaries.map((entry) => {
              const previewUrl = getCatalogImageUrl(entry.previewPath);
              const isActive = entry.brandId === brandId && entry.modelId === modelId;

              return (
                <button
                  key={`${entry.brandId}/${entry.modelId}`}
                  type="button"
                  className={`admin-catalog-summary-item${isActive ? ' is-active' : ''}`}
                  onClick={() => applySelection(entry)}
                >
                  <span className="admin-catalog-summary-thumb">
                    {previewUrl
                      ? <CatalogImagePreview src={previewUrl} alt={entry.modelName} />
                      : <span className="admin-catalog-summary-no-image">Sem prévia</span>}
                  </span>
                  <span className="admin-catalog-summary-copy">
                    <strong>{entry.brandName}</strong>
                    <span>{entry.modelName}</span>
                  </span>
                  <span className="admin-catalog-summary-count">{entry.count}</span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      <section className="admin-card admin-catalog-selector" aria-labelledby="catalog-model-title">
        <div className="admin-card-head">
          <div>
            <h2 id="catalog-model-title">Selecionar modelo</h2>
            <p>As fotos são associadas à marca e ao modelo exatos.</p>
          </div>
        </div>

        <div className="admin-catalog-fields">
          <label className="field admin-field">
            <span className="field-label">Marca</span>
            <select
              className="select-field"
              value={brandId}
              onChange={(event) => handleBrandChange(event.target.value)}
              disabled={busy}
            >
              {catalog.brands.map((entry) => (
                <option key={entry.id} value={entry.id}>{entry.shortName}</option>
              ))}
            </select>
          </label>

          <label className="field admin-field">
            <span className="field-label">Modelo</span>
            <select
              className="select-field"
              value={modelId}
              onChange={(event) => handleModelChange(event.target.value)}
              disabled={busy || !brand}
            >
              {(brand?.models ?? []).map((entry) => (
                <option key={entry.id} value={entry.id}>{entry.name}</option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {error && <div className="admin-alert admin-alert--error" role="alert">{error}</div>}
      {notice && <div className="admin-alert admin-alert--success" role="status">{notice}</div>}

      <section className="admin-card" aria-labelledby="catalog-existing-title">
        <div className="admin-card-head">
          <div>
            <h2 id="catalog-existing-title">Fotos cadastradas</h2>
            <p>
              {model?.name ?? 'Modelo'} · {loading ? 'Carregando...' : `${images.length} foto(s)`}
            </p>
          </div>
          <button type="button" className="admin-button-secondary" onClick={() => void loadImages()} disabled={busy}>
            Atualizar
          </button>
        </div>

        {loading ? (
          <div className="admin-loading-inline" role="status">Carregando fotos...</div>
        ) : images.length === 0 ? (
          <div className="admin-empty">
            <span className="admin-empty-mark" aria-hidden="true">0</span>
            <h3>Nenhuma foto cadastrada</h3>
            <p>Adicione imagens abaixo para substituir a ilustração padrão deste modelo.</p>
          </div>
        ) : (
          <div className="admin-catalog-grid">
            {images.map((image) => {
              const imageUrl = getCatalogImageUrl(image.storage_path);
              const isReplacing = replacement?.image.id === image.id;

              return (
                <article key={image.id} className="admin-catalog-image">
                  {isReplacing && replacement ? (
                    <div className="admin-catalog-preview">
                      <img src={replacement.preview} alt="Prévia da nova foto" />
                      <span>Prévia da substituição</span>
                    </div>
                  ) : imageUrl ? (
                    <CatalogImagePreview
                      src={imageUrl}
                      alt={image.alt_text ?? `Foto de ${model?.name ?? 'modelo'}`}
                    />
                  ) : (
                    <div className="admin-image-error" role="alert">Imagem indisponível.</div>
                  )}

                  <div className="admin-catalog-image-actions">
                    {isReplacing ? (
                      <>
                        <button
                          type="button"
                          className="admin-catalog-action admin-catalog-action--confirm"
                          onClick={() => void confirmReplacement()}
                          disabled={busy}
                        >
                          <CheckIcon width={14} height={14} />
                          Confirmar
                        </button>
                        <button
                          type="button"
                          className="admin-catalog-action"
                          onClick={() => {
                            setReplacement(null);
                            setReplacementError(null);
                          }}
                          disabled={busy}
                        >
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <>
                        <label className="admin-catalog-action">
                          Substituir
                          <input
                            type="file"
                            className="sr-only"
                            accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                            onChange={(event) => handleReplacementFile(image, event)}
                            disabled={busy}
                          />
                        </label>
                        <button
                          type="button"
                          className="admin-catalog-action admin-catalog-action--danger"
                          onClick={() => void removeImage(image)}
                          disabled={busy}
                        >
                          <TrashIcon width={13} height={13} />
                          Remover
                        </button>
                      </>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {replacementError && (
          <p className="admin-alert admin-alert--error" role="alert">{replacementError}</p>
        )}
      </section>

      <section className="admin-card" aria-labelledby="catalog-add-title">
        <div className="admin-card-head">
          <div>
            <h2 id="catalog-add-title">Adicionar fotos</h2>
            <p>Pré-visualize antes de salvar. Cada modelo aceita até {MAX_CATALOG_IMAGES} fotos.</p>
          </div>
        </div>

        <label className="admin-catalog-upload">
          <span className="admin-catalog-upload-icon" aria-hidden="true">
            <PlusIcon width={21} height={21} />
          </span>
          <span>
            <strong>Selecionar imagens</strong>
            <small>JPEG, PNG ou WebP · até 10 MB cada</small>
          </span>
          <input
            type="file"
            className="sr-only"
            accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
            multiple
            onChange={handlePendingFiles}
            disabled={busy || images.length >= MAX_CATALOG_IMAGES}
          />
        </label>

        {fileError && <p className="admin-alert admin-alert--error" role="alert">{fileError}</p>}

        {pendingFiles.length > 0 && (
          <>
            <div className="admin-catalog-previews">
              {pendingFiles.map((file, index) => (
                <div key={`${file.name}-${file.size}-${index}`} className="admin-catalog-preview">
                  <img src={pendingPreviews[index]} alt={`Prévia de ${file.name}`} />
                  <button
                    type="button"
                    className="admin-catalog-preview-remove"
                    onClick={() => removePending(index)}
                    aria-label={`Remover ${file.name}`}
                    disabled={busy}
                  >
                    <TrashIcon width={13} height={13} />
                  </button>
                  <span>{file.name}</span>
                </div>
              ))}
            </div>

            <div className="admin-catalog-save">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => void savePending()}
                disabled={busy}
              >
                {busy ? 'Salvando...' : 'Salvar fotos'}
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
