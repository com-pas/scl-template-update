/* eslint-disable @typescript-eslint/no-unused-vars */
import { LitElement, html, css, TemplateResult } from 'lit';
import { state, query, property } from 'lit/decorators.js';

import { ScopedElementsMixin } from '@open-wc/scoped-elements/lit-element.js';

import { newEditEvent, Edit } from '@openenergytools/open-scd-core';

import {
  insertSelectedLNodeType,
  lNodeTypeToSelection,
  nsdToJson,
  removeDataType,
  LNodeDescription,
  updateLNodeType,
} from '@openscd/scl-lib';

import { TreeGrid, TreeSelection } from '@openenergytools/tree-grid';

import { MdFilledButton } from '@scopedelement/material-web/button/MdFilledButton.js';
import { MdOutlinedButton } from '@scopedelement/material-web/button/MdOutlinedButton.js';
import { MdDialog } from '@scopedelement/material-web/dialog/MdDialog.js';
import { MdFab } from '@scopedelement/material-web/fab/MdFab.js';
import { MdIcon } from '@scopedelement/material-web/icon/MdIcon.js';
import { MdFilledSelect } from '@scopedelement/material-web/select/MdFilledSelect.js';
import { MdSelectOption } from '@scopedelement/material-web/select/MdSelectOption.js';
import { MdCircularProgress } from '@scopedelement/material-web/progress/circular-progress.js';
import { MdOutlinedTextField } from '@scopedelement/material-web/textfield/MdOutlinedTextField.js';
import { MdIconButton } from '@scopedelement/material-web/iconbutton/MdIconButton.js';
import { CdcChildren } from '@openscd/scl-lib/dist/tDataTypeTemplates/nsdToJson.js';

import { AddDataObjectDialog } from './components/add-data-object-dialog.js';
import { DeleteDialog } from './components/delete-dialog.js';
import { LNodeTypeSidebar } from './components/lnodetype-sidebar.js';
import { SettingsDialog, UpdateSetting } from './components/settings-dialog.js';
import {
  cdClasses,
  TEMPLATE_UPDATE_SETTING_STORAGE_KEY,
} from './foundation/constants.js';
import { buildLNodeTree } from './foundation/tree.js';
import {
  getLNodeTypes,
  getSelectedLNodeType,
  isLNodeTypeReferenced,
  filterSelection,
  removeDOsNotInSelection,
} from './foundation/utils.js';

