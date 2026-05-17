import type { ReactNode } from 'react';
import type { Deal, DealStatus } from '@otcflow/shared';
import { DEAL_STATUS_VALUES } from '@otcflow/shared';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import { DealAuditHistory } from './DealAuditHistory.js';
import {
  dealStatusMuiColor,
  formatDealNotional,
  formatDealPrice,
  formatDealUpdatedAtDetail,
} from './formatDealDisplay.js';

export interface DealDetailPanelProps {
  deal: Deal | null;
  open: boolean;
  onClose: () => void;
  onStatusChange?: (status: DealStatus) => void;
  isStatusUpdating?: boolean;
  statusError?: string | null;
}

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <Stack direction="row" spacing={1} sx={{ py: 0.5, alignItems: 'baseline' }}>
      <Typography component="span" variant="body2" color="text.secondary" sx={{ minWidth: 108 }}>
        {label}
      </Typography>
      <Typography component="span" variant="body2" sx={{ fontFamily: 'ui-monospace, monospace', wordBreak: 'break-all' }}>
        {value}
      </Typography>
    </Stack>
  );
}

export function DealDetailPanel({
  deal,
  open,
  onClose,
  onStatusChange,
  isStatusUpdating = false,
  statusError = null,
}: DealDetailPanelProps) {
  const auditEnabled = open && deal !== null;

  return (
    <Drawer anchor="right" open={open} onClose={onClose} slotProps={{ backdrop: { invisible: false } }}>
      <Box
        sx={{
          width: { xs: '100vw', sm: 440 },
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
        }}
      >
        <Box sx={{ p: 2, flexShrink: 0 }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6" component="h2">
              Trade
            </Typography>
            <IconButton aria-label="Close trade detail" onClick={onClose} edge="end" size="small">
              <CloseIcon />
            </IconButton>
          </Stack>
        </Box>

        <Box sx={{ px: 2, pb: 2, flex: 1, overflow: 'auto', minHeight: 0 }}>
          {deal ? (
            <>
              <DetailRow label="ID" value={deal.id} />
              <DetailRow label="Product" value={deal.product} />
              <DetailRow label="Counterparty" value={deal.counterparty} />
              <DetailRow label="Notional" value={formatDealNotional(deal.notional)} />
              <DetailRow label="Currency" value={deal.currency} />
              <DetailRow label="Price" value={formatDealPrice(deal)} />
              <Stack direction="row" spacing={1} sx={{ py: 0.5, alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary" sx={{ minWidth: 108 }}>
                  Status
                </Typography>
                <Chip label={deal.status} size="small" color={dealStatusMuiColor(deal.status)} variant="outlined" />
              </Stack>
              <DetailRow label="Trader" value={deal.trader} />
              <DetailRow label="Broker" value={deal.broker} />
              <DetailRow label="Version" value={String(deal.version)} />
              <DetailRow label="Created" value={formatDealUpdatedAtDetail(deal.createdAt)} />
              <DetailRow label="Updated" value={formatDealUpdatedAtDetail(deal.updatedAt)} />

              {onStatusChange ? (
                <>
                  <Divider sx={{ my: 1.5 }} />
                  <Typography variant="subtitle2" color="text.secondary">
                    Update status
                  </Typography>
                  <Stack direction="row" useFlexGap spacing={1} sx={{ flexWrap: 'wrap' }}>
                    {DEAL_STATUS_VALUES.map((statusValue) => (
                      <Button
                        key={statusValue}
                        variant={deal.status === statusValue ? 'contained' : 'outlined'}
                        size="small"
                        disabled={statusValue === deal.status || isStatusUpdating}
                        onClick={() => onStatusChange(statusValue)}
                      >
                        {statusValue}
                      </Button>
                    ))}
                  </Stack>
                  {statusError ? (
                    <Typography variant="body2" color="error" role="alert" sx={{ mt: 1 }}>
                      {statusError}
                    </Typography>
                  ) : null}
                </>
              ) : null}

              <Divider sx={{ my: 1.5 }} />
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
                Audit history
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                Immutable log of actions on this trade (newest first).
              </Typography>
              <DealAuditHistory dealId={deal.id} enabled={auditEnabled} />
            </>
          ) : null}
        </Box>
      </Box>
    </Drawer>
  );
}
