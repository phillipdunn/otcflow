import './registerAgGridModules.js';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-material.css';

import { AgGridReact } from 'ag-grid-react';
import type { RowClassParams } from 'ag-grid-community';
import type { Deal } from '@otcflow/shared';
import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';
import { dealBlotterColumnDefs, dealBlotterDefaultColDef } from './dealBlotterColumnModel.js';

export interface DealBlotterGridProps {
  deals: Deal[];
  selectedId: string | null;
  onSelectDeal: (id: string) => void;
}

export function DealBlotterGrid({ deals, selectedId, onSelectDeal }: DealBlotterGridProps) {
  const theme = useTheme();
  const selectedBg =
    theme.palette.mode === 'dark' ? 'action.selected' : theme.palette.action.hover;
  return (
    <Box
      className="ag-theme-material"
      sx={{
        flex: 1,
        width: '100%',
        minHeight: 0,
        '& .ag-row.trade-grid-row--selected': {
          backgroundColor: selectedBg,
        },
        /* Cell root is `display:flex` via `dealBlotterDefaultColDef.cellStyle`. Shrink-wrap wrapper on
           the block axis so inner `.ag-cell-value` is not inside a stretched-tall flex item. */
        '& .ag-cell > .ag-cell-wrapper': {
          alignSelf: 'center',
          width: '100%',
          maxHeight: '100%',
          boxSizing: 'border-box',
        },
        '& .ag-cell .ag-react-container': {
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          maxHeight: '100%',
        },
        '& .ag-right-aligned-cell.ag-cell': {
          justifyContent: 'flex-end',
        },
        '& .ag-right-aligned-cell .ag-cell-wrapper': {
          justifyContent: 'flex-end',
          width: '100%',
        },
        '& .ag-right-aligned-cell .ag-react-container': {
          justifyContent: 'flex-end',
        },
      }}
    >
      <AgGridReact<Deal>
        rowData={deals}
        columnDefs={dealBlotterColumnDefs}
        defaultColDef={dealBlotterDefaultColDef}
        getRowId={(p) => p.data.id}
        rowHeight={44}
        headerHeight={40}
        suppressCellFocus
        animateRows={false}
        suppressScrollOnNewData
        domLayout="normal"
        onRowClicked={(e) => {
          const id = e.data?.id;
          if (id) onSelectDeal(id);
        }}
        getRowClass={(p: RowClassParams<Deal>) =>
          p.data?.id === selectedId ? 'trade-grid-row--selected' : undefined
        }
      />
    </Box>
  );
}
