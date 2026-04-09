import { LitElement } from 'lit';
import { OscdDialog } from '@omicronenergy/oscd-ui/dialog/OscdDialog.js';
import { OscdOutlinedButton } from '@omicronenergy/oscd-ui/button/OscdOutlinedButton.js';
declare const DeleteDialog_base: typeof LitElement & import("@open-wc/scoped-elements/lit-element.js").ScopedElementsHostConstructor;
export declare class DeleteDialog extends DeleteDialog_base {
    static scopedElements: {
        'oscd-dialog': typeof OscdDialog;
        'oscd-outlined-button': typeof OscdOutlinedButton;
    };
    onConfirm: () => void;
    lnodeTypeId: string;
    dialog: OscdDialog;
    get open(): boolean;
    show(): void;
    close(): void;
    private handleCancel;
    private handleConfirm;
    render(): import("lit").TemplateResult<1>;
    static styles: import("lit").CSSResult;
}
export {};
