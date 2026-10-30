import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import '../styles/customizer.css';
import { BrandLogo } from '../components/BrandLogo';
import { CustomizerCheckout } from '../components/CustomizerCheckout';
import { ArrowRightIcon } from '../components/Icons';
import { usePageMeta } from '../lib/usePageMeta';
import { site } from '../data/site';
import { getModelById } from '../data/catalog';
import { AdjustmentPanel } from './AdjustmentPanel';
import { getDefaultMockupModelId, resolveMockup } from './registry';
import {
  buildDraft,
  deleteDraft,
  loadDraft,
  restoreDraftImages,
  saveDraft,
} from './draftStore';
import { downloadBlob, exportComposition } from './exportComposition';
import {
  markImageApplied,
  saveImagePlacement,
  updateImagePlacement,
} from './imageCollection';
import { Mockup } from './Mockup';
import { PhotoPanel } from './PhotoPanel';
import {
  DEFAULT_PLACEMENT,
  MAX_IMAGES,
  type CustomizerDevice,
  type CustomizerImage,
  type CustomizerStep,
  type Placement,
} from './types';

const HELP_URL = `https://wa.me/${site.whatsapp.number}?text=${encodeURIComponent(
  'Olá! Preciso de ajuda com o personalizador de capinhas.',
)}`;

function getCatalogBackHref(modelId: string): string {
  const model = getModelById(modelId);
  return model ? `/?marca=${encodeURIComponent(model.brandId)}` : '/';
}

type LoadState = 'loading' | 'ready' | 'unavailable' | 'error';
type DraftStatus =
  | 'restoring'
  | 'empty'
  | 'restored'
  | 'saving'
  | 'saved'
  | 'incompatible'
  | 'error';

function draftStatusLabel(status: DraftStatus, hasImages: boolean): string {
  if (status === 'restoring') return 'Recuperando rascunho...';
  if (status === 'saving') return 'Salvando rascunho...';
  if (status === 'saved') return 'Rascunho salvo automaticamente';
  if (status === 'restored') return 'Rascunho recuperado';
  if (status === 'incompatible') return 'Rascunho de outra versão do mockup';
  if (status === 'error') return 'Rascunho local indisponível';
  return hasImages ? 'Rascunho local' : 'Pronto para começar';
}

function StepNav({
  active,
  onChange,
}: {
  active: CustomizerStep;
  onChange: (step: CustomizerStep) => void;
}) {
  const steps: Array<{ id: CustomizerStep; label: string; number: string }> = [
    { id: 'case', label: 'Case', number: '1' },
    { id: 'photos', label: 'Fotos', number: '2' },
    { id: 'adjust', label: 'Ajustes', number: '3' },
  ];

  return (
    <nav className="customizer-stepnav" aria-label="Etapas do personalizador">
      {steps.map((step) => (
        <button
          key={step.id}
          type="button"
          className={`customizer-step-button${active === step.id ? ' is-active' : ''}`}
          onClick={() => onChange(step.id)}
          aria-current={active === step.id ? 'step' : undefined}
        >
          <span>{step.number}</span>
          {step.label}
        </button>
      ))}
    </nav>
  );
}

