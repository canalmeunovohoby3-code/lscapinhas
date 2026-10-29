import { describe, expect, it } from 'vitest';

const rawSources = import.meta.glob('../**/*.{ts,tsx}', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

function read(relativePath: string): string {
  const key = `../${relativePath.replace(/^src\//, '')}`;
  const source = rawSources[key];

  if (!source) {
    throw new Error(`Arquivo não encontrado no teste: ${relativePath}`);
  }

  return source;
}

const publicOrderFlow = [
  'src/pages/OrderPage.tsx',
  'src/components/OrderForm.tsx',
  'src/components/RequestSummary.tsx',
  'src/pages/CartPage.tsx',
];

const priceFreeFlow = [
  ...publicOrderFlow,
  'src/pages/ProductPage.tsx',
  'src/pages/CatalogPage.tsx',
  'src/pages/HomePage.tsx',
  'src/components/InspirationCard.tsx',
  'src/components/PhoneModelCard.tsx',
  'src/components/ModelCardGrid.tsx',
  'src/admin/AdminDashboard.tsx',
  'src/admin/AdminOrdersPage.tsx',
  'src/admin/AdminOrderDetailPage.tsx',
  'src/admin/AdminLogin.tsx',
  'src/admin/AdminLayout.tsx',
  'src/admin/AdminStates.tsx',
];

describe('fluxo público de pedidos', () => {
  it('não redireciona a conclusão do pedido para o WhatsApp', () => {
    for (const file of publicOrderFlow) {
      const source = read(file);
      expect(source, file).not.toMatch(/wa\.me|WhatsAppIcon|Falar no WhatsApp/);
    }
  });

  it('não apresenta valores ou cálculos monetários no fluxo e no admin', () => {
    const forbidden = /R\$|formatBRL|\.price\b|\bprice\b|\bpreço\b|\bprecos\b|subtotal|unitPrice|discount/i;

    for (const file of priceFreeFlow) {
      const source = read(file);
      expect(source, file).not.toMatch(forbidden);
    }
  });
});
