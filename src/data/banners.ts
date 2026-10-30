export interface HomeBanner {
  id: string;
  enabled: boolean;
  placeholder: boolean;
  desktopImage: string;
  mobileImage: string;
  imageAlt: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  href?: string;
  theme: 'light' | 'dark';
  showContent?: boolean;
}

/**
 * BANNERS DA HOME
 * Os três banners usam as artes enviadas pela loja.
 * Para desativar um banner, use `enabled: false`.
 */
export const homeBanners: HomeBanner[] = [
  {
    id: 'sua-paixao',
    enabled: true,
    placeholder: false,
    desktopImage: '/banners/banner-paixao-v2-desktop.jpg',
    mobileImage: '/banners/banner-paixao-mobile.jpg',
    imageAlt:
      'Banner com capinha personalizada do Flamengo em vermelho e preto, segura por uma mão.',
    eyebrow: 'CAPINHAS PERSONALIZADAS',
    title: 'Sua paixão sempre com você.',
    subtitle: 'Capinhas que mostram quem você é.',
    ctaLabel: 'Ver capinhas',
    href: '/#escolha-seu-celular',
    theme: 'dark',
    showContent: false,
  },
  {
    id: 'seu-estilo-capinha',
    enabled: true,
    placeholder: false,
    desktopImage: '/banners/banner-estilo-desktop.jpg',
    mobileImage: '/banners/banner-estilo-mobile.jpg',
    imageAlt:
      'Banner com capinha personalizada preta e rosa sobre um pedestal escuro.',
    eyebrow: 'CAPINHAS PERSONALIZADAS',
    title: 'Seu estilo. Sua capinha.',
    subtitle: 'Personalize seu celular com a sua identidade.',
    ctaLabel: 'Ver capinhas',
    href: '/#escolha-seu-celular',
    theme: 'dark',
    showContent: false,
  },
  {
    id: 'sua-historia',
    enabled: true,
    placeholder: false,
    desktopImage: '/banners/banner-historia-v2-desktop.jpg',
    mobileImage: '/banners/banner-historia-v2-mobile.jpg',
    imageAlt:
      'Banner com três capinhas personalizadas com fotos e estampas sobre um pedestal.',
    eyebrow: 'CAPINHAS PERSONALIZADAS',
    title: 'Sua história. Do seu jeito.',
    subtitle: 'Transforme suas memórias, seus momentos e sua identidade em uma capinha única.',
    ctaLabel: 'Ver capinhas',
    href: '/#escolha-seu-celular',
    theme: 'dark',
    showContent: false,
  },
];

export const activeHomeBanners = homeBanners.filter((banner) => banner.enabled);
