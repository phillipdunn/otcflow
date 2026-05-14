import { useEffect } from 'react';
import type { Deal, DealStatus } from '@otcflow/shared';
import { DEAL_STATUS_VALUES } from '@otcflow/shared';
import {
  dealStatusBadgeClassName,
  formatDealNotional,
  formatDealPrice,
  formatDealUpdatedAtDetail,
} from './formatDealDisplay.js';

export interface DealDetailPanelProps {
  deal: Deal;
  onClose: () => void;
  onStatusChange?: (status: DealStatus) => void;
  isStatusUpdating?: boolean;
  statusError?: string | null;
}

export function DealDetailPanel({
  deal,
  onClose,
  onStatusChange,
  isStatusUpdating = false,
  statusError = null,
}: DealDetailPanelProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <aside className="blotter-detail" aria-label="Deal detail">
      <div className="blotter-detail__head">
        <h2 className="blotter-detail__title">Deal</h2>
        <button type="button" className="blotter-detail__close" onClick={onClose}>
          Close
        </button>
      </div>
      <dl className="blotter-detail__dl">
        <div className="blotter-detail__row">
          <dt>ID</dt>
          <dd className="mono">{deal.id}</dd>
        </div>
        <div className="blotter-detail__row">
          <dt>Product</dt>
          <dd>{deal.product}</dd>
        </div>
        <div className="blotter-detail__row">
          <dt>Counterparty</dt>
          <dd>{deal.counterparty}</dd>
        </div>
        <div className="blotter-detail__row">
          <dt>Notional</dt>
          <dd className="mono">{formatDealNotional(deal.notional)}</dd>
        </div>
        <div className="blotter-detail__row">
          <dt>Currency</dt>
          <dd className="mono">{deal.currency}</dd>
        </div>
        <div className="blotter-detail__row">
          <dt>Price</dt>
          <dd className="mono">{formatDealPrice(deal)}</dd>
        </div>
        <div className="blotter-detail__row">
          <dt>Status</dt>
          <dd>
            <span className={dealStatusBadgeClassName(deal.status)}>{deal.status}</span>
          </dd>
        </div>
        <div className="blotter-detail__row">
          <dt>Trader</dt>
          <dd>{deal.trader}</dd>
        </div>
        <div className="blotter-detail__row">
          <dt>Broker</dt>
          <dd>{deal.broker}</dd>
        </div>
        <div className="blotter-detail__row">
          <dt>Version</dt>
          <dd className="mono">{deal.version}</dd>
        </div>
        <div className="blotter-detail__row">
          <dt>Created</dt>
          <dd className="mono">{formatDealUpdatedAtDetail(deal.createdAt)}</dd>
        </div>
        <div className="blotter-detail__row">
          <dt>Updated</dt>
          <dd className="mono">{formatDealUpdatedAtDetail(deal.updatedAt)}</dd>
        </div>
      </dl>

      {onStatusChange ? (
        <div className="blotter-detail__actions">
          <h3 className="blotter-detail__actions-title">Update status</h3>
          <div className="blotter-detail__status-btns" role="group" aria-label="Set deal status">
            {DEAL_STATUS_VALUES.map((statusValue) => (
              <button
                key={statusValue}
                type="button"
                className="blotter-status-btn"
                disabled={statusValue === deal.status || isStatusUpdating}
                onClick={() => onStatusChange(statusValue)}
              >
                {statusValue}
              </button>
            ))}
          </div>
          {statusError ? (
            <p className="blotter-inline-error" role="alert">
              {statusError}
            </p>
          ) : null}
        </div>
      ) : null}
    </aside>
  );
}