function CustomizerStatePage({
  state,
  modelId,
  error,
}: {
  state: Exclude<LoadState, 'ready'>;
  modelId: string;
  error: string | null;
}) {
  const isLoading = state === 'loading';
  const isUnavailable = state === 'unavailable';

  return (
    <div className="customizer-page">
      <div className="customizer-promo">
        <div className="customizer-promo-inner">
          <span>Capinha personalizada com a sua arte</span>
          <span>Produção artesanal · Envio para todo o Brasil</span>
        </div>
      </div>

      <header className="customizer-header">
        <div className="customizer-header-inner">
          <div className="customizer-header-brand">
            <Link to="/" className="customizer-brand" aria-label="LS Case — início">
              <BrandLogo eager light />
            </Link>
            <Link to={getCatalogBackHref(modelId)} className="customizer-back-link">
              <ArrowRightIcon width={14} height={14} className="icon-flip" />
              Voltar para os aparelhos
            </Link>
          </div>
          <div className="customizer-header-meta">
            <span>{modelId}</span>
          </div>
        </div>
      </header>

      <main className="customizer-main customizer-state-main">
        <div className="customizer-state-card">
          <p className="eyebrow">Personalizador</p>
          <h1>
            {isLoading
              ? 'Carregando mockup...'
              : isUnavailable
                ? 'Mockup indisponível'
                : 'Não foi possível carregar o mockup'}
          </h1>
          <p>
            {isLoading
              ? 'Buscando as camadas e as medidas oficiais deste aparelho.'
              : isUnavailable
                ? 'Este modelo ainda não possui mockup cadastrado. Nenhum outro aparelho será usado como substituto.'
                : error ?? 'Verifique o arquivo de manifesto e tente novamente.'}
          </p>
          {!isLoading && (
            <Link to="/#escolha-seu-celular" className="btn btn-primary">
              Ver modelos disponíveis
              <ArrowRightIcon width={17} height={17} />
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}

export function CustomizerPage() {
  const [searchParams] = useSearchParams();
  const requestedModelId = searchParams.get('modelo') ?? getDefaultMockupModelId() ?? '';
  const [device, setDevice] = useState<CustomizerDevice | null>(null);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [step, setStep] = useState<CustomizerStep>('case');
  const [images, setImages] = useState<CustomizerImage[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [placement, setPlacement] = useState<Placement>(DEFAULT_PLACEMENT);
  const [savedPlacement, setSavedPlacement] = useState<Placement>(DEFAULT_PLACEMENT);
  const [notice, setNotice] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportPreview, setExportPreview] = useState<{ url: string; fileName: string } | null>(null);
  const [draftStatus, setDraftStatus] = useState<DraftStatus>('restoring');
  const [draftHydrated, setDraftHydrated] = useState(false);
  const [confirmNew, setConfirmNew] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const urlsRef = useRef<Set<string>>(new Set());
  const exportPreviewRef = useRef<string | null>(null);

  usePageMeta(
    device ? `Personalizador — ${device.model} | LS Case` : 'Personalizador de capinhas | LS Case',
    device
      ? `Personalize uma capinha para ${device.model} com as camadas originais do mockup.`
      : 'Personalizador de capinhas LS Case.',
  );

  useEffect(() => {
    let active = true;

    setLoadState('loading');
    setLoadError(null);
    setDevice(null);

    if (!requestedModelId) {
      setLoadState('unavailable');
      return () => {
        active = false;
      };
    }

    resolveMockup(requestedModelId)
      .then((resolved) => {
        if (!active) return;
        if (!resolved) {
          setLoadState('unavailable');
          return;
        }
        setDevice(resolved);
        setLoadState('ready');
      })
      .catch((error: unknown) => {
        if (!active) return;
        setLoadState('error');
        setLoadError(error instanceof Error ? error.message : 'Falha ao carregar o mockup.');
      });

    return () => {
      active = false;
    };
  }, [requestedModelId]);

  useEffect(() => {
    if (!device) return undefined;

    let mounted = true;

    setDraftHydrated(false);
    setDraftStatus('restoring');
    setConfirmNew(false);
    setCheckoutOpen(false);

    urlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    urlsRef.current.clear();

    if (exportPreviewRef.current) URL.revokeObjectURL(exportPreviewRef.current);
    exportPreviewRef.current = null;

    setImages([]);
    setSelectedId(null);
    setActiveId(null);
    setPlacement(DEFAULT_PLACEMENT);
    setSavedPlacement(DEFAULT_PLACEMENT);
    setExportPreview(null);
    setNotice(null);
    setStep('case');

    loadDraft(device.id)
      .then((draft) => {
        if (!mounted) return;

        if (!draft) {
          setDraftHydrated(true);
          setDraftStatus('empty');
          return;
        }

        if (
          draft.modelId !== device.id ||
          draft.mockupId !== device.id ||
          draft.manifestVersion !== device.version
        ) {
          setDraftHydrated(true);
          setDraftStatus('incompatible');
          return;
        }

        const restored = restoreDraftImages(draft);
        restored.images.forEach((image) => urlsRef.current.add(image.url));

        if (draft.images.length > 0 && restored.images.length === 0) {
          setDraftHydrated(true);
          setDraftStatus('error');
          setNotice('Não foi possível recuperar as fotografias deste rascunho.');
          return;
        }

        const selected =
          restored.images.find((image) => image.id === draft.selectedId) ??
          restored.images[0] ??
          null;
        const active =
          restored.images.find((image) => image.id === draft.activeId && image.applied) ??
          (selected?.applied ? selected : null);
        const restoredStep: CustomizerStep =
          draft.step === 'case' || draft.step === 'photos' || draft.step === 'adjust'
            ? draft.step
            : 'case';

        setImages(restored.images);
        setSelectedId(selected?.id ?? null);
        setActiveId(active?.id ?? null);
        setPlacement(active?.placement ?? DEFAULT_PLACEMENT);
        setSavedPlacement(active?.savedPlacement ?? DEFAULT_PLACEMENT);
        setStep(active ? restoredStep : restoredStep === 'adjust' ? 'photos' : restoredStep);
        setDraftHydrated(true);
        setDraftStatus('restored');

        if (restored.skipped > 0) {
          setNotice('Algumas fotografias do rascunho não puderam ser recuperadas.');
        }
      })
      .catch(() => {
        if (!mounted) return;
        setDraftHydrated(true);
        setDraftStatus('error');
        setNotice('O armazenamento local não está disponível. Você pode continuar, mas o rascunho não será salvo.');
      });

    return () => {
      mounted = false;
    };
  }, [device?.id, device?.version]);

  useEffect(() => {
    if (!device || !draftHydrated || images.length === 0) return undefined;

    const timer = window.setTimeout(() => {
      setDraftStatus('saving');

      saveDraft(buildDraft(device, images, selectedId, activeId, step))
        .then(() => setDraftStatus('saved'))
        .catch(() => setDraftStatus('error'));
    }, 650);

    return () => window.clearTimeout(timer);
  }, [device, draftHydrated, images, selectedId, activeId, step]);

  useEffect(() => {
    if (!device || !draftHydrated || images.length === 0) return undefined;

    const flush = () => {
      void saveDraft(buildDraft(device, images, selectedId, activeId, step));
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') flush();
    };

    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [device, draftHydrated, images, selectedId, activeId, step]);

  useEffect(() => () => {
    urlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    urlsRef.current.clear();
    if (exportPreviewRef.current) URL.revokeObjectURL(exportPreviewRef.current);
  }, []);

  const selectedImage = images.find((image) => image.id === selectedId) ?? null;
  const activeImage = images.find((image) => image.id === activeId) ?? null;

  function selectImage(id: string) {
    const image = images.find((entry) => entry.id === id);

    setSelectedId(id);
    setNotice(null);

    if (image?.applied) {
      setActiveId(image.id);
      setPlacement(image.placement);
      setSavedPlacement(image.savedPlacement);
      setStep('adjust');
      return;
    }

    setStep('photos');
  }

  function updatePlacement(nextPlacement: Placement) {
    setPlacement(nextPlacement);

    if (activeId) {
      setImages((current) => updateImagePlacement(current, activeId, nextPlacement));
    }
  }

  function addFiles(files: File[]) {
    if (files.length === 0) return;

    if (files.length > 1 || images.length >= MAX_IMAGES) {
      setNotice('Cada capinha aceita somente uma fotografia. Remova a atual para trocar.');
      setStep('photos');
      return;
    }

    const firstOrder = images.reduce((highest, image) => Math.max(highest, image.order), -1) + 1;
    const [file] = files;
    const url = URL.createObjectURL(file);
    urlsRef.current.add(url);

    const initialPlacement = { ...DEFAULT_PLACEMENT };

    const nextImage: CustomizerImage = {
      id: crypto.randomUUID(),
      name: file.name,
      url,
      size: file.size,
      type: file.type,
      blob: file,
      placement: { ...initialPlacement },
      savedPlacement: { ...initialPlacement },
      applied: false,
      order: firstOrder,
    };

    setImages([nextImage]);
    setSelectedId(nextImage.id);
    setActiveId(null);
    setPlacement(DEFAULT_PLACEMENT);
    setSavedPlacement(DEFAULT_PLACEMENT);
    setStep('photos');
    setNotice(null);
  }

  function removeImage(id: string) {
    const image = images.find((entry) => entry.id === id);
    const remaining = images.filter((entry) => entry.id !== id);

    if (image) {
      URL.revokeObjectURL(image.url);
      urlsRef.current.delete(image.url);
    }

    setImages(remaining);

    if (selectedId === id) {
      setSelectedId(remaining[0]?.id ?? null);
    }

    if (activeId === id) {
      setActiveId(null);
      setPlacement(DEFAULT_PLACEMENT);
      setSavedPlacement(DEFAULT_PLACEMENT);
    }

    if (remaining.length === 0 && device) {
      deleteDraft(device.id)
        .then(() => setDraftStatus('empty'))
        .catch(() => setDraftStatus('error'));
    }
  }

  function placeSelectedImage() {
    if (!selectedImage) {
      setStep('photos');
      setNotice('Escolha uma foto antes de posicionar.');
      return;
    }

    const initialPlacement = selectedImage.placement;

    setImages((current) => markImageApplied(current, selectedImage.id));
    setActiveId(selectedImage.id);
    setPlacement(initialPlacement);
    setSavedPlacement(selectedImage.savedPlacement);
    setNotice('Foto posicionada. Ajuste o enquadramento abaixo.');
    setStep('adjust');
  }

  function saveAdjustments() {
    if (!activeImage) return;

    setImages((current) => saveImagePlacement(current, activeImage.id, placement));
    setSavedPlacement({ ...placement });
    setNotice('Ajustes salvos.');
  }

  function cancelAdjustments() {
    if (!activeImage) return;

    setPlacement(activeImage.savedPlacement);
    setImages((current) =>
      updateImagePlacement(current, activeImage.id, activeImage.savedPlacement),
    );
    setNotice('Ajustes revertidos.');
  }

  function removeActiveImage() {
    if (!activeImage) return;
    setActiveId(null);
    setPlacement(DEFAULT_PLACEMENT);
    setSavedPlacement(DEFAULT_PLACEMENT);
    setNotice('Foto removida da capinha.');
    setStep('photos');
  }

  async function handleExport() {
    if (!device || !activeImage || exporting) return;

    setExporting(true);
    setNotice(null);

    try {
      const result = await exportComposition(device, activeImage.url, placement);
      const previewUrl = URL.createObjectURL(result.blob);

      if (exportPreviewRef.current) URL.revokeObjectURL(exportPreviewRef.current);

      exportPreviewRef.current = previewUrl;
      setExportPreview({ url: previewUrl, fileName: result.fileName });
      downloadBlob(result.blob, result.fileName);
      setNotice('PNG gerado. Confira a prévia e use o botão de download.');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Não foi possível gerar o PNG.');
    } finally {
      setExporting(false);
    }
  }

  async function discardDraft() {
    const currentDevice = device;

    urlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    urlsRef.current.clear();
    if (exportPreviewRef.current) URL.revokeObjectURL(exportPreviewRef.current);
    exportPreviewRef.current = null;

    setImages([]);
    setSelectedId(null);
    setActiveId(null);
    setPlacement(DEFAULT_PLACEMENT);
    setSavedPlacement(DEFAULT_PLACEMENT);
    setExportPreview(null);
    setNotice('Nova personalização iniciada.');
    setStep('case');
    setConfirmNew(false);
    setCheckoutOpen(false);
    setDraftStatus('empty');

    if (!currentDevice) return;

    try {
      await deleteDraft(currentDevice.id);
    } catch {
      setDraftStatus('error');
      setNotice('Não foi possível apagar o rascunho salvo neste navegador.');
    }
  }

  function startNewDraft() {
    if (images.length > 0 || draftStatus === 'incompatible') {
      setConfirmNew(true);
      return;
    }

    void discardDraft();
  }

  if (loadState !== 'ready' || !device) {
    return (
      <CustomizerStatePage
        state={loadState === 'ready' ? 'loading' : loadState}
        modelId={requestedModelId || 'modelo não informado'}
        error={loadError}
      />
    );
  }

  return (
    <div className="customizer-page">
      <div className="customizer-promo">
        <div className="customizer-promo-inner">
          <span>Capinha personalizada com a sua arte</span>
          <span>Produção artesanal · Envio para todo o Brasil</span>
        </div>
      </div>

      <header className="customizer-header">
        <div className="customizer-header-inner">
          <div className="customizer-header-brand">
            <Link to="/" className="customizer-brand" aria-label="LS Case — início">
              <BrandLogo eager light />
            </Link>
            <Link to={getCatalogBackHref(requestedModelId)} className="customizer-back-link">
              <ArrowRightIcon width={14} height={14} className="icon-flip" />
              Voltar para os aparelhos
            </Link>
          </div>
          <div className="customizer-header-meta">
            <span>{device.brand} {device.model}</span>
          </div>
        </div>
      </header>

      <main className="customizer-main">
        <h1 className="sr-only">Personalizador de capinhas LS Case</h1>
        <div className="customizer-layout">
          <section className="customizer-stage" aria-label="Prévia da capinha">
            <Mockup
              device={device}
              activeImage={activeImage}
              selectedImage={selectedImage}
              placement={placement}
              onPlace={placeSelectedImage}
              onPlacementChange={updatePlacement}
              onRequestPhoto={() => {
                setStep('photos');
                setNotice('Selecione uma foto na etapa Fotos.');
              }}
            />

            <p className="customizer-stage-hint">
              {activeImage
                ? 'Arraste a foto para mover. Use os controles para ampliar, reduzir e girar.'
                : selectedImage
                  ? 'Clique sobre a capinha para aplicar a foto selecionada.'
                  : 'Adicione sua fotografia pelo painel ao lado.'}
            </p>
          </section>

          <aside className="customizer-side" aria-label="Etapas do personalizador">
            <div className="customizer-panel-tabs">
              <StepNav active={step} onChange={setStep} />
            </div>

            <div className="customizer-panel-scroll">
              <div
                className="customizer-draft-bar"
                data-draft-status={draftStatus}
                role="status"
                aria-live="polite"
              >
                <span className={`customizer-draft-status is-${draftStatus}`}>
                  {draftStatusLabel(draftStatus, images.length > 0)}
                </span>
                {(images.length > 0 || draftStatus === 'incompatible') && (
                  <button
                    type="button"
                    className="customizer-draft-new"
                    onClick={startNewDraft}
                    disabled={draftStatus === 'saving'}
                  >
                    Nova personalização
                  </button>
                )}
              </div>

              {confirmNew && (
                <div className="customizer-draft-confirm" role="alertdialog" aria-labelledby="draft-confirm-title">
                  <strong id="draft-confirm-title">Descartar o rascunho atual?</strong>
                  <p>As fotos e os ajustes salvos neste navegador serão removidos.</p>
                  <div className="customizer-draft-confirm-actions">
                    <button
                      type="button"
                      className="btn btn-outline btn-small"
                      onClick={() => setConfirmNew(false)}
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary btn-small"
                      onClick={() => void discardDraft()}
                    >
                      Descartar
                    </button>
                  </div>
                </div>
              )}

              {notice && step !== 'adjust' && (
                <p className="customizer-alert customizer-alert--success customizer-global-notice" role="status">
                  {notice}
                </p>
              )}

              <div className="customizer-side-card">
                {step === 'case' && (
                  <div className="customizer-panel-stack">
                    <div className="customizer-panel-head">
                      <p className="eyebrow">Etapa 1</p>
                      <h2>Case</h2>
                      <p>Personalize a parte traseira com a sua arte. A prévia é uma composição 2D em camadas.</p>
                    </div>

                    <div className="customizer-product-summary">
                      <div>
                        <span>{device.brand}</span>
                        <strong>{device.model}</strong>
                      </div>
                      <div>
                        <span>Material</span>
                        <strong>{device.material}</strong>
                      </div>
                      <div>
                        <span>Layout</span>
                        <strong>{device.layout}</strong>
                      </div>
                    </div>

                    <div className="customizer-case-notes">
                      <p>A foto fica limitada à superfície da capinha e atrás da ilha de câmera.</p>
                      <p>A arte é processada apenas neste navegador.</p>
                    </div>

                    <button type="button" className="btn btn-primary btn-block" onClick={() => setStep('photos')}>
                      Escolher foto
                      <ArrowRightIcon width={17} height={17} />
                    </button>
                  </div>
                )}

                {step === 'photos' && (
                  <PhotoPanel
                    images={images}
                    selectedId={selectedId}
                    activeId={activeId}
                    onAddFiles={addFiles}
                    onSelect={selectImage}
                    onRemove={removeImage}
                    onPlace={placeSelectedImage}
                    onAdjust={() => setStep('adjust')}
                  />
                )}

                {step === 'adjust' && (
                  <AdjustmentPanel
                    image={activeImage}
                    placement={placement}
                    savedPlacement={savedPlacement}
                    exporting={exporting}
                    notice={notice}
                    previewUrl={exportPreview?.url ?? null}
                    previewFileName={exportPreview?.fileName ?? null}
                    onUpdate={updatePlacement}
                    onSave={saveAdjustments}
                    onCancel={cancelAdjustments}
                    onCenter={() => {
                      updatePlacement({ ...placement, x: 0, y: 0 });
                      setNotice('Imagem centralizada.');
                    }}
                    onRemove={removeActiveImage}
                    onExport={() => void handleExport()}
                    onBackToPhotos={() => setStep('photos')}
                  />
                )}
              </div>
            </div>

            <footer className="customizer-panel-footer">
              {activeImage ? (
                <button
                  type="button"
                  className="btn btn-primary customizer-request-button"
                  onClick={() => setCheckoutOpen(true)}
                >
                  Finalizar pedido
                  <ArrowRightIcon width={17} height={17} />
                </button>
              ) : (
                <Link
                  to={`/capinhas?modelo=${device.id}`}
                  className="btn btn-primary customizer-request-button"
                >
                  Escolher fotografia
                  <ArrowRightIcon width={17} height={17} />
                </Link>
              )}
              <a
                className="customizer-help-link"
                href={HELP_URL}
                target="_blank"
                rel="noreferrer"
              >
                Ajuda
              </a>
            </footer>
          </aside>
        </div>
      </main>

      {checkoutOpen && activeImage && (
        <CustomizerCheckout
          open={checkoutOpen}
          device={device}
          image={activeImage}
          placement={placement}
          onClose={() => setCheckoutOpen(false)}
        />
      )}
    </div>
  );
}

