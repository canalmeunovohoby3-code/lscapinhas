import type { CustomizerImage, Placement } from './types';
import { clamp, nextRotation, normalizeRotation } from './imageUtils';
import { MAX_SCALE, MIN_SCALE } from './types';

interface AdjustmentPanelProps {
  image: CustomizerImage | null;
  placement: Placement;
  savedPlacement: Placement | null;
  exporting: boolean;
  notice: string | null;
  previewUrl: string | null;
  previewFileName: string | null;
  onUpdate: (placement: Placement) => void;
  onSave: () => void;
  onCancel: () => void;
  onCenter: () => void;
  onRemove: () => void;
  onExport: () => void;
  onBackToPhotos: () => void;
}

export function AdjustmentPanel({
  image,
  placement,
  savedPlacement,
  exporting,
  notice,
  previewUrl,
  previewFileName,
  onUpdate,
  onSave,
  onCancel,
  onCenter,
  onRemove,
  onExport,
  onBackToPhotos,
}: AdjustmentPanelProps) {
  if (!image) {
    return (
      <div className="customizer-panel-stack">
        <div className="customizer-panel-head">
          <p className="eyebrow">Etapa 3</p>
          <h2>Ajustes</h2>
          <p>Adicione e posicione uma foto para liberar os ajustes.</p>
        </div>
        <div className="customizer-empty-state">
          <span aria-hidden="true">＋</span>
          <p>Nenhuma foto está aplicada na capinha.</p>
          <button type="button" className="btn btn-primary" onClick={onBackToPhotos}>
            Escolher foto
          </button>
        </div>
      </div>
    );
  }

  const isDirty = savedPlacement
    ? placement.x !== savedPlacement.x
      || placement.y !== savedPlacement.y
      || placement.scale !== savedPlacement.scale
      || placement.rotation !== savedPlacement.rotation
    : true;

  function updateScale(nextScale: number) {
    onUpdate({
      ...placement,
      scale: clamp(Number(nextScale.toFixed(2)), MIN_SCALE, MAX_SCALE),
    });
  }

  return (
    <div className="customizer-panel-stack">
      <div className="customizer-panel-head">
        <p className="eyebrow">Etapa 3</p>
        <h2>Ajustes</h2>
        <p>Mova, amplie, reduza ou gire a foto dentro da área de impressão.</p>
      </div>

      <div className="customizer-current-photo">
        <img src={image.url} alt={image.name} />
        <div>
          <strong>{image.name}</strong>
          <span>{isDirty ? 'Ajustes em edição' : 'Ajustes salvos'}</span>
        </div>
      </div>

      <div className="customizer-control-block">
        <div className="customizer-control-head">
          <span>Zoom</span>
          <strong>{Math.round(placement.scale * 100)}%</strong>
        </div>
        <div className="customizer-zoom-row">
          <button
            type="button"
            className="customizer-square-button"
            onClick={() => updateScale(placement.scale - 0.1)}
            aria-label="Reduzir imagem"
          >
            −
          </button>
          <input
            type="range"
            min={MIN_SCALE * 100}
            max={MAX_SCALE * 100}
            step={5}
            value={Math.round(placement.scale * 100)}
            onChange={(event) => updateScale(Number(event.target.value) / 100)}
            aria-label="Zoom da imagem"
          />
          <button
            type="button"
            className="customizer-square-button"
            onClick={() => updateScale(placement.scale + 0.1)}
            aria-label="Ampliar imagem"
          >
            +
          </button>
        </div>
      </div>

      <div className="customizer-control-grid">
        <button
          type="button"
          className="customizer-control-button"
          onClick={() => onUpdate({ ...placement, rotation: nextRotation(placement.rotation, 'left') })}
        >
          <span aria-hidden="true">↺</span>
          Girar à esquerda
        </button>
        <button
          type="button"
          className="customizer-control-button"
          onClick={() => onUpdate({ ...placement, rotation: nextRotation(placement.rotation, 'right') })}
        >
          <span aria-hidden="true">↻</span>
          Girar à direita
        </button>
        <button type="button" className="customizer-control-button" onClick={onCenter}>
          <span aria-hidden="true">⌖</span>
          Centralizar
        </button>
        <button
          type="button"
          className="customizer-control-button customizer-control-button--danger"
          onClick={onRemove}
        >
          <span aria-hidden="true">×</span>
          Remover foto
        </button>
      </div>

      <p className="customizer-rotation-note">
        Rotação atual: {normalizeRotation(placement.rotation)}°
      </p>

      <div className="customizer-adjust-actions">
        <button type="button" className="btn btn-outline" onClick={onCancel} disabled={!isDirty}>
          Cancelar
        </button>
        <button type="button" className="btn btn-primary" onClick={onSave}>
          Salvar ajustes
        </button>
      </div>

      <button
        type="button"
        className="btn btn-export btn-block"
        onClick={onExport}
        disabled={exporting}
      >
        {exporting ? 'Gerando PNG...' : 'Exportar prévia em PNG'}
      </button>

      {notice && <p className="customizer-alert customizer-alert--success" role="status">{notice}</p>}

      {previewUrl && (
        <div className="customizer-export-preview">
          <img src={previewUrl} alt="Prévia PNG da capinha personalizada" />
          {previewFileName && (
            <a
              className="btn btn-outline btn-block"
              href={previewUrl}
              download={previewFileName}
            >
              Baixar PNG
            </a>
          )}
        </div>
      )}

      <p className="customizer-hint">
        A prévia é gerada localmente no navegador. A arte de produção ainda não é enviada.
      </p>
    </div>
  );
}
