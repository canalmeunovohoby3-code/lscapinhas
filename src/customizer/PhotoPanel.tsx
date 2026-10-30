import { useState, type ChangeEvent, type DragEvent } from 'react';
import { PlusIcon, TrashIcon } from '../components/Icons';
import type { CustomizerImage } from './types';
import { formatFileSize, validateCustomizerImages } from './imageUtils';
import { ALLOWED_IMAGE_ACCEPT, MAX_IMAGES } from './types';

interface PhotoPanelProps {
  images: CustomizerImage[];
  selectedId: string | null;
  activeId: string | null;
  onAddFiles: (files: File[]) => void;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  onPlace: () => void;
  onAdjust: () => void;
}

export function PhotoPanel({
  images,
  selectedId,
  activeId,
  onAddFiles,
  onSelect,
  onRemove,
  onPlace,
  onAdjust,
}: PhotoPanelProps) {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const selectedImage = images.find((image) => image.id === selectedId) ?? null;
  const selectedIsActive = Boolean(selectedImage && activeId === selectedImage.id);
  const canApply = Boolean(selectedImage && !selectedIsActive);

  function acceptFiles(files: File[]) {
    if (files.length === 0) return;

    const validation = validateCustomizerImages(files, images.length);
    if (validation) {
      setError(validation);
      return;
    }

    setError(null);
    onAddFiles(files);
  }

  function handleInput(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    acceptFiles(files);
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragActive(false);
    acceptFiles(Array.from(event.dataTransfer.files ?? []));
  }

  return (
    <div className="customizer-panel-stack">
      <div className="customizer-panel-head">
        <p className="eyebrow">Etapa 2</p>
        <h2>Fotos</h2>
        <p>Envie uma única fotografia para esta capinha. Depois ajuste o enquadramento.</p>
      </div>

      <label
        className={`customizer-dropzone${dragActive ? ' is-dragging' : ''}`}
        onDragOver={(event) => {
          event.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept={ALLOWED_IMAGE_ACCEPT}
          onChange={handleInput}
          disabled={images.length >= MAX_IMAGES}
        />
        <span className="customizer-dropzone-icon" aria-hidden="true">
          <PlusIcon width={22} height={22} />
        </span>
        <strong>{images.length >= MAX_IMAGES ? 'Fotografia adicionada' : 'Selecionar fotografia'}</strong>
        <small>JPEG, PNG ou WebP · até 10 MB</small>
        <span className="customizer-dropzone-counter">
          {images.length} de {MAX_IMAGES}
        </span>
      </label>

      {error && <p className="customizer-alert customizer-alert--error" role="alert">{error}</p>}

      {images.length > 0 ? (
        <div className="customizer-gallery-wrap">
          <div className="customizer-gallery-head">
            <strong>Sua fotografia</strong>
            {selectedImage && <span>Selecionada: {selectedImage.name}</span>}
          </div>
          <div className="customizer-gallery" role="list">
            {images.map((image) => (
              <div
                key={image.id}
                className={`customizer-gallery-item${
                  image.id === selectedId ? ' is-selected' : ''
                }${image.id === activeId ? ' is-active' : ''}`}
                role="listitem"
              >
                <button
                  type="button"
                  className="customizer-gallery-select"
                  onClick={() => onSelect(image.id)}
                  aria-label={`Selecionar ${image.name}`}
                >
                  <img src={image.url} alt={image.name} />
                </button>
                {image.id === activeId && (
                  <span className="customizer-gallery-badge">Na capinha</span>
                )}
                <button
                  type="button"
                  className="customizer-gallery-remove"
                  onClick={() => onRemove(image.id)}
                  aria-label={`Remover ${image.name}`}
                >
                  <TrashIcon width={13} height={13} />
                </button>
                <span className="customizer-gallery-name">{image.name}</span>
                <span className="customizer-gallery-meta">{formatFileSize(image.size)}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="customizer-empty-note">
          Nenhuma foto adicionada. A fotografia fica neste navegador até você finalizar o pedido.
        </p>
      )}

      {canApply && (
        <button type="button" className="btn btn-primary btn-block" onClick={onPlace}>
          Posicionar foto na capinha
        </button>
      )}

      {selectedIsActive && (
        <button type="button" className="btn btn-primary btn-block" onClick={onAdjust}>
          Ir para os ajustes
        </button>
      )}

      <p className="customizer-hint">
        {canApply
          ? 'Você também pode clicar diretamente na área de impressão para aplicar a foto selecionada.'
          : 'A arte fica limitada à área de impressão do mockup.'}
      </p>
    </div>
  );
}
