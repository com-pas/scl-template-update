import { LitElement } from 'lit';
import { MdDialog } from '@scopedelement/material-web/dialog/dialog.js';
import { MdOutlinedButton } from '@scopedelement/material-web/button/MdOutlinedButton.js';
declare const DeleteDialog_base: typeof LitElement & import("@open-wc/scoped-elements/lit-element.js").ScopedElementsHostConstructor;
export declare class DeleteDialog extends DeleteDialog_base {
    static scopedElements: {
        'md-dialog': typeof MdDialog;
        'md-outlined-button': typeof MdOutlinedButton;
    };
    onConfirm: () => void;
    lnodeTypeId: string;
    dialog: MdDialog;
    get open(): boolean;
    show(): void;
    close(): void;
    private handleCancel;
    private handleConfirm;
    render(): import("lit").TemplateResult<1>;
    static styles: import("lit").CSSResult;
}
export {};
