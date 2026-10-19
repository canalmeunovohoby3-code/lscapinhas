export interface SiteConfig {
  name: string;
  fullName: string;
  slogan: string;
  description: string;
  announcement: string;
  whatsapp: {
    number: string;
    display: string;
  };
  instagramUrl: string | null;
  addressLines: string[] | null;
  policiesNote: string;
}

export const site: SiteConfig = {
  name: 'LS Case',
  fullName: 'LS Case by LS Celulares',
  slogan: 'Sua capa, seu estilo.',
  description:
    'Capinhas personalizadas para deixar seu celular com a sua identidade.',
  announcement: 'Capinhas que combinam com você.',
  whatsapp: {
    number: '552423404735',
    display: '(24) 2340-4735',
  },
  instagramUrl: null,
  addressLines: null,
  policiesNote:
    'Políticas de privacidade, trocas e condições de compra serão publicadas em breve.',
};
