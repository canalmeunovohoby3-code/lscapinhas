import { describe, expect, it } from 'vitest';
import { resolveAdminAccess } from './access';
import {
  getDashboardCounts,
  getStatusLabel,
  STATUS_OPTIONS,
} from './orderStatus';
import {
  buildAdminWhatsAppUrl,
  normalizeWhatsAppNumber,
} from './whatsapp';

describe('whatsapp administrativo', () => {
  it('normaliza números brasileiros e adiciona 55 quando necessário', () => {
    expect(normalizeWhatsAppNumber('(24) 99999-9999')).toBe('5524999999999');
    expect(normalizeWhatsAppNumber('24 99999-9999')).toBe('5524999999999');
    expect(normalizeWhatsAppNumber('2499999999')).toBe('552499999999');
    expect(normalizeWhatsAppNumber('+55 (24) 99999-9999')).toBe('5524999999999');
    expect(normalizeWhatsAppNumber('5524999999999')).toBe('5524999999999');
    expect(normalizeWhatsAppNumber('0 24 99999-9999')).toBe('5524999999999');
  });

  it('rejeita contato ausente ou inválido', () => {
    expect(normalizeWhatsAppNumber('')).toBeNull();
    expect(normalizeWhatsAppNumber(null)).toBeNull();
    expect(normalizeWhatsAppNumber('sem telefone')).toBeNull();
    expect(normalizeWhatsAppNumber('123')).toBeNull();
  });

  it('monta wa.me com nome e sem preço na mensagem', () => {
    const url = buildAdminWhatsAppUrl('Ana', '(24) 99999-9999');

    expect(url).toContain('https://wa.me/5524999999999?text=');
    expect(decodeURIComponent(url ?? '')).toContain('Olá, Ana!');
    expect(decodeURIComponent(url ?? '')).not.toMatch(/R\$|preço|valor/i);
  });

  it('não monta link quando o número é inválido', () => {
    expect(buildAdminWhatsAppUrl('Ana', 'inválido')).toBeNull();
  });
});

describe('dashboard administrativo', () => {
  it('calcula os totais a partir dos status reais', () => {
    const counts = getDashboardCounts([
      { status: 'novo' },
      { status: 'em_analise' },
      { status: 'em_producao' },
      { status: 'pronto' },
      { status: 'concluido' },
      { status: 'cancelado' },
    ]);

    expect(counts).toEqual({
      total: 6,
      newOrders: 1,
      inService: 3,
      completed: 1,
      cancelled: 1,
    });
  });

  it('retorna zero no banco vazio', () => {
    expect(getDashboardCounts([])).toEqual({
      total: 0,
      newOrders: 0,
      inService: 0,
      completed: 0,
      cancelled: 0,
    });
  });

  it('rotula todos os status existentes', () => {
    for (const option of STATUS_OPTIONS) {
      expect(getStatusLabel(option.value)).toBe(option.label);
    }
  });
});

describe('proteção de acesso administrativo', () => {
  it('carrega, redireciona ao login, nega ou libera conforme a sessão', () => {
    expect(resolveAdminAccess({ loading: true, hasSession: false, isAdmin: false }))
      .toBe('loading');
    expect(resolveAdminAccess({ loading: false, hasSession: false, isAdmin: false }))
      .toBe('login');
    expect(resolveAdminAccess({ loading: false, hasSession: true, isAdmin: false }))
      .toBe('denied');
    expect(resolveAdminAccess({ loading: false, hasSession: true, isAdmin: true }))
      .toBe('allowed');
  });
});