export default class NsdTemplateUpdated extends ScopedElementsMixin(
  LitElement
) {
  static scopedElements = {
    'tree-grid': TreeGrid,
    'md-filled-select': MdFilledSelect,
    'md-select-option': MdSelectOption,
    'md-fab': MdFab,
    'md-icon': MdIcon,
    'md-dialog': MdDialog,
    'md-filled-button': MdFilledButton,
    'md-outlined-button': MdOutlinedButton,
    'md-circular-progress': MdCircularProgress,
    'md-outlined-text-field': MdOutlinedTextField,
    'md-icon-button': MdIconButton,
    'add-data-object-dialog': AddDataObjectDialog,
    'delete-dialog': DeleteDialog,
    'lnodetype-sidebar': LNodeTypeSidebar,
    'settings-dialog': SettingsDialog,
  };

  @property()
  doc?: XMLDocument;

  @property({ type: Number })
  editCount = -1;

  @query('tree-grid')
  treeUI!: TreeGrid;

  @query('md-filled-select')
  lNodeTypeUI?: MdFilledSelect;

  @query('#dialog-warning')
  warningDialog?: MdDialog;

  @query('#dialog-choice')
  choiceDialog?: MdDialog;

  @query('delete-dialog')
  deleteDialog!: DeleteDialog;

  @query('add-data-object-dialog')
  addDataObjectDialog!: HTMLElement & {
    show: () => void;
    validateForm: () => boolean;
  };

  @query('settings-dialog')
  settingsDialog!: SettingsDialog;

  @query('#lnodetype-desc')
  lnodeTypeDesc!: MdOutlinedTextField;

  @state()
  lNodeTypes: Element[] = [];

  @state()
  selectedLNodeType?: Element;

  @state()
  lNodeTypeSelection?: TreeSelection;

  @state()
  nsdSelection?: TreeSelection;

  @state()
  warningMsg: string = '';

  @state()
  loading = false;

  @state()
  fabLabel: string = 'Update Logical Node Type';

  @state()
  disableAddDataObjectButton = true;

  @state()
  lNodeTypeDescription = '';

  private ignoreNextEditCount = false;

  updated(changedProperties: Map<string, unknown>) {
    super.updated?.(changedProperties);
    if (changedProperties.has('doc')) {
      this.resetUI(true);
      this.lNodeTypes = getLNodeTypes(this.doc);
    }

    if (changedProperties.has('editCount') && this.editCount >= 0) {
      const shouldRebuildTree = !this.ignoreNextEditCount;

      if (this.ignoreNextEditCount) {
        this.ignoreNextEditCount = false;
      }

      this.lNodeTypes = getLNodeTypes(this.doc);
      this.refreshSelectedLNodeType(shouldRebuildTree);
    }
  }

  private refreshSelectedLNodeType(rebuildTree: boolean = true): void {
    if (!this.selectedLNodeType) return;

    const selectedId = this.selectedLNodeType.getAttribute('id');
    const updatedLNodeType = getSelectedLNodeType(this.doc!, selectedId!);

    if (!updatedLNodeType) {
      // Selected LNodeType no longer exists (was deleted), reset UI
      this.resetUI(true);
      return;
    }

    // Update the reference and description to reflect current document state
    this.selectedLNodeType = updatedLNodeType;
    this.lNodeTypeDescription = updatedLNodeType.getAttribute('desc') ?? '';

    if (!rebuildTree) return;

    // Rebuild the tree to show the updated structure after undo/redo
    const selectedLNodeTypeClass = updatedLNodeType.getAttribute('lnClass');
    if (selectedLNodeTypeClass) {
      const { tree } = buildLNodeTree(
        selectedLNodeTypeClass,
        updatedLNodeType,
        this.doc!
      );
      if (tree) {
        this.lNodeTypeSelection = lNodeTypeToSelection(updatedLNodeType);
        this.treeUI.tree = tree;
        this.treeUI.selection = this.lNodeTypeSelection;
        this.treeUI.requestUpdate();
      }
    }
  }

  private resetUI(full: boolean = false): void {
    if (full) {
      this.selectedLNodeType = undefined;
      this.lNodeTypeSelection = undefined;
      this.nsdSelection = undefined;
      this.lNodeTypeUI?.reset();
      this.disableAddDataObjectButton = true;
      this.lNodeTypeDescription = '';
    }
    if (this.treeUI) {
      this.treeUI.tree = {};
      this.treeUI.selection = {};
      this.treeUI.requestUpdate();
    }
  }

  private async openAddDataObjectDialog() {
    this.addDataObjectDialog?.show();
  }

  private showWarning(msg: string): void {
    this.warningMsg = msg;
    this.warningDialog?.show();
  }

  private closeWarningDialog(): void {
    this.warningDialog?.close();
  }

  private closeChoiceDialog(): void {
    this.choiceDialog?.close();
  }

  private async saveTemplates() {
    if (!this.doc || !this.nsdSelection) return;
    const updateSetting =
      localStorage.getItem(TEMPLATE_UPDATE_SETTING_STORAGE_KEY) ||
      UpdateSetting.Update;

    const lnClass = this.selectedLNodeType!.getAttribute('lnClass')!;
    const lnID = this.selectedLNodeType!.getAttribute('id')!;
    const desc = this.lnodeTypeDesc.value;

    const currentLNodeType = getSelectedLNodeType(this.doc, lnID);
    if (!currentLNodeType) return;

    const currentDocumentSelection = lNodeTypeToSelection(currentLNodeType);

    const selectionsMatch =
      JSON.stringify(this.nsdSelection) ===
      JSON.stringify(currentDocumentSelection);
    const currentDesc = currentLNodeType.getAttribute('desc') ?? '';
    const descChanged = currentDesc !== desc;

    if (selectionsMatch) {
      if (this.selectedLNodeType && descChanged) {
        this.updateLNodeTypeDescription(desc);
        this.lNodeTypes = getLNodeTypes(this.doc);
      }
      return;
    }

    const inserts = insertSelectedLNodeType(this.doc, this.nsdSelection, {
      class: lnClass,
      ...(!!desc && { desc }),
      data: this.treeUI.tree as LNodeDescription,
    });

    if (updateSetting === UpdateSetting.Update) {
      const lNodeTypeInsertIndex = inserts.findIndex(
        insert => (insert.node as Element).tagName === 'LNodeType'
      );

      let newLNodeType: Element | undefined;
      let allEdits: Edit[];

      if (lNodeTypeInsertIndex >= 0) {
        // We have a new LNodeType from insertSelectedLNodeType
        const originalInsert = inserts[lNodeTypeInsertIndex];
        newLNodeType = (originalInsert.node as Element).cloneNode(
          true
        ) as Element;
        newLNodeType.setAttribute('id', lnID);

        const currentDescription = currentLNodeType.getAttribute('desc') ?? '';
        if (desc !== currentDescription) {
          if (desc) {
            newLNodeType.setAttribute('desc', desc);
          } else {
            newLNodeType.removeAttribute('desc');
          }
        }

        // Get supporting types (everything except the LNodeType insert)
        const supportingTypes = inserts.filter(
          (_, index) => index !== lNodeTypeInsertIndex
        );

        // Remove the old LNodeType
        const removeOld = removeDataType(
          { node: currentLNodeType },
          { force: true }
        );

        // Create new insert with the modified element
        const newInsert = {
          parent: originalInsert.parent,
          node: newLNodeType,
          reference: originalInsert.reference,
        };

        // Combine: supporting types first, then INSERT new, then remove old
        // This ensures the reference element exists when we do the insert
        allEdits = [...supportingTypes, newInsert, ...removeOld];
      } else if (inserts.length === 0) {
        // Only removals - clone existing and remove DOs
        newLNodeType = removeDOsNotInSelection(
          this.selectedLNodeType!,
          this.nsdSelection!
        );

        newLNodeType.setAttribute('id', lnID);

        const currentDescription = currentLNodeType.getAttribute('desc') ?? '';
        if (desc !== currentDescription) {
          if (desc) {
            newLNodeType.setAttribute('desc', desc);
          } else {
            newLNodeType.removeAttribute('desc');
          }
        }

        const updateEdits = updateLNodeType(newLNodeType, this.doc);
        allEdits = updateEdits;
      } else {
        // Only supporting types, no LNodeType changes
        allEdits = inserts;
      }

      if (allEdits.length > 0) {
        this.dispatchEvent(
          newEditEvent(allEdits, {
            title: `Update ${lnID}`,
          })
        );
      }

      // Update the reference to point to the updated element in the document
      this.selectedLNodeType = getSelectedLNodeType(this.doc, lnID);

      // Update nsdSelection to reflect the actual current state after the edit
      if (this.selectedLNodeType) {
        this.nsdSelection = lNodeTypeToSelection(this.selectedLNodeType);
      }

      this.fabLabel = `${lnID} updated!`;
    } else {
      this.ignoreNextEditCount = true;
      this.dispatchEvent(newEditEvent(inserts));
      await this.updateComplete;

      const remove = removeDataType(
        { node: this.selectedLNodeType! },
        { force: true }
      );
      this.ignoreNextEditCount = true;
      this.dispatchEvent(
        newEditEvent(remove, { squash: true, title: `Update ${lnID}` })
      );

      const updatedLNodeType = inserts.find(
        insert => (insert.node as Element).tagName === 'LNodeType'
      )?.node as Element;

      if (updatedLNodeType) {
        const updatedLNodeTypeID = updatedLNodeType.getAttribute('id');
        this.selectedLNodeType = updatedLNodeType;
        await this.updateComplete;

        if (this.lNodeTypeUI && updatedLNodeType) {
          this.lNodeTypeUI.value = updatedLNodeType.getAttribute('id') ?? '';
        }

        this.fabLabel = `${updatedLNodeTypeID} swapped!`;
      }
    }

    await this.updateComplete;
    this.lNodeTypes = getLNodeTypes(this.doc);

    setTimeout(() => {
      this.fabLabel = 'Update Logical Node Type';
    }, 5000);
  }

  private updateLNodeTypeDescription(desc: string): void {
    this.ignoreNextEditCount = true;
    this.lNodeTypeDescription = desc;
    this.dispatchEvent(
      newEditEvent([
        {
          element: this.selectedLNodeType!,
          attributes: { desc: desc || null },
          attributesNS: {},
        },
      ])
    );
  }

  private proceedWithDataLoss() {
    this.closeChoiceDialog();
    this.saveTemplates();
  }

  private handleDeleteLNodeType(): void {
    if (!this.doc || !this.selectedLNodeType) return;

    const lnID = this.selectedLNodeType.getAttribute('id');
    this.deleteDialog.lnodeTypeId = lnID || '';
    this.deleteDialog.message = `Are you sure you want to delete ${lnID}? This action can have severe consequences.`;
    this.deleteDialog.onConfirm = () => this.confirmDelete();
    this.deleteDialog.show();
  }

  private confirmDelete(): void {
    if (!this.doc || !this.selectedLNodeType) return;

    const lnID = this.selectedLNodeType.getAttribute('id');
    const remove = removeDataType(
      { node: this.selectedLNodeType },
      { force: true }
    );

    this.ignoreNextEditCount = true;
    this.dispatchEvent(newEditEvent(remove, { title: `Delete ${lnID}` }));

    this.resetUI(true);
    this.lNodeTypes = getLNodeTypes(this.doc);
  }

  private handleUpdateTemplate(): void {
    if (!this.doc || !this.selectedLNodeType) return;

    const newNsdSelection = filterSelection(
      this.treeUI.tree,
      this.treeUI.selection
    );

    // Only update nsdSelection if the user's selection has actually changed
    // This prevents overwriting the document-synced selection from a previous update
    if (JSON.stringify(newNsdSelection) !== JSON.stringify(this.nsdSelection)) {
      this.nsdSelection = newNsdSelection;
    }

    if (
      JSON.stringify(this.treeUI.selection) !== JSON.stringify(newNsdSelection)
    ) {
      this.choiceDialog?.show();
      return;
    }

    this.saveTemplates();
  }

  async onLNodeTypeSelect(e: CustomEvent): Promise<void> {
    const id = e.detail?.id;
    this.disableAddDataObjectButton = true;
    this.loading = true;
    this.selectedLNodeType = getSelectedLNodeType(this.doc!, id);
    this.lNodeTypeDescription =
      this.selectedLNodeType?.getAttribute('desc') ?? '';
    // Let the browser render the loader before heavy work
    await new Promise(resolve => {
      setTimeout(resolve, 0);
    });

    this.resetUI(false);

    const selectedLNodeTypeClass =
      this.selectedLNodeType?.getAttribute('lnClass');

    if (!selectedLNodeTypeClass || !this.selectedLNodeType) {
      this.loading = false;
      return;
    }

    const { tree, unsupportedDOs } = buildLNodeTree(
      selectedLNodeTypeClass,
      this.selectedLNodeType,
      this.doc!
    );

    if (!tree) {
      this.loading = false;
      this.showWarning('Selected Logical Node Class not defined in the NSD.');
      return;
    }

    if (unsupportedDOs.length > 0) {
      this.showWarning(
        'The selected logical node type contains user-defined data objects with unsupported CDCs.'
      );
    }

    this.disableAddDataObjectButton = false;
    const selectedLNodeTypeID = this.selectedLNodeType.getAttribute('id');
    const isReferenced = isLNodeTypeReferenced(this.doc!, selectedLNodeTypeID);

    this.lNodeTypeSelection = lNodeTypeToSelection(this.selectedLNodeType);
    this.treeUI.tree = tree;
    this.treeUI.selection = this.lNodeTypeSelection;
    this.requestUpdate();
    this.treeUI.requestUpdate();
    await this.updateComplete;
    this.loading = false;

    if (isReferenced)
      this.showWarning(
        'The selected logical node type is referenced. This plugin should be used during specification only.'
      );
  }

  private addDataObjectToTree(
    cdcType: (typeof cdClasses)[number],
    doName: string,
    namespace: string | null
  ): void {
    let cdcChildren = nsdToJson(cdcType) as CdcChildren;

    if (namespace) {
      cdcChildren = {
        ...cdcChildren,
        dataNs: {
          ...cdcChildren?.dataNs,
          mandatory: true,
          val: namespace,
        },
      };
    }

    const newDataObject = {
      [doName]: {
        tagName: 'DataObject',
        type: cdcType,
        descID: '',
        presCond: 'O',
        children: cdcChildren,
      },
    };
    Object.assign(this.treeUI.tree, newDataObject);
    this.treeUI.requestUpdate();
  }

  private handleAddDOConfirm = (
    cdcType: string,
    doName: string,
    namespace: string | null
  ): void => {
    if (!this.addDataObjectDialog?.validateForm()) return;

    this.addDataObjectToTree(
      cdcType as (typeof cdClasses)[number],
      doName,
      namespace
    );
  };

  // eslint-disable-next-line class-methods-use-this
  renderWarning(): TemplateResult {
    return html`<md-dialog id="dialog-warning">
      <div slot="headline">Warning</div>
      <form slot="content" id="form-id" method="dialog">
        ${this.warningMsg}
      </form>
      <div slot="actions">
        <md-outlined-button
          class="button close"
          form="form-id"
          @click="${this.closeWarningDialog}"
          >Close</md-outlined-button
        >
      </div>
    </md-dialog>`;
  }

  renderChoice(): TemplateResult {
    return html`<md-dialog id="dialog-choice">
      <div slot="headline">Warning: Data loss</div>
      <form slot="content" id="form-id" method="dialog">
        The logical node has additional data object not defined in the NSD.
        Updating will lead to loss of data! Do you still want to proceed?
      </form>
      <div slot="actions">
        <md-outlined-button
          class="button close"
          form="form-id"
          @click="${this.closeChoiceDialog}"
          >Cancel</md-outlined-button
        >
        <md-outlined-button
          class="button proceed"
          form="form-id"
          @click="${this.proceedWithDataLoss}"
          >Proceed</md-outlined-button
        >
      </div>
    </md-dialog>`;
  }

  renderFab(): TemplateResult {
    const disabled =
      !this.treeUI?.tree || Object.keys(this.treeUI?.tree).length === 0;
    return html`<div class="fab-container">
      <md-icon-button @click=${() => this.settingsDialog.show()}>
        <md-icon>settings</md-icon> </md-icon-button
      ><md-fab
        label="${this.fabLabel}"
        class="update-lnode-type"
        ?disabled="${disabled}"
        @click=${this.handleUpdateTemplate}
      ></md-fab>
    </div>`;
  }

  renderLNodeTypeControls(): TemplateResult {
    return html` <div class="controls-row">
      <md-outlined-button
        ?disabled=${this.disableAddDataObjectButton}
        @click=${this.openAddDataObjectDialog}
      >
        <md-icon slot="icon">add</md-icon>
        Add Data Object
      </md-outlined-button>
      <md-outlined-button
        ?disabled=${!this.selectedLNodeType}
        @click=${this.handleDeleteLNodeType}
        class="button-delete"
      >
        <md-icon slot="icon">delete</md-icon>
        Delete Logical Node Type
      </md-outlined-button>
      <md-outlined-text-field
        id="lnodetype-desc"
        label="Description"
        ?disabled=${!this.selectedLNodeType}
        .value=${this.lNodeTypeDescription}
      ></md-outlined-text-field>
      ${this.loading
        ? html`<md-circular-progress indeterminate></md-circular-progress>`
        : ``}
    </div>`;
  }

  render() {
    if (!this.doc) return html`<h1>Load SCL document first!</h1>`;

    return html`<div class="container">
        <div class="main-content">
          ${this.renderLNodeTypeControls()}
          <tree-grid></tree-grid>
        </div>
        <lnodetype-sidebar
          .lNodeTypes=${this.lNodeTypes}
          .selectedId=${this.selectedLNodeType?.getAttribute('id') ?? ''}
          @lnodetype-select=${this.onLNodeTypeSelect}
        ></lnodetype-sidebar>
      </div>
      ${this.renderFab()} ${this.renderWarning()} ${this.renderChoice()}
      <delete-dialog></delete-dialog>
      <add-data-object-dialog
        .cdClasses=${cdClasses}
        .tree=${this.treeUI?.tree}
        .onConfirm=${this.handleAddDOConfirm}
      ></add-data-object-dialog>
      <settings-dialog></settings-dialog>`;
  }

  static styles = css`
    :host {
      --app-bar-height: 64px;
      --tab-bar-height: 48px;
      --header-height: calc(var(--app-bar-height) + var(--tab-bar-height));
      --sidebar-width: 330px;
    }

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
      --md-list-item-activated-background: rgb(
        from var(--oscd-primary) r g b / 0.38
      );
      --md-menu-item-selected-container-color: rgb(
        from var(--oscd-primary) r g b / 0.38
      );
      --md-list-container-color: var(--oscd-base2);
      --md-fab-container-color: var(--oscd-secondary);
      --md-dialog-container-color: var(--oscd-base3);
      font-family: var(--oscd-theme-text-font, 'Roboto');
    }

    h1 {
      color: var(--oscd-base00);
      font-family: var(--oscd-theme-text-font), sans-serif;
      font-weight: 300;
      white-space: nowrap;
      line-height: 48px;
    }

    md-outlined-button {
      text-transform: uppercase;
    }

    md-icon {
      font-family: var(--oscd-theme-icon-font, 'Material Symbols Outlined');
    }

    .button.close {
      --md-outlined-button-label-text-color: var(--oscd-accent-red);
      --md-outlined-button-hover-label-text-color: var(--oscd-accent-red);
    }

    .button-delete md-icon {
      color: var(--oscd-accent-red);
    }

    .container {
      display: grid;
      grid-template-columns: auto var(--sidebar-width);
      min-height: calc(100vh - var(--header-height));
    }

    .main-content {
      margin: 12px;
    }

    lnodetype-sidebar {
      position: sticky;
      top: var(--app-bar-height);
      height: calc(100vh - var(--app-bar-height));
      max-height: calc(100vh - var(--app-bar-height));
      width: var(--sidebar-width);
      z-index: 1;
      right: 0;
      overflow: hidden;
      background: #fcf6e5;
    }

    .update-lnode-type[disabled] {
      pointer-events: none;
      opacity: 0.6;
    }

    .controls-row {
      display: flex;
      gap: 12px;
      margin-bottom: 12px;
      align-items: stretch;
    }

    .fab-container {
      position: fixed;
      align-items: center;
      bottom: 32px;
      right: calc(var(--sidebar-width) + 32px);
      display: flex;
      gap: 16px;
      width: max-content;
    }
  `;
}
