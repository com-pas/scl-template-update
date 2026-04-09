import { LitElement } from 'lit';
import { OscdDialog } from '@omicronenergy/oscd-ui/dialog/OscdDialog.js';
import { OscdTextButton } from '@omicronenergy/oscd-ui/button/OscdTextButton.js';
import { OscdRadio } from '@omicronenergy/oscd-ui/radio/OscdRadio.js';
export declare enum UpdateSetting {
    Swap = "swap",
    Update = "update"
}
declare const SettingsDialog_base: typeof LitElement & import("@open-wc/scoped-elements/lit-element.js").ScopedElementsHostConstructor;
export declare class SettingsDialog extends SettingsDialog_base {
    static scopedElements: {
        'oscd-dialog': typeof OscdDialog;
        'oscd-text-button': typeof OscdTextButton;
        'oscd-radio': typeof OscdRadio;
    };
    dialog: OscdDialog;
    private updateSetting;
    connectedCallback(): void;
    private loadSettings;
    private saveSettings;
    get open(): boolean;
    show(): void;
    close(): void;
    private handleRadioChange;
    private handleConfirm;
    private handleCancel;
    render(): import("lit").TemplateResult<1>;
    static styles: import("lit").CSSResult;
}
export {};
