import { site } from '../data/site';
import { formatBRL } from './format';

export interface WhatsAppOrderItem {
  name: string;
  modelName: string | null;
  variantName?: string | null;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface WhatsAppOrderInput {
  orderId: string;
  customerName: string;
  notes?: string;
  items: WhatsAppOrderItem[];
  total: number;
}

export function buildOrderMessage({
  orderId,
  customerName,
  notes,
  items,
  total,
}: WhatsAppOrderInput): string {
  const itemBlocks = items.map((item, index) => {
    const variation = item.variantName ? ` — ${item.variantName}` : '';
    const lines = [`${index + 1}. ${item.name}${variation}`];
    if (item.modelName) lines.push(`Modelo do celular: ${item.modelName}`);
    lines.push(
      `Quantidade: ${item.quantity}`,
      `Valor unitário: ${formatBRL(item.unitPrice)}`,
      `Subtotal: ${formatBRL(item.subtotal)}`,
    );
    return lines.join('\n');
  });

  const blocks = [
    `Olá! Quero fazer um pedido na ${site.fullName}.`,
    '*RESUMO DO PEDIDO*',
    `Pedido: #${orderId}`,
    itemBlocks.join('\n\n'),
    `*TOTAL DO PEDIDO: ${formatBRL(total)}*`,
    `Cliente: ${customerName.trim()}`,
  ];

  if (notes?.trim()) {
    blocks.push(`Observações: ${notes.trim()}`);
  }

  blocks.push(
    'Gostaria de confirmar a disponibilidade dos produtos e combinar a forma de pagamento e entrega.',
  );

  return blocks.join('\n\n');
}

export function buildWhatsAppUrl(message: string): string {
  return `https://wa.me/${site.whatsapp.number}?text=${encodeURIComponent(message)}`;
}

export function buildOrderWhatsAppUrl(input: WhatsAppOrderInput): string {
  return buildWhatsAppUrl(buildOrderMessage(input));
}

export function buildProductInquiryMessage(input: {
  productName: string;
  modelName?: string | null;
  variantName?: string | null;
  quantity: number;
  price: number;
  productUrl?: string;
}): string {
  const lines = [
    'Olá! Tenho interesse nesta capinha:',
    '',
    `*${input.productName}*`,
  ];
  if (input.modelName) lines.push(`Modelo do celular: ${input.modelName}`);
  if (input.variantName) lines.push(`Variação: ${input.variantName}`);
  lines.push(`Quantidade: ${input.quantity}`);
  lines.push(`Valor: ${formatBRL(input.price)}`);
  if (input.productUrl) lines.push(`Link: ${input.productUrl}`);
  lines.push('', 'Poderia me ajudar com a disponibilidade?');
  return lines.join('\n');
}

export function buildProductInquiryUrl(
  input: Parameters<typeof buildProductInquiryMessage>[0],
): string {
  return buildWhatsAppUrl(buildProductInquiryMessage(input));
}

export function buildGeneralMessage(): string {
  return `Olá! Vim pelo site da ${site.fullName} e gostaria de atendimento.`;
}

export function buildGeneralWhatsAppUrl(): string {
  return buildWhatsAppUrl(buildGeneralMessage());
}
