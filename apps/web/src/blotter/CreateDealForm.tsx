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
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
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
    <Box component="form" onSubmit={handleSubmit} aria-label="Create trade" sx={{ pt: 1 }}>
      <Stack spacing={2}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <FormControl fullWidth size="small">
            <InputLabel id="create-product-label">Product</InputLabel>
            <Select
              labelId="create-product-label"
              label="Product"
              value={form.product}
              onChange={(e) =>
                setForm((previous) => ({ ...previous, product: e.target.value as ProductType }))
              }
              required
            >
              {PRODUCT_TYPE_VALUES.map((product) => (
                <MenuItem key={product} value={product}>
                  {product}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Counterparty"
            value={form.counterparty}
            onChange={(e) => setForm((previous) => ({ ...previous, counterparty: e.target.value }))}
            required
            fullWidth
            size="small"
            slotProps={{ htmlInput: { maxLength: 200 } }}
            autoComplete="organization"
          />
        </Stack>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField
            label="Notional"
            type="number"
            size="small"
            value={form.notional}
            onChange={(e) =>
              setForm((previous) => ({
                ...previous,
                notional: Number.parseFloat(e.target.value) || 0,
              }))
            }
            required
            slotProps={{ htmlInput: { min: 1, step: 'any' } }}
            sx={{ flex: 1 }}
          />
          <FormControl fullWidth size="small" sx={{ flex: 1 }}>
            <InputLabel id="create-ccy-label">Currency</InputLabel>
            <Select
              labelId="create-ccy-label"
              label="Currency"
              value={form.currency}
              onChange={(e) =>
                setForm((previous) => ({ ...previous, currency: e.target.value as Currency }))
              }
              required
            >
              {CURRENCY_VALUES.map((currency) => (
                <MenuItem key={currency} value={currency}>
                  {currency}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Price"
            type="number"
            size="small"
            value={form.price}
            onChange={(e) =>
              setForm((previous) => ({
                ...previous,
                price: Number.parseFloat(e.target.value) || 0,
              }))
            }
            required
            slotProps={{ htmlInput: { step: 'any' } }}
            sx={{ flex: 1 }}
          />
        </Stack>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField
            label="Trader"
            value={form.trader}
            onChange={(e) => setForm((previous) => ({ ...previous, trader: e.target.value }))}
            required
            fullWidth
            size="small"
            slotProps={{ htmlInput: { maxLength: 120 } }}
          />
          <TextField
            label="Broker"
            value={form.broker}
            onChange={(e) => setForm((previous) => ({ ...previous, broker: e.target.value }))}
            required
            fullWidth
            size="small"
            slotProps={{ htmlInput: { maxLength: 120 } }}
          />
        </Stack>

        <Stack spacing={1}>
          <FormControlLabel
            control={
              <Checkbox
                checked={includeStatus}
                onChange={(e) => {
                  const checked = e.target.checked;
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
            }
            label="Set initial status (optional)"
          />
          {includeStatus ? (
            <FormControl size="small" sx={{ maxWidth: 280 }}>
              <InputLabel id="create-status-label">Status</InputLabel>
              <Select
                labelId="create-status-label"
                label="Status"
                value={form.status ?? 'NEW'}
                onChange={(e) =>
                  setForm((previous) => ({
                    ...previous,
                    status: e.target.value as DealStatus,
                  }))
                }
              >
                {DEAL_STATUS_VALUES.map((status) => (
                  <MenuItem key={status} value={status}>
                    {status}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ) : null}
        </Stack>

        {createMutation.isError ? (
          <Alert severity="error">
            {createMutation.error instanceof Error ? createMutation.error.message : 'Create failed'}
          </Alert>
        ) : null}

        <Box>
          <Button type="submit" variant="contained" disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Creating…' : 'Create trade'}
          </Button>
        </Box>
      </Stack>
    </Box>
  );
}
