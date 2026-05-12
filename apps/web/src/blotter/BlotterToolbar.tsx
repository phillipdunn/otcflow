import type { DealStatus } from '@otcflow/shared';
import { DEAL_STATUS_VALUES } from '@otcflow/shared';
import { useBlotterToolbar } from './blotterToolbarContext.js';
import { sortChevronIndicator } from './sortChevron.js';

export function BlotterToolbar() {
  const toolbar = useBlotterToolbar();

  return (
    <div className="blotter-toolbar">
      <div className="blotter-toolbar__group blotter-toolbar__group--search">
        <label className="blotter-field">
          <span className="blotter-field__label">Counterparty</span>
          <input
            type="search"
            className="blotter-input"
            placeholder="Search…"
            value={toolbar.counterpartyQuery}
            onChange={(event) => toolbar.setCounterpartyQuery(event.target.value)}
            autoComplete="off"
          />
        </label>
      </div>

      <div className="blotter-toolbar__group">
        <label className="blotter-field">
          <span className="blotter-field__label">Product</span>
          <select
            className="blotter-select"
            value={toolbar.productFilter}
            onChange={(event) => toolbar.setProductFilter(event.target.value)}
          >
            <option value="">All products</option>
            {toolbar.productOptions.map((productName) => (
              <option key={productName} value={productName}>
                {productName}
              </option>
            ))}
          </select>
        </label>

        <label className="blotter-field">
          <span className="blotter-field__label">Status</span>
          <select
            className="blotter-select"
            value={toolbar.statusFilter}
            onChange={(event) => toolbar.setStatusFilter(event.target.value as DealStatus | '')}
          >
            <option value="">All statuses</option>
            {DEAL_STATUS_VALUES.map((statusValue) => (
              <option key={statusValue} value={statusValue}>
                {statusValue}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="blotter-toolbar__group blotter-toolbar__group--sort">
        <span className="blotter-field__label blotter-field__label--inline">Sort</span>
        <div className="blotter-sort-buttons">
          <button
            type="button"
            className={`blotter-sort-btn ${toolbar.sortField === 'notional' ? 'is-active' : ''}`}
            onClick={() => toolbar.setSort('notional')}
          >
            Notional {sortChevronIndicator('notional', toolbar.sortField, toolbar.sortDirection)}
          </button>
          <button
            type="button"
            className={`blotter-sort-btn ${toolbar.sortField === 'updatedAt' ? 'is-active' : ''}`}
            onClick={() => toolbar.setSort('updatedAt')}
          >
            Updated {sortChevronIndicator('updatedAt', toolbar.sortField, toolbar.sortDirection)}
          </button>
        </div>
      </div>

      <div className="blotter-toolbar__meta">
        <span className="blotter-count">{toolbar.resultCount} deals</span>
      </div>
    </div>
  );
}
