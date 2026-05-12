import type { KeyboardEvent } from 'react';
import type { Deal } from '@otcflow/shared';
import {
  dealStatusBadgeClassName,
  formatDealNotional,
  formatDealPrice,
  formatDealUpdatedAtTable,
} from './formatDealDisplay.js';

export interface DealTableProps {
  deals: Deal[];
  selectedId: string | null;
  onSelect: (dealId: string) => void;
}

function handleDealRowKeyDown(
  event: KeyboardEvent<HTMLTableRowElement>,
  dealId: string,
  onSelect: (dealId: string) => void
) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    onSelect(dealId);
  }
}

export function DealTable({ deals, selectedId, onSelect }: DealTableProps) {
  return (
    <div className="blotter-table-wrap">
      <table className="blotter-table" role="table" aria-label="OTC deals">
        <thead>
          <tr role="row">
            <th role="columnheader" scope="col">
              Product
            </th>
            <th role="columnheader" scope="col">
              Counterparty
            </th>
            <th role="columnheader" scope="col" className="num">
              Notional
            </th>
            <th role="columnheader" scope="col">
              Ccy
            </th>
            <th role="columnheader" scope="col" className="num">
              Price
            </th>
            <th role="columnheader" scope="col">
              Status
            </th>
            <th role="columnheader" scope="col">
              Trader
            </th>
            <th role="columnheader" scope="col">
              Broker
            </th>
            <th role="columnheader" scope="col" className="num">
              Ver
            </th>
            <th role="columnheader" scope="col">
              Created
            </th>
            <th role="columnheader" scope="col">
              Updated
            </th>
          </tr>
        </thead>
        <tbody>
          {deals.map((deal) => (
            <tr
              key={deal.id}
              role="row"
              tabIndex={0}
              aria-selected={selectedId === deal.id}
              aria-label={`Deal ${deal.id}: ${deal.product}, ${deal.counterparty}`}
              className={selectedId === deal.id ? 'is-selected' : undefined}
              onClick={() => onSelect(deal.id)}
              onKeyDown={(event) => handleDealRowKeyDown(event, deal.id, onSelect)}
            >
              <td role="cell" className="blotter-cell-product">
                {deal.product}
              </td>
              <td role="cell">{deal.counterparty}</td>
              <td role="cell" className="num mono">
                {formatDealNotional(deal.notional)}
              </td>
              <td role="cell" className="mono">
                {deal.currency}
              </td>
              <td role="cell" className="num mono">
                {formatDealPrice(deal)}
              </td>
              <td role="cell">
                <span className={dealStatusBadgeClassName(deal.status)}>{deal.status}</span>
              </td>
              <td role="cell">{deal.trader}</td>
              <td role="cell">{deal.broker}</td>
              <td role="cell" className="num mono">
                {deal.version}
              </td>
              <td role="cell" className="mono muted">
                {formatDealUpdatedAtTable(deal.createdAt)}
              </td>
              <td role="cell" className="mono muted">
                {formatDealUpdatedAtTable(deal.updatedAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {deals.length === 0 ? (
        <p className="blotter-empty">No deals match the current filters.</p>
      ) : null}
    </div>
  );
}
