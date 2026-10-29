export function normalizeWhatsAppNumber(
  contact: string | null | undefined,
): string | null {
  if (!contact) return null;

  let digits = contact.replace(/\D/g, '');

  if (!digits) return null;
  if (digits.startsWith('00')) digits = digits.slice(2);

  digits = digits.replace(/^0+/, '');

  if (!digits) return null;

  if (digits.startsWith('55')) {
    return digits.length === 12 || digits.length === 13 ? digits : null;
  }

  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }

  return null;
}

export function buildAdminWhatsAppUrl(
  customerName: string | null | undefined,
  contact: string | null | undefined,
): string | null {
  const number = normalizeWhatsAppNumber(contact);

  if (!number) return null;

  const name = customerName?.trim() || 'cliente';
  const message =
    `Olá, ${name}! Recebemos seu pedido na LS Case e estamos entrando em contato ` +
    'para conversar sobre os detalhes.';

  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
