import { describe, expect, it } from 'vitest';
import {
  buildCustomRequestMessage,
  buildCustomRequestWhatsAppUrl,
  buildGeneralWhatsAppUrl,
  buildWhatsAppUrl,
} from './whatsapp';

describe('WhatsApp custom request message', () => {
  it('monta a solicitação de um modelo com observações', () => {
    const message = buildCustomRequestMessage({
      items: [{ brandName: 'Apple', modelName: 'iPhone 16', quantity: 1 }],
      notes: 'Quero a foto inteira.',
    });

    expect(message).toContain('Marca do celular: Apple');
    expect(message).toContain('Modelo do aparelho: iPhone 16');
    expect(message).toContain('Quantidade: 1');
    expect(message).toContain('Observações: Quero a foto inteira.');
    expect(message).not.toMatch(/R\$|valor unitário|subtotal|total do pedido/i);
  });

  it('lista vários modelos separadamente, sem misturar quantidades', () => {
    const message = buildCustomRequestMessage({
      items: [
        { brandName: 'Apple', modelName: 'iPhone 16', quantity: 2 },
        { brandName: 'Motorola', modelName: 'Moto G84', quantity: 1 },
      ],
    });

    expect(message).toContain('1. Marca do celular: Apple');
    expect(message).toContain('2. Marca do celular: Motorola');
    expect(message).toContain('Quantidade: 2');
    expect(message).toContain('Quantidade: 1');
  });

  it('omite observações vazias', () => {
    const message = buildCustomRequestMessage({
      items: [{ brandName: 'Apple', modelName: 'iPhone 16', quantity: 1 }],
      notes: '   ',
    });

    expect(message).not.toContain('Observações:');
  });

  it('usa o número comercial existente no link', () => {
    const url = buildCustomRequestWhatsAppUrl({
      items: [{ brandName: 'Apple', modelName: 'iPhone 16', quantity: 1 }],
    });

    expect(url.startsWith('https://wa.me/552423404735?text=')).toBe(true);
  });
});

describe('WhatsApp general link', () => {
  it('codifica a mensagem e usa o número internacional correto', () => {
    const url = buildGeneralWhatsAppUrl();
    const parsed = new URL(url);

    expect(parsed.origin).toBe('https://wa.me');
    expect(parsed.pathname).toBe('/552423404735');
    expect(parsed.searchParams.get('text')).toContain('Olá!');
  });

  it('codifica caracteres especiais com buildWhatsAppUrl', () => {
    const url = buildWhatsAppUrl('Olá, LS Case!');
    expect(decodeURIComponent(url.split('text=')[1])).toBe('Olá, LS Case!');
  });
});
