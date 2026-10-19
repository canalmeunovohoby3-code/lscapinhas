import { MinusIcon, PlusIcon } from './Icons';

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 99,
  label = 'Quantidade',
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  label?: string;
}) {
  return (
    <div className="quantity-stepper">
      <button
        type="button"
        className="quantity-button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label="Diminuir quantidade"
      >
        <MinusIcon width={16} height={16} />
      </button>
      <span className="quantity-value" aria-live="polite" aria-label={`${label}: ${value}`}>
        {value}
      </span>
      <button
        type="button"
        className="quantity-button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label="Aumentar quantidade"
      >
        <PlusIcon width={16} height={16} />
      </button>
    </div>
  );
}
