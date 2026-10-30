import type { CustomizerDevice } from './types';
import { buildExportFileName, getContainScale } from './imageUtils';
import type { Placement } from './types';

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Não foi possível carregar a imagem: ${src}`));
    image.src = src;
  });
}

export interface ExportCompositionResult {
  blob: Blob;
  fileName: string;
}

export async function exportComposition(
  device: CustomizerDevice,
  imageUrl: string,
  placement: Placement,
): Promise<ExportCompositionResult> {
  const [base, mask, border, photo] = await Promise.all([
    loadImage(device.baseImage),
    loadImage(device.maskImage),
    loadImage(device.borderImage),
    loadImage(imageUrl),
  ]);

  const { canvas: canvasConfig, box } = device.exportConfig;
  const drawWidth = box.width;
  const drawHeight = box.height;
  const drawX = box.x;
  const drawY = box.y;

  const canvas = document.createElement('canvas');
  canvas.width = canvasConfig.width;
  canvas.height = canvasConfig.height;
  const ctx = canvas.getContext('2d');

  if (!ctx) throw new Error('Canvas 2D indisponível neste navegador.');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(base, drawX, drawY, drawWidth, drawHeight);

  const area = device.printArea;
  const frameX = (area.x / device.mockupWidth) * drawWidth;
  const frameY = (area.y / device.mockupHeight) * drawHeight;
  const frameWidth = (area.width / device.mockupWidth) * drawWidth;
  const frameHeight = (area.height / device.mockupHeight) * drawHeight;
  const imageScale = getContainScale(
    photo.naturalWidth,
    photo.naturalHeight,
    frameWidth,
    frameHeight,
  );
  const imageWidth = photo.naturalWidth * imageScale;
  const imageHeight = photo.naturalHeight * imageScale;

  const photoLayer = document.createElement('canvas');
  photoLayer.width = drawWidth;
  photoLayer.height = drawHeight;
  const photoCtx = photoLayer.getContext('2d');

  if (!photoCtx) throw new Error('Canvas 2D indisponível neste navegador.');

  photoCtx.imageSmoothingEnabled = true;
  photoCtx.imageSmoothingQuality = 'high';
  photoCtx.save();
  photoCtx.translate(
    frameX + frameWidth / 2 + placement.x * frameWidth,
    frameY + frameHeight / 2 + placement.y * frameHeight,
  );
  photoCtx.rotate((placement.rotation * Math.PI) / 180);
  photoCtx.scale(placement.scale, placement.scale);
  photoCtx.drawImage(
    photo,
    -imageWidth / 2,
    -imageHeight / 2,
    imageWidth,
    imageHeight,
  );
  photoCtx.restore();

  photoCtx.save();
  photoCtx.globalCompositeOperation = 'destination-in';
  photoCtx.drawImage(mask, 0, 0, drawWidth, drawHeight);
  photoCtx.restore();

  ctx.drawImage(photoLayer, drawX, drawY);

  const borderLayer = document.createElement('canvas');
  borderLayer.width = drawWidth;
  borderLayer.height = drawHeight;
  const borderCtx = borderLayer.getContext('2d');

  if (!borderCtx) throw new Error('Canvas 2D indisponível neste navegador.');

  borderCtx.drawImage(border, 0, 0, drawWidth, drawHeight);
  borderCtx.globalCompositeOperation = 'destination-in';
  borderCtx.drawImage(base, 0, 0, drawWidth, drawHeight);
  ctx.drawImage(borderLayer, drawX, drawY);

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, 'image/png');
  });

  if (!blob) throw new Error('Não foi possível gerar o PNG.');

  return {
    blob,
    fileName: buildExportFileName(device.id),
  };
}

export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_500);
}
