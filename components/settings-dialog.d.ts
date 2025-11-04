import { LitElement } from 'lit';
import { MdDialog } from '@scopedelement/material-web/dialog/dialog.js';
import { MdTextButton } from '@scopedelement/material-web/button/text-button.js';
import { MdRadio } from '@scopedelement/material-web/radio/radio.js';
export declare enum UpdateSetting {
    Swap = "swap",
    Update = "update"
}
declare const SettingsDialog_base: typeof LitElement & import("@open-wc/scoped-elements/lit-element.js").ScopedElementsHostConstructor;
export declare class SettingsDialog extends SettingsDialog_base {
    static scopedElements: {
        'md-dialog': typeof MdDialog;
        'md-text-button': typeof MdTextButton;
        'md-radio': typeof MdRadio;
    };
    dialog: MdDialog;
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
