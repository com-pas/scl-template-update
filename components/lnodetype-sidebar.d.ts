import { LitElement, PropertyValues } from 'lit';
import { OscdFilledButton } from '@omicronenergy/oscd-ui/button/OscdFilledButton.js';
import { OscdOutlinedTextField } from '@omicronenergy/oscd-ui/textfield/OscdOutlinedTextField.js';
import { OscdList } from '@omicronenergy/oscd-ui/list/OscdList.js';
import { OscdListItem } from '@omicronenergy/oscd-ui/list/OscdListItem.js';
declare const LNodeTypeSidebar_base: typeof LitElement & import("@open-wc/scoped-elements/lit-element.js").ScopedElementsHostConstructor;
export declare class LNodeTypeSidebar extends LNodeTypeSidebar_base {
    static scopedElements: {
        'oscd-filled-button': typeof OscdFilledButton;
        'oscd-outlined-textfield': typeof OscdOutlinedTextField;
        'oscd-list': typeof OscdList;
        'oscd-list-item': typeof OscdListItem;
    };
    lNodeTypes: Element[];
    selectedId?: string;
    filter: string;
    private sortedLNodeTypes;
    private debounceTimer?;
    private static sortLNodeTypes;
    protected willUpdate(changedProperties: PropertyValues<this>): void;
    private handleInput;
    private clearFilter;
    private handleClick;
    get filteredLNodeTypes(): Element[];
    render(): import("lit").TemplateResult<1>;
    static styles: import("lit").CSSResult;
}
export {};
