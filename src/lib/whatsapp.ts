import { site } from '../data/site';

export function buildWhatsAppUrl(message: string): string {
  return `https://wa.me/${site.whatsapp.number}?text=${encodeURIComponent(message)}`;
}

export interface CustomRequestItem {
  brandName: string;
  modelName: string;
  quantity: number;
}

export interface CustomRequestInput {
  items: CustomRequestItem[];
  notes?: string;
}

export function buildCustomRequestMessage({ items, notes }: CustomRequestInput): string {
  const validItems = items.filter(
    (item) =>
      item.brandName.trim().length > 0 &&
      item.modelName.trim().length > 0 &&
      Number.isInteger(item.quantity) &&
      item.quantity > 0,
  );
  const totalUnits = validItems.reduce((sum, item) => sum + item.quantity, 0);
  const plural = validItems.length > 1 || totalUnits > 1;

  const lines = [
    `Olá! Gostaria de solicitar ${plural ? 'capinhas personalizadas' : 'uma capinha personalizada'}.`,
    '',
  ];

  validItems.forEach((item, index) => {
    if (validItems.length > 1) {
      lines.push(
        `${index + 1}. Marca do celular: ${item.brandName.trim()}`,
        `   Modelo do aparelho: ${item.modelName.trim()}`,
        `   Quantidade: ${item.quantity}`,
        '',
      );
    } else {
      lines.push(
        `Marca do celular: ${item.brandName.trim()}`,
        `Modelo do aparelho: ${item.modelName.trim()}`,
        `Quantidade: ${item.quantity}`,
        '',
      );
    }
  });

  if (notes?.trim()) {
    lines.push(`Observações: ${notes.trim()}`, '');
  }

  lines.push(
    plural
      ? 'Vou enviar as fotos ou artes que desejo utilizar para personalizar as capinhas aqui nesta conversa.'
      : 'Vou enviar a foto ou arte que desejo utilizar para personalizar a capinha aqui nesta conversa.',
    'Gostaria de confirmar o valor e as condições de pagamento.',
    '',
    'Obrigado!',
  );

  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

export function buildCustomRequestWhatsAppUrl(input: CustomRequestInput): string {
  return buildWhatsAppUrl(buildCustomRequestMessage(input));
}

export function buildGeneralMessage(): string {
  return `Olá! Vim pelo site da ${site.fullName} e gostaria de atendimento.`;
}

export function buildGeneralWhatsAppUrl(): string {
  return buildWhatsAppUrl(buildGeneralMessage());
}
