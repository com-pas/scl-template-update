/* eslint-disable @typescript-eslint/no-unused-vars */
import { LitElement, html, css } from 'lit';
import { property, state } from 'lit/decorators.js';
import { ScopedElementsMixin } from '@open-wc/scoped-elements/lit-element.js';

import { OscdFilledButton } from '@omicronenergy/oscd-ui/button/OscdFilledButton.js';
import { OscdOutlinedTextField } from '@omicronenergy/oscd-ui/textfield/OscdOutlinedTextField.js';
import { OscdList } from '@omicronenergy/oscd-ui/list/OscdList.js';
import { OscdListItem } from '@omicronenergy/oscd-ui/list/OscdListItem.js';

export class LNodeTypeSidebar extends ScopedElementsMixin(LitElement) {
  static scopedElements = {
    'oscd-filled-button': OscdFilledButton,
    'oscd-outlined-textfield': OscdOutlinedTextField,
    'oscd-list': OscdList,
    'oscd-list-item': OscdListItem,
  };

  @property({ type: Array })
  lNodeTypes: Element[] = [];

  @property({ type: String })
  selectedId?: string;

  @state()
  filter: string = '';

  private debounceTimer?: number;

  private handleInput(e: Event) {
    const { value } = e.target as HTMLInputElement;
    clearTimeout(this.debounceTimer);
    this.debounceTimer = window.setTimeout(() => {
      this.filter = value;
    }, 300);
  }

  private clearFilter() {
    this.filter = '';
  }

  private handleClick(id: string) {
    this.dispatchEvent(
      new CustomEvent('lnodetype-select', {
        detail: { id },
        bubbles: true,
        composed: true,
      })
    );
  }

  get filteredLNodeTypes(): Element[] {
    if (!this.filter.trim()) return this.lNodeTypes;
    // If the filter includes words separated by &, treat as a single AND group (e.g. 'a & b', 'a&b', 'a &b', 'a& b').
    // Otherwise, split on comma or space (unless adjacent to &), so 'a b' and 'a,b' are separate OR groups.
    let groups: string[][] = [];
    const filter = this.filter.toLowerCase().trim();
    if (/^\s*\w+\s*&\s*\w+\s*$/.test(filter)) {
      groups = [
        filter
          .replace(/\s*&\s*/g, '&')
          .split('&')
          .filter(Boolean),
      ];
    } else {
      groups = filter
        .split(/(?<!&)[ ,]+(?!&)/)
        .map(group =>
          group
            .replace(/\s*&\s*/g, '&')
            .split('&')
            .filter(Boolean)
        )
        .filter(group => group.length > 0);
    }

    if (groups.length === 0) return this.lNodeTypes;

    return this.lNodeTypes.filter(ln => {
      const id = ln.getAttribute('id')?.toLowerCase() || '';
      const desc = ln.getAttribute('desc')?.toLowerCase() || '';
      return groups.some(group =>
        group.every(term => id.includes(term) || desc.includes(term))
      );
    });
  }

  render() {
    return html`<div class="sidebar">
      <div class="actions">
        <oscd-filled-button class="clear-all" @click=${this.clearFilter}>
          Clear filter
        </oscd-filled-button>
      </div>
      <div class="search-filter">
        <div class="search-container">
          <oscd-outlined-textfield
            label="Filter Logical Node Types"
            type="text"
            placeholder="e.g.: TCTR, TVTR&amp;protection"
            .value=${this.filter}
            @input=${this.handleInput}
            aria-label="Filter Logical Node Types"
            supporting-text="Search by ID or description. Use commas/spaces for OR, use &amp; for AND."
          ></oscd-outlined-textfield>
        </div>
      </div>
      <oscd-list>
        ${this.filteredLNodeTypes.map(ln => {
          const id = ln.getAttribute('id') || '';
          const desc = ln.getAttribute('desc') || '';
          const isSelected = this.selectedId === id;
          return html`
            <oscd-list-item
              type="button"
              ?selected=${isSelected}
              @click=${() => this.handleClick(id)}
            >
              <span slot="headline" title=${id}>${id}</span>
              <span slot="supporting-text">${desc}</span>
            </oscd-list-item>
          `;
        })}
      </oscd-list>
    </div>`;
  }

  updated(changedProperties: Map<string, unknown>) {
    super.updated?.(changedProperties);
    // Scroll oscd-list to top when lNodeTypes changes
    if (changedProperties.has('lNodeTypes')) {
      const oscdList = this.renderRoot.querySelector('oscd-list');
      if (oscdList) oscdList.scrollTop = 0;
    }
  }

  static styles = css`
    .sidebar {
      display: flex;
      flex-direction: column;
      flex: 1 1 auto;
      min-height: 0;
      padding: 1rem;
      overflow: hidden;
      background-color: var(--oscd-base3);
    }
    oscd-list {
      min-height: 0;
      max-height: calc(100vh - var(--header-height) - 1rem - 134px);
      overflow-y: auto;
      scrollbar-width: thin;
      padding: 0;
    }
    oscd-list::-webkit-scrollbar {
      width: 8px;
    }
    oscd-list::-webkit-scrollbar-thumb {
      border-radius: 4px;
    }
    oscd-list::-webkit-scrollbar-track {
      background: transparent;
    }
    oscd-list-item {
      box-sizing: border-box;
    }
    oscd-list-item[selected] {
      background: var(--md-sys-color-primary);
    }
    oscd-list-item[selected] span[slot='headline'],
    oscd-list-item[selected] span[slot='supporting-text'] {
      color: var(--md-sys-color-on-primary, #ffffff);
    }
    oscd-outlined-textfield {
      width: 100%;
    }
    .actions {
      display: flex;
      flex-direction: row-reverse;
      margin-bottom: 0.5rem;
    }
    .search-filter {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1rem;
    }
    .search-container {
      flex: 1;
      position: relative;
    }
    .clear-all {
      cursor: pointer;
      color: var(--md-sys-color-primary, #0078d4);
      text-decoration: underline;
      font-size: 0.95em;
    }
  `;
}
