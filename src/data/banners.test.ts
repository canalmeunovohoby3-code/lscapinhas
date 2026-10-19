import { describe, expect, it } from 'vitest';
import { activeHomeBanners, homeBanners } from './banners';

describe('configuração dos banners da home', () => {
  it('mantém identificadores únicos', () => {
    const ids = homeBanners.map((banner) => banner.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('mantém entre dois e três banners ativos', () => {
    expect(activeHomeBanners.length).toBeGreaterThanOrEqual(2);
    expect(activeHomeBanners.length).toBeLessThanOrEqual(3);
  });

  it('exige imagens e textos acessíveis nos banners ativos', () => {
    for (const banner of activeHomeBanners) {
      expect(banner.desktopImage).toMatch(/^\/banners\/.+\.(svg|webp|png|jpg)$/);
      expect(banner.mobileImage).toMatch(/^\/banners\/.+\.(svg|webp|png|jpg)$/);
      expect(banner.imageAlt.trim().length).toBeGreaterThan(10);
      expect(banner.title.trim().length).toBeGreaterThan(0);
      expect(banner.subtitle.trim().length).toBeGreaterThan(0);
      expect(banner.ctaLabel.trim().length).toBeGreaterThan(0);
      expect(['light', 'dark']).toContain(banner.theme);
      expect(typeof banner.placeholder).toBe('boolean');
    }
  });

  it('permite desativar banners sem excluir a configuração', () => {
    const disabled = { ...homeBanners[0], id: 'desativado', enabled: false };
    const banners = [...homeBanners, disabled];
    const active = banners.filter((banner) => banner.enabled);
    expect(active).toHaveLength(activeHomeBanners.length);
    expect(banners).toHaveLength(homeBanners.length + 1);
  });
});
