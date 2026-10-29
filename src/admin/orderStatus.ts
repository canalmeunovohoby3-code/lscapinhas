import type { OrderStatus } from '../types/orders';

export interface StatusOption {
  value: OrderStatus;
  label: string;
  group: 'novo' | 'atendimento' | 'concluido' | 'cancelado';
}

export const STATUS_OPTIONS: StatusOption[] = [
  { value: 'novo', label: 'Novo / Pendente', group: 'novo' },
  { value: 'em_analise', label: 'Em análise', group: 'atendimento' },
  { value: 'em_producao', label: 'Em produção', group: 'atendimento' },
  { value: 'pronto', label: 'Pronto', group: 'atendimento' },
  { value: 'concluido', label: 'Concluído', group: 'concluido' },
  { value: 'cancelado', label: 'Cancelado', group: 'cancelado' },
];

const STATUS_LABELS = new Map(
  STATUS_OPTIONS.map((option) => [option.value, option.label]),
);

export function getStatusLabel(status: OrderStatus): string {
  return STATUS_LABELS.get(status) ?? status;
}

export function getStatusTone(status: OrderStatus): string {
  return `status-${status}`;
}

export interface DashboardCounts {
  total: number;
  newOrders: number;
  inService: number;
  completed: number;
  cancelled: number;
}

export function getDashboardCounts(
  orders: readonly { status: OrderStatus }[],
): DashboardCounts {
  const counts: DashboardCounts = {
    total: orders.length,
    newOrders: 0,
    inService: 0,
    completed: 0,
    cancelled: 0,
  };

  for (const order of orders) {
    if (order.status === 'novo') counts.newOrders += 1;
    else if (
      order.status === 'em_analise'
      || order.status === 'em_producao'
      || order.status === 'pronto'
    ) {
      counts.inService += 1;
    } else if (order.status === 'concluido') counts.completed += 1;
    else if (order.status === 'cancelado') counts.cancelled += 1;
  }

  return counts;
}
