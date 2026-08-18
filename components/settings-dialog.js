import { __decorate } from "tslib";
/* eslint-disable @typescript-eslint/no-unused-vars */
import { ScopedElementsMixin } from '@open-wc/scoped-elements/lit-element.js';
import { LitElement, html, css } from 'lit';
import { query, state } from 'lit/decorators.js';
import { OscdDialog } from '@omicronenergy/oscd-ui/dialog/OscdDialog.js';
import { OscdTextButton } from '@omicronenergy/oscd-ui/button/OscdTextButton.js';
import { OscdRadio } from '@omicronenergy/oscd-ui/radio/OscdRadio.js';
import { TEMPLATE_UPDATE_SETTING_STORAGE_KEY } from '../foundation/constants.js';
// eslint-disable-next-line no-shadow
export var UpdateSetting;
(function (UpdateSetting) {
    UpdateSetting["Swap"] = "swap";
    UpdateSetting["Update"] = "update";
})(UpdateSetting || (UpdateSetting = {}));
export class SettingsDialog extends ScopedElementsMixin(LitElement) {
    constructor() {
        super(...arguments);
        this.updateSetting = UpdateSetting.Update;
    }
    static { this.scopedElements = {
        'oscd-dialog': OscdDialog,
        'oscd-text-button': OscdTextButton,
        'oscd-radio': OscdRadio,
    }; }
    connectedCallback() {
        super.connectedCallback();
        this.loadSettings();
    }
    loadSettings() {
        const stored = localStorage.getItem(TEMPLATE_UPDATE_SETTING_STORAGE_KEY);
        if (stored && Object.values(UpdateSetting).includes(stored)) {
            this.updateSetting = stored;
        }
        else {
            this.updateSetting = UpdateSetting.Update;
        }
    }
    saveSettings() {
        localStorage.setItem(TEMPLATE_UPDATE_SETTING_STORAGE_KEY, this.updateSetting);
    }
    get open() {
        return this.dialog?.open ?? false;
    }
    show() {
        this.loadSettings();
        this.dialog?.show();
    }
    close() {
        this.dialog?.close();
    }
    handleRadioChange(event) {
        const target = event.target;
        if (target.checked) {
            this.updateSetting = target.value;
        }
    }
    handleConfirm() {
        this.saveSettings();
        this.close();
    }
    handleCancel() {
        this.loadSettings();
        this.close();
    }
    render() {
        return html `
      <oscd-dialog @closed=${() => this.dialog?.close()}>
        <div slot="headline">LNodeType update behaviour</div>
        <div slot="content">
          <div class="radio-group">
            <label class="radio-item">
              <oscd-radio
                name="update-setting"
                value=${UpdateSetting.Update}
                .checked=${this.updateSetting === UpdateSetting.Update}
                @change=${this.handleRadioChange}
              ></oscd-radio>
              <span class="radio-label">Update logical node type </span>
            </label>
            <label class="radio-item">
              <oscd-radio
                name="update-setting"
                value=${UpdateSetting.Swap}
                .checked=${this.updateSetting === UpdateSetting.Swap}
                @change=${this.handleRadioChange}
              ></oscd-radio>
              <span class="radio-label">Swap logical node type </span>
            </label>
          </div>
        </div>
        <div slot="actions">
          <oscd-text-button @click=${this.handleCancel} type="button">
            Cancel
          </oscd-text-button>
          <oscd-text-button @click=${this.handleConfirm} type="button">
            Save
          </oscd-text-button>
        </div>
      </oscd-dialog>
    `;
    }
    static { this.styles = css `
    oscd-dialog {
      --md-dialog-container-max-width: 400px;
    }

    .radio-group {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .radio-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      cursor: pointer;
      padding: 8px;
    }

    .radio-item:hover {
      background-color: rgba(0, 0, 0, 0.04);
    }

    .radio-label {
      display: flex;
      flex-direction: column;
      gap: 4px;
      flex: 1;
    }

    oscd-text-button {
      text-transform: uppercase;
    }
  `; }
}
__decorate([
    query('oscd-dialog')
], SettingsDialog.prototype, "dialog", void 0);
__decorate([
    state()
], SettingsDialog.prototype, "updateSetting", void 0);
//# sourceMappingURL=settings-dialog.js.map