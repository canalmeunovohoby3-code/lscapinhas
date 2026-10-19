import { describe, expect, it } from 'vitest';
import { site } from '../data/site';
import { formatBRL } from './format';
import {
  buildGeneralWhatsAppUrl,
  buildOrderMessage,
  buildOrderWhatsAppUrl,
  buildProductInquiryUrl,
} from './whatsapp';

const order = {
  orderId: 'LS-261019-AB12',
  customerName: 'Ana Souza',
  notes: 'Pode confirmar a cor rosa?',
  items: [
    {
      name: 'Capinha Flor de Cerejeira',
      modelName: 'iPhone 15',
      variantName: 'Rosé',
      quantity: 2,
      unitPrice: 44.9,
      subtotal: 89.8,
    },
    {
      name: 'Capinha Minimal Off-White',
      modelName: 'Galaxy A55',
      variantName: 'Preto',
      quantity: 1,
      unitPrice: 39.9,
      subtotal: 39.9,
    },
  ],
  total: 129.7,
};

describe('WhatsApp order message', () => {
  it('inclui todos os dados do pedido e do comprador', () => {
    const message = buildOrderMessage(order);
    expect(message).toContain('Olá! Quero fazer um pedido na LS Case by LS Celulares.');
    expect(message).toContain('*RESUMO DO PEDIDO*');
    expect(message).toContain('Pedido: #LS-261019-AB12');
    expect(message).toContain('1. Capinha Flor de Cerejeira — Rosé');
    expect(message).toContain('Modelo do celular: iPhone 15');
    expect(message).toContain('Quantidade: 2');
    expect(message).toContain(`Valor unitário: ${formatBRL(44.9)}`);
    expect(message).toContain(`Subtotal: ${formatBRL(89.8)}`);
    expect(message).toContain('2. Capinha Minimal Off-White — Preto');
    expect(message).toContain('Modelo do celular: Galaxy A55');
    expect(message).toContain(`*TOTAL DO PEDIDO: ${formatBRL(129.7)}*`);
    expect(message).toContain('Cliente: Ana Souza');
    expect(message).toContain('Observações: Pode confirmar a cor rosa?');
    expect(message).toContain('confirmar a disponibilidade');
  });

  it('omite observações vazias', () => {
    const message = buildOrderMessage({ ...order, notes: '   ' });
    expect(message).not.toContain('Observações:');
  });

  it('omite o modelo do item quando não foi informado', () => {
    const message = buildOrderMessage({
      ...order,
      items: [{ ...order.items[0], modelName: null }, order.items[1]],
    });
    expect(message).toContain('1. Capinha Flor de Cerejeira — Rosé');
    expect(message).not.toContain('Modelo do celular: iPhone 15');
    expect(message).toContain('Modelo do celular: Galaxy A55');
    expect(message).toContain('Quantidade: 2');
    expect(message).toContain(`*TOTAL DO PEDIDO: ${formatBRL(129.7)}*`);
  });

  it('codifica a mensagem corretamente no link do WhatsApp', () => {
    const url = buildOrderWhatsAppUrl(order);
    expect(url.startsWith(`https://wa.me/${site.whatsapp.number}?text=`)).toBe(true);
    const parsed = new URL(url);
    expect(parsed.hostname).toBe('wa.me');
    expect(parsed.pathname).toBe(`/${site.whatsapp.number}`);
    expect(parsed.searchParams.get('text')).toBe(buildOrderMessage(order));
  });

  it('preserva acentos, quebras de linha e caracteres especiais', () => {
    const input = {
      ...order,
      customerName: 'João Açaí & Cia',
      notes: 'Linha 1\nLinha 2 — coração # %',
    };
    const url = buildOrderWhatsAppUrl(input);
    const encodedText = url.split('text=')[1];
    expect(encodedText).toContain('%C3%A7');
    expect(encodedText).toContain('%0A');

    const decoded = new URL(url).searchParams.get('text') ?? '';
    expect(decoded).toContain('João Açaí & Cia');
    expect(decoded).toContain('Linha 1\nLinha 2 — coração # %');
    expect(decoded).toBe(buildOrderMessage(input));
  });
});

describe('WhatsApp product and general links', () => {
  it('monta a mensagem de interesse com produto e modelo', () => {
    const url = buildProductInquiryUrl({
      productName: 'Capinha Céu Estrelado',
      modelName: 'iPhone 15 Pro',
      variantName: 'Meia-noite',
      quantity: 2,
      price: 47.9,
      productUrl: 'https://exemplo.com/produto/ceu-estrelado',
    });
    const text = new URL(url).searchParams.get('text') ?? '';
    expect(text).toContain('*Capinha Céu Estrelado*');
    expect(text).toContain('Modelo do celular: iPhone 15 Pro');
    expect(text).toContain('Variação: Meia-noite');
    expect(text).toContain('Quantidade: 2');
    expect(text).toContain(formatBRL(47.9));
    expect(text).toContain('https://exemplo.com/produto/ceu-estrelado');
  });

  it('omite o modelo na mensagem de interesse quando não informado', () => {
    const url = buildProductInquiryUrl({
      productName: 'Capinha Céu Estrelado',
      modelName: null,
      quantity: 1,
      price: 47.9,
    });
    const text = new URL(url).searchParams.get('text') ?? '';
    expect(text).toContain('*Capinha Céu Estrelado*');
    expect(text).not.toContain('Modelo do celular:');
    expect(text).toContain('Quantidade: 1');
  });

  it('usa o número internacional correto no link geral', () => {
    const url = buildGeneralWhatsAppUrl();
    expect(url).toContain('https://wa.me/552423404735?text=');
    const text = new URL(url).searchParams.get('text') ?? '';
    expect(text).toContain('LS Case by LS Celulares');
  });
});
