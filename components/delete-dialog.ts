/* eslint-disable @typescript-eslint/no-unused-vars */
import { ScopedElementsMixin } from '@open-wc/scoped-elements/lit-element.js';
import { LitElement, html, css } from 'lit';
import { query, state } from 'lit/decorators.js';
import { MdDialog } from '@scopedelement/material-web/dialog/dialog.js';
import { MdOutlinedButton } from '@scopedelement/material-web/button/MdOutlinedButton.js';

export class DeleteDialog extends ScopedElementsMixin(LitElement) {
  static scopedElements = {
    'md-dialog': MdDialog,
    'md-outlined-button': MdOutlinedButton,
  };

  @query('md-dialog')
  dialog!: MdDialog;

  @state()
  lnodeTypeId: string = '';

  @state()
  message: string = '';

  onConfirm?: () => void;

  get open() {
    return this.dialog?.open ?? false;
  }

  show() {
    this.dialog?.show();
  }

  close() {
    this.dialog?.close();
  }

  private handleCancel() {
    this.close();
  }

  private handleConfirm() {
    if (this.onConfirm) {
      this.onConfirm();
    }
    this.close();
  }

  render() {
    return html`
      <md-dialog>
        <div slot="headline">Confirm Delete</div>
        <form slot="content" id="form-delete" method="dialog">
          <div class="delete-content">
            <div class="message">${this.message}</div>
          </div>
        </form>
        <div slot="actions">
          <md-outlined-button
            class="button close"
            form="form-delete"
            @click="${this.handleCancel}"
            >Cancel</md-outlined-button
          >
          <md-outlined-button
            class="button delete"
            form="form-delete"
            @click="${this.handleConfirm}"
            >Delete</md-outlined-button
          >
        </div>
      </md-dialog>
    `;
  }

  static styles = css`
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

    .message {
      color: var(--oscd-base00);
    }

    .button.close {
      --md-outlined-button-label-text-color: var(--oscd-accent-red);
      --md-outlined-button-hover-label-text-color: var(--oscd-accent-red);
    }

    .button.delete {
      --md-outlined-button-label-text-color: var(--oscd-accent-red);
      --md-outlined-button-hover-label-text-color: var(--oscd-accent-red);
    }
  `;
}
