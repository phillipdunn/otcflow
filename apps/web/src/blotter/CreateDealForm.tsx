import { useMutation, useQueryClient } from '@tanstack/react-query';
import { type FormEvent, useState } from 'react';
import {
  CURRENCY_VALUES,
  DEAL_STATUS_VALUES,
  PRODUCT_TYPE_VALUES,
  type Currency,
  type DealStatus,
  type ProductType,
} from '@otcflow/shared';
import { postDeal, type CreateDealInput } from '../api/dealsClient.js';
import { dealQueryKeys } from './queryKeys.js';

const defaultForm: CreateDealInput = {
  product: 'IRS',
  counterparty: '',
  notional: 1_000_000,
  currency: 'USD',
  price: 3.5,
  trader: '',
  broker: '',
};

export interface CreateDealFormProps {
  onCreated?: () => void;
}

export function CreateDealForm({ onCreated }: CreateDealFormProps) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<CreateDealInput>(defaultForm);
  const [includeStatus, setIncludeStatus] = useState(false);

  const createMutation = useMutation({
    mutationFn: (body: CreateDealInput) => postDeal(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: dealQueryKeys.all });
      setForm(defaultForm);
      setIncludeStatus(false);
      onCreated?.();
    },
  });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmedCounterparty = form.counterparty.trim();
    const trimmedTrader = form.trader.trim();
    const trimmedBroker = form.broker.trim();
    if (!trimmedCounterparty || !trimmedTrader || !trimmedBroker) return;

    const body: CreateDealInput = {
      product: form.product,
      counterparty: trimmedCounterparty,
      notional: form.notional,
      currency: form.currency,
      price: form.price,
      trader: trimmedTrader,
      broker: trimmedBroker,
    };
    if (includeStatus && form.status !== undefined) {
      body.status = form.status;
    }
    createMutation.mutate(body);
  };

  return (
    <form className="blotter-create-form" onSubmit={handleSubmit} aria-label="Create deal">
      <div className="blotter-create-form__grid">
        <label className="blotter-field">
          <span className="blotter-field__label">Product</span>
          <select
            className="blotter-select"
            value={form.product}
            onChange={(event) =>
              setForm((previous) => ({ ...previous, product: event.target.value as ProductType }))
            }
            required
          >
            {PRODUCT_TYPE_VALUES.map((product) => (
              <option key={product} value={product}>
                {product}
              </option>
            ))}
          </select>
        </label>

        <label className="blotter-field blotter-create-form__span-2">
          <span className="blotter-field__label">Counterparty</span>
          <input
            className="blotter-input"
            value={form.counterparty}
            onChange={(event) => setForm((previous) => ({ ...previous, counterparty: event.target.value }))}
            required
            maxLength={200}
            autoComplete="organization"
          />
        </label>

        <label className="blotter-field">
          <span className="blotter-field__label">Notional</span>
          <input
            className="blotter-input"
            type="number"
            min={1}
            step="any"
            value={form.notional}
            onChange={(event) =>
              setForm((previous) => ({ ...previous, notional: Number.parseFloat(event.target.value) || 0 }))
            }
            required
          />
        </label>

        <label className="blotter-field">
          <span className="blotter-field__label">Currency</span>
          <select
            className="blotter-select"
            value={form.currency}
            onChange={(event) =>
              setForm((previous) => ({ ...previous, currency: event.target.value as Currency }))
            }
            required
          >
            {CURRENCY_VALUES.map((currency) => (
              <option key={currency} value={currency}>
                {currency}
              </option>
            ))}
          </select>
        </label>

        <label className="blotter-field">
          <span className="blotter-field__label">Price</span>
          <input
            className="blotter-input"
            type="number"
            step="any"
            value={form.price}
            onChange={(event) =>
              setForm((previous) => ({ ...previous, price: Number.parseFloat(event.target.value) || 0 }))
            }
            required
          />
        </label>

        <label className="blotter-field">
          <span className="blotter-field__label">Trader</span>
          <input
            className="blotter-input"
            value={form.trader}
            onChange={(event) => setForm((previous) => ({ ...previous, trader: event.target.value }))}
            required
            maxLength={120}
          />
        </label>

        <label className="blotter-field">
          <span className="blotter-field__label">Broker</span>
          <input
            className="blotter-input"
            value={form.broker}
            onChange={(event) => setForm((previous) => ({ ...previous, broker: event.target.value }))}
            required
            maxLength={120}
          />
        </label>

        <div className="blotter-field blotter-create-form__span-2">
          <label className="blotter-create-form__check">
            <input
              type="checkbox"
              checked={includeStatus}
              onChange={(event) => {
                const checked = event.target.checked;
                setIncludeStatus(checked);
                setForm((previous) => {
                  if (checked && previous.status === undefined) {
                    return { ...previous, status: 'NEW' };
                  }
                  if (!checked) {
                    const next = { ...previous };
                    delete next.status;
                    return next;
                  }
                  return previous;
                });
              }}
            />
            <span>Set initial status (optional)</span>
          </label>
          {includeStatus ? (
            <select
              className="blotter-select blotter-create-form__status-select"
              value={form.status ?? 'NEW'}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  status: event.target.value as DealStatus,
                }))
              }
            >
              {DEAL_STATUS_VALUES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          ) : null}
        </div>
      </div>

      {createMutation.isError ? (
        <p className="blotter-inline-error" role="alert">
          {createMutation.error instanceof Error ? createMutation.error.message : 'Create failed'}
        </p>
      ) : null}

      <div className="blotter-create-form__actions">
        <button type="submit" className="blotter-btn blotter-btn--primary" disabled={createMutation.isPending}>
          {createMutation.isPending ? 'Creating…' : 'Create deal'}
        </button>
      </div>
    </form>
  );
}
