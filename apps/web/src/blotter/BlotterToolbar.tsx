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

export function BlotterToolbar() {
  const toolbar = useBlotterToolbar();

  return (
    <Paper elevation={0} sx={{ px: 2, py: 1.5, borderRadius: 0, borderBottom: 1, borderColor: 'divider' }}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        useFlexGap
        sx={{ flexWrap: 'wrap', alignItems: { md: 'center' } }}
      >
        <TextField
          label="Search"
          placeholder="Counterparty, trader, broker…"
          value={toolbar.searchQuery}
          onChange={(e) => toolbar.setSearchQuery(e.target.value)}
          size="small"
          autoComplete="off"
          sx={{ minWidth: { xs: '100%', md: 280 } }}
        />

        <FormControl size="small" sx={{ minWidth: 160 }}>
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

        <FormControl size="small" sx={{ minWidth: 160 }}>
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

        <Box sx={{ flexGrow: { xs: 0, md: 1 }, minWidth: { md: 16 } }} />

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            flexWrap: 'wrap',
            width: { xs: '100%', md: 'auto' },
            justifyContent: { xs: 'flex-start', md: 'flex-end' },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Typography variant="caption" color="text.secondary" sx={{ mr: 0.5 }}>
              Sort
            </Typography>
            <Stack direction="row" spacing={0.5}>
              <Button
                size="small"
                variant={toolbar.sortField === 'notional' ? 'contained' : 'outlined'}
                onClick={() => toolbar.setSort('notional')}
              >
                Notional {sortChevronIndicator('notional', toolbar.sortField, toolbar.sortDirection)}
              </Button>
              <Button
                size="small"
                variant={toolbar.sortField === 'updatedAt' ? 'contained' : 'outlined'}
                onClick={() => toolbar.setSort('updatedAt')}
              >
                Updated {sortChevronIndicator('updatedAt', toolbar.sortField, toolbar.sortDirection)}
              </Button>
            </Stack>
          </Box>
          <Typography variant="body2" color="text.secondary" component="span" sx={{ whiteSpace: 'nowrap' }}>
            {toolbar.resultCount} trades
          </Typography>
        </Box>
      </Stack>
    </Paper>
  );
}
