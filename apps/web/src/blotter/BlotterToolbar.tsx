import type { ReactNode } from 'react';
import type { DealStatus } from '@otcflow/shared';
import { DEAL_STATUS_VALUES } from '@otcflow/shared';
import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { useBlotterToolbar } from './blotterToolbarContext.js';
import { sortChevronIndicator } from './sortChevron.js';

function ToolbarRow({
  left,
  right,
}: {
  left: ReactNode;
  right: ReactNode;
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        alignItems: { md: 'center' },
        justifyContent: 'space-between',
        gap: 1.5,
        rowGap: 1.5,
      }}
    >
      <Box sx={{ minWidth: 0 }}>{left}</Box>
      <Box
        sx={{
          flexShrink: 0,
          display: 'flex',
          justifyContent: { xs: 'flex-start', md: 'flex-end' },
          alignSelf: { xs: 'stretch', md: 'center' },
        }}
      >
        {right}
      </Box>
    </Box>
  );
}

export function BlotterToolbar() {
  const toolbar = useBlotterToolbar();

  return (
    <Paper elevation={0} sx={{ px: 2, py: 1.5, borderRadius: 0, borderBottom: 1, borderColor: 'divider' }}>
      <Stack spacing={1}>
        <ToolbarRow
          left={
            <Stack
              direction="row"
              useFlexGap
              sx={{ flexWrap: 'wrap', alignItems: 'center', gap: 2 }}
            >
              <TextField
                label="Search"
                placeholder="Counterparty, trader, broker…"
                value={toolbar.searchQuery}
                onChange={(e) => toolbar.setSearchQuery(e.target.value)}
                size="small"
                autoComplete="off"
                sx={{ width: { xs: '100%', sm: 280 }, flexShrink: 0 }}
              />
              <FormControl size="small" sx={{ minWidth: 160, flexShrink: 0 }}>
                <InputLabel id="blotter-product-filter-label">Product</InputLabel>
                <Select
                  labelId="blotter-product-filter-label"
                  label="Product"
                  value={toolbar.productFilter}
                  onChange={(e) => toolbar.setProductFilter(e.target.value)}
                >
                  <MenuItem value="">
                    <em>All products</em>
                  </MenuItem>
                  {toolbar.productOptions.map((productName) => (
                    <MenuItem key={productName} value={productName}>
                      {productName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 160, flexShrink: 0 }}>
                <InputLabel id="blotter-status-filter-label">Status</InputLabel>
                <Select
                  labelId="blotter-status-filter-label"
                  label="Status"
                  value={toolbar.statusFilter}
                  onChange={(e) => toolbar.setStatusFilter(e.target.value as DealStatus | '')}
                >
                  <MenuItem value="">
                    <em>All statuses</em>
                  </MenuItem>
                  {DEAL_STATUS_VALUES.map((statusValue) => (
                    <MenuItem key={statusValue} value={statusValue}>
                      {statusValue}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          }
          right={
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{ flexWrap: 'nowrap', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}
            >
              <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                Sort
              </Typography>
              <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'nowrap' }}>
                <Button
                  size="small"
                  variant={toolbar.sortField === 'createdAt' ? 'contained' : 'outlined'}
                  onClick={() => toolbar.setSort('createdAt')}
                  sx={{ whiteSpace: 'nowrap' }}
                >
                  Created {sortChevronIndicator('createdAt', toolbar.sortField, toolbar.sortDirection)}
                </Button>
                <Button
                  size="small"
                  variant={toolbar.sortField === 'notional' ? 'contained' : 'outlined'}
                  onClick={() => toolbar.setSort('notional')}
                  sx={{ whiteSpace: 'nowrap' }}
                >
                  Notional {sortChevronIndicator('notional', toolbar.sortField, toolbar.sortDirection)}
                </Button>
                <Button
                  size="small"
                  variant={toolbar.sortField === 'updatedAt' ? 'contained' : 'outlined'}
                  onClick={() => toolbar.setSort('updatedAt')}
                  sx={{ whiteSpace: 'nowrap' }}
                >
                  Updated {sortChevronIndicator('updatedAt', toolbar.sortField, toolbar.sortDirection)}
                </Button>
              </Stack>
              <Typography
                variant="body2"
                color="text.secondary"
                component="span"
                sx={{
                  whiteSpace: 'nowrap',
                  minWidth: '6.5rem',
                  textAlign: 'right',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {toolbar.resultCount.toLocaleString()} trades
              </Typography>
            </Stack>
          }
        />

        {toolbar.sortField === 'updatedAt' ? (
          <Typography variant="caption" color="text.secondary">
            Live updates reorder rows when sorted by Updated.
          </Typography>
        ) : null}
      </Stack>
    </Paper>
  );
}
