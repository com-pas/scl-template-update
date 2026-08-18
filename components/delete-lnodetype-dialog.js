import { __decorate } from "tslib";
/* eslint-disable @typescript-eslint/no-unused-vars */
import { ScopedElementsMixin } from '@open-wc/scoped-elements/lit-element.js';
import { LitElement, html, css } from 'lit';
import { query, property } from 'lit/decorators.js';
import { OscdDialog } from '@omicronenergy/oscd-ui/dialog/OscdDialog.js';
import { OscdOutlinedButton } from '@omicronenergy/oscd-ui/button/OscdOutlinedButton.js';
export class DeleteDialog extends ScopedElementsMixin(LitElement) {
    constructor() {
        super(...arguments);
        this.lnodeTypeId = '';
    }
    static { this.scopedElements = {
        'oscd-dialog': OscdDialog,
        'oscd-outlined-button': OscdOutlinedButton,
    }; }
    get open() {
        return this.dialog?.open ?? false;
    }
    show() {
        this.dialog?.show();
    }
    close() {
        this.dialog?.close();
    }
    handleCancel() {
        this.close();
    }
    handleConfirm() {
        this.onConfirm();
        this.close();
    }
    render() {
        return html `
      <oscd-dialog>
        <div slot="headline">Confirm delete</div>
        <div slot="content" class="delete-content">
          Are you sure you want to delete Logical Node Type ${this.lnodeTypeId}?
          This action may have severe consequences.
        </div>
        <div slot="actions">
          <oscd-outlined-button
            class="button close"
            @click="${this.handleCancel}"
            >Cancel</oscd-outlined-button
          >
          <oscd-outlined-button
            class="button delete"
            @click="${this.handleConfirm}"
            >Delete</oscd-outlined-button
          >
        </div>
      </oscd-dialog>
    `;
    }
    static { this.styles = css `
    * {
      --md-sys-color-primary: var(--oscd-primary);
      --md-sys-color-secondary: var(--oscd-secondary);
      --md-sys-typescale-body-large-font: var(--oscd-theme-text-font);
      --md-outlined-text-field-input-text-color: var(--oscd-base01);

      --md-sys-color-surface: var(--oscd-base3);
      --md-sys-color-on-surface: var(--oscd-base00);
      --md-sys-color-on-primary: var(--oscd-base2);
      --md-sys-color-on-surface-variant: var(--oscd-base00);
      --md-menu-container-color: var(--oscd-base3);
      font-family: var(--oscd-theme-text-font);
      --md-sys-color-surface-container-highest: var(--oscd-base2);
      --md-dialog-container-color: var(--oscd-base3);
      font-family: var(--oscd-theme-text-font, 'Roboto');
    }

    md-outlined-button {
      text-transform: uppercase;
    }

    .delete-content {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .button.close {
      --md-outlined-button-label-text-color: var(--oscd-accent-red);
      --md-outlined-button-hover-label-text-color: var(--oscd-accent-red);
    }

    .button.delete {
      --md-outlined-button-label-text-color: var(--oscd-accent-red);
      --md-outlined-button-hover-label-text-color: var(--oscd-accent-red);
    }
  `; }
}
__decorate([
    property()
], DeleteDialog.prototype, "onConfirm", void 0);
__decorate([
    property()
], DeleteDialog.prototype, "lnodeTypeId", void 0);
__decorate([
    query('oscd-dialog')
], DeleteDialog.prototype, "dialog", void 0);
//# sourceMappingURL=delete-lnodetype-dialog.js.map