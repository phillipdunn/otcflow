import type { CellClassParams, CellStyle, ColDef, HeaderStyle } from 'ag-grid-community';
import type { Deal } from '@otcflow/shared';
import { formatDealNotional, formatDealPrice, formatDealUpdatedAtTable } from '../formatDealDisplay.js';
import { DealStatusCellRenderer } from './renderers/DealStatusCellRenderer.js';

/** Match `.ag-cell` horizontal inset + border so right-aligned headers line up with values. */
const rightNumericHeaderStyle: HeaderStyle = {
  paddingLeft: 'calc(var(--ag-cell-horizontal-padding) - 1px)',
  paddingRight: 'calc(var(--ag-cell-horizontal-padding) - 1px)',
  border: '1px solid transparent',
  boxSizing: 'border-box',
};

/** Right-aligned numbers: flex keeps values vertically centred; flex-end preserves column edge alignment. */
const numericBodyCellStyle: CellStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  lineHeight: 'normal',
};

const flexCenterBodyCellStyle: CellStyle = {
  display: 'flex',
  alignItems: 'center',
  lineHeight: 'normal',
};

export const dealBlotterColumnDefs: ColDef<Deal>[] = [
  { field: 'product', headerName: 'Product', flex: 1, minWidth: 110 },
  {
    field: 'status',
    headerName: 'Status',
    minWidth: 120,
    cellRenderer: DealStatusCellRenderer,
  },
  { field: 'counterparty', headerName: 'Counterparty', flex: 1.2, minWidth: 140 },
  { field: 'currency', headerName: 'Ccy', flex: 1, maxWidth: 88 },
  {
    field: 'notional',
    headerName: 'Notional',
    headerClass: 'ag-right-aligned-header',
    headerStyle: rightNumericHeaderStyle,
    flex: 0.9,
    minWidth: 100,
    type: 'rightAligned',
    valueFormatter: (p) => formatDealNotional(p.value as number),
  },
  {
    field: 'price',
    headerName: 'Price',
    headerClass: 'ag-right-aligned-header',
    headerStyle: rightNumericHeaderStyle,
    flex: 0.8,
    minWidth: 88,
    type: 'rightAligned',
    valueFormatter: (p) => (p.data ? formatDealPrice(p.data) : ''),
  },
  { field: 'trader', headerName: 'Trader', flex: 1, minWidth: 100 },
  { field: 'broker', headerName: 'Broker', flex: 1, minWidth: 100 },
  {
    field: 'updatedAt',
    headerName: 'Updated',
    flex: 1,
    minWidth: 140,
    valueFormatter: (p) => formatDealUpdatedAtTable(p.value as string),
  },
];

export const dealBlotterDefaultColDef: ColDef<Deal> = {
  sortable: false,
  resizable: true,
  suppressMovable: true,
  cellStyle: (params: CellClassParams<Deal>) => {
    const colId = params.column.getColId();
    if (colId === 'notional' || colId === 'price') {
      return numericBodyCellStyle;
    }
    return flexCenterBodyCellStyle;
  },
};
