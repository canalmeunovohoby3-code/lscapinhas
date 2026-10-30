import { useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import type { CustomizerDevice } from './types';
import type { CustomizerImage, Placement } from './types';
import { clamp } from './imageUtils';

interface MockupProps {
  device: CustomizerDevice;
  activeImage: CustomizerImage | null;
  selectedImage: CustomizerImage | null;
  placement: Placement;
  onPlace: () => void;
  onPlacementChange: (placement: Placement) => void;
  onRequestPhoto: () => void;
}

interface DragState {
  pointerId: number;
  startX: number;
  startY: number;
  placement: Placement;
}

export function Mockup({
  device,
  activeImage,
  selectedImage,
  placement,
  onPlace,
  onPlacementChange,
  onRequestPhoto,
}: MockupProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const [dragging, setDragging] = useState(false);
  const area = device.printArea;

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (selectedImage && (!activeImage || selectedImage.id !== activeImage.id)) {
      onPlace();
      return;
    }

    if (!activeImage) {
      onRequestPhoto();
      return;
    }

    const bounds = frameRef.current?.getBoundingClientRect();
    if (!bounds) return;

    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      placement,
    };
    setDragging(true);
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    const bounds = frameRef.current?.getBoundingClientRect();
    if (!drag || drag.pointerId !== event.pointerId || !bounds) return;

    const deltaX = (event.clientX - drag.startX) / bounds.width;
    const deltaY = (event.clientY - drag.startY) / bounds.height;

    onPlacementChange({
      ...drag.placement,
      x: clamp(drag.placement.x + deltaX, -1, 1),
      y: clamp(drag.placement.y + deltaY, -1, 1),
    });
  }

  function endDrag(event: PointerEvent<HTMLDivElement>) {
    if (dragRef.current?.pointerId === event.pointerId) {
      dragRef.current = null;
      setDragging(false);
    }
  }

  const maskStyle: CSSProperties = {
    maskImage: `url("${device.maskImage}")`,
    WebkitMaskImage: `url("${device.maskImage}")`,
    maskSize: '100% 100%',
    WebkitMaskSize: '100% 100%',
    maskRepeat: 'no-repeat',
    WebkitMaskRepeat: 'no-repeat',
    maskPosition: 'center',
    WebkitMaskPosition: 'center',
  };

  const areaStyle: CSSProperties = {
    left: 0,
    top: 0,
    width: '100%',
    height: '100%',
    ...maskStyle,
  };

  const borderMaskStyle: CSSProperties = {
    maskImage: `url("${device.baseImage}")`,
    WebkitMaskImage: `url("${device.baseImage}")`,
    maskSize: '100% 100%',
    WebkitMaskSize: '100% 100%',
    maskRepeat: 'no-repeat',
    WebkitMaskRepeat: 'no-repeat',
    maskPosition: 'center',
    WebkitMaskPosition: 'center',
  };

  const frameStyle: CSSProperties = {
    left: `${(area.x / device.mockupWidth) * 100}%`,
    top: `${(area.y / device.mockupHeight) * 100}%`,
    width: `${(area.width / device.mockupWidth) * 100}%`,
    height: `${(area.height / device.mockupHeight) * 100}%`,
  };

  return (
    <div className="customizer-mockup-shell">
      <img
        className="customizer-mockup-base"
        src={device.baseImage}
        alt={`${device.brand} ${device.model} sob capinha transparente`}
        draggable={false}
      />

      <div
        className={`customizer-print-area${activeImage ? ' has-image' : ''}${
          selectedImage ? ' is-ready' : ''
        }${dragging ? ' is-dragging' : ''}`}
        style={areaStyle}
        role="button"
        tabIndex={0}
        aria-label={
          activeImage
            ? 'Arraste para mover a foto na superfície da capinha'
            : 'Clique para aplicar a foto selecionada na capinha'
        }
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onKeyDown={(event) => {
          if ((event.key === 'Enter' || event.key === ' ') && selectedImage && !activeImage) {
            event.preventDefault();
            onPlace();
          }
        }}
      >
        <div ref={frameRef} className="customizer-print-window" style={frameStyle}>
          {activeImage ? (
            <div
              className="customizer-print-photo"
              style={{
                transform: `translate(${placement.x * 100}%, ${placement.y * 100}%) rotate(${placement.rotation}deg) scale(${placement.scale})`,
              }}
            >
            <img src={activeImage.url} alt="Sua foto aplicada à capinha" draggable={false} />
          </div>
        ) : null}
        </div>
      </div>

      <img
        className="customizer-mockup-overlay"
        src={device.borderImage}
        alt=""
        draggable={false}
        aria-hidden="true"
        style={borderMaskStyle}
      />
    </div>
  );
}
