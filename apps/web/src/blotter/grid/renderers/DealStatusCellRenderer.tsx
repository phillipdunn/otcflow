import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import type { CustomCellRendererProps } from 'ag-grid-react';
import type { Deal } from '@otcflow/shared';
import { dealStatusMuiColor } from '../../formatDealDisplay.js';

export function DealStatusCellRenderer(props: CustomCellRendererProps<Deal, Deal['status']>) {
  const status = props.value;
  if (status == null) return null;
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', width: '100%' }}>
      <Chip label={status} size="small" color={dealStatusMuiColor(status)} variant="outlined" sx={{ fontWeight: 600 }} />
    </Box>
  );
}
