/* eslint-disable @typescript-eslint/no-unused-vars */
import { LitElement, html, css, TemplateResult } from 'lit';
import { state, query, property } from 'lit/decorators.js';

import { ScopedElementsMixin } from '@open-wc/scoped-elements/lit-element.js';

import { newEditEventV2 } from '@openscd/oscd-api/utils.js';
import { EditV2 } from '@openscd/oscd-api';

import {
  insertSelectedLNodeType,
  lNodeTypeToSelection,
  nsdToJson,
  removeDataType,
  LNodeDescription,
  updateLNodeType,
} from '@openscd/scl-lib';

import { TreeGrid, TreeSelection } from '@openenergytools/tree-grid';

import { OscdOutlinedButton } from '@omicronenergy/oscd-ui/button/OscdOutlinedButton.js';
import { OscdDialog } from '@omicronenergy/oscd-ui/dialog/OscdDialog.js';
import { OscdFab } from '@omicronenergy/oscd-ui/fab/OscdFab.js';
import { OscdIcon } from '@omicronenergy/oscd-ui/icon/OscdIcon.js';
import { OscdCircularProgress } from '@omicronenergy/oscd-ui/progress/OscdCircularProgress.js';
import { OscdOutlinedTextField } from '@omicronenergy/oscd-ui/textfield/OscdOutlinedTextField.js';
import { OscdIconButton } from '@omicronenergy/oscd-ui/iconbutton/OscdIconButton.js';
import { OscdAssistChip } from '@omicronenergy/oscd-ui/chips/OscdAssistChip.js';
import { CdcChildren } from '@openscd/scl-lib/dist/tDataTypeTemplates/nsdToJson.js';

import { AddDataObjectDialog } from './components/add-data-object-dialog.js';
import { DeleteDialog } from './components/delete-lnodetype-dialog.js';
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
  computeOrphanedRemoves,
  getMissingMandatoryFields,
  getEmptyReferencedElements,
  EmptyReferencedElement,
  type MissingMandatoryField,
} from './foundation/utils.js';

export default class NsdTemplateUpdated extends ScopedElementsMixin(
  LitElement
) {
  static scopedElements = {
    'tree-grid': TreeGrid,
    'oscd-fab': OscdFab,
    'oscd-icon': OscdIcon,
    'oscd-dialog': OscdDialog,
    'oscd-outlined-button': OscdOutlinedButton,
    'oscd-circular-progress': OscdCircularProgress,
    'oscd-outlined-text-field': OscdOutlinedTextField,
    'oscd-icon-button': OscdIconButton,
    'oscd-assist-chip': OscdAssistChip,
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

  @query('#dialog-warning')
  warningDialog?: OscdDialog;

  @query('#dialog-choice')
  choiceDialog?: OscdDialog;

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
  lnodeTypeDesc!: OscdOutlinedTextField;

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

  @state()
  missingMandatoryFields: MissingMandatoryField[] = [];

  @state()
  emptyReferencedElements: EmptyReferencedElement[] = [];

  @state()
  missingFieldsCollapsed = false;

  private toggleMissingFieldsPanel(): void {
    this.missingFieldsCollapsed = !this.missingFieldsCollapsed;
  }

  updated(changedProperties: Map<string, unknown>) {
    super.updated?.(changedProperties);
    if (changedProperties.has('doc')) {
      this.resetUI(true);
      this.lNodeTypes = getLNodeTypes(this.doc);
    }

    if (changedProperties.has('editCount') && this.editCount >= 0) {
      this.lNodeTypes = getLNodeTypes(this.doc);
      this.refreshSelectedLNodeType();
    }
  }

  private refreshSelectedLNodeType(): void {
    if (!this.selectedLNodeType) return;

    const selectedId = this.selectedLNodeType.getAttribute('id');
    const updatedLNodeType = getSelectedLNodeType(this.doc!, selectedId!);

    if (!updatedLNodeType) return;

    this.selectedLNodeType = updatedLNodeType;
    this.lNodeTypeDescription = updatedLNodeType.getAttribute('desc') ?? '';

    // Rebuild the tree to show the updated structure after undo/redo
    const selectedLNodeTypeClass = updatedLNodeType.getAttribute('lnClass');
    if (selectedLNodeTypeClass) {
      const { tree } = buildLNodeTree(
        selectedLNodeTypeClass,
        updatedLNodeType,
        this.doc!
      );
      if (tree) {
        const fileSelection = lNodeTypeToSelection(updatedLNodeType);
        this.lNodeTypeSelection = this.cloneSelection(fileSelection);
        this.nsdSelection = this.cloneSelection(fileSelection);
        this.missingMandatoryFields = getMissingMandatoryFields(
          tree,
          this.lNodeTypeSelection
        );
        this.emptyReferencedElements = getEmptyReferencedElements(
          updatedLNodeType,
          this.missingMandatoryFields
        );
        this.treeUI.tree = tree;
        this.treeUI.selection = this.cloneSelection(fileSelection);
        this.treeUI.requestUpdate();
      }
    }
  }

  // eslint-disable-next-line class-methods-use-this
  private cloneSelection(selection: TreeSelection): TreeSelection {
    return JSON.parse(JSON.stringify(selection));
  }

  private resetUI(full: boolean = false): void {
    if (full) {
      this.selectedLNodeType = undefined;
      this.lNodeTypeSelection = undefined;
      this.nsdSelection = undefined;
      this.disableAddDataObjectButton = true;
      this.lNodeTypeDescription = '';
      this.missingMandatoryFields = [];
      this.emptyReferencedElements = [];
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

  private focusTreePath(path: string[]): void {
    if (!this.treeUI || path.length === 0) return;

    const findRow = (targetPath: string[]): HTMLElement | undefined => {
      const rows = Array.from(
        this.treeUI.shadowRoot?.querySelectorAll('md-list-item') ?? []
      );

      return rows.find(item => {
        const value = item.getAttribute('value');
        const parentPath = JSON.parse(item.getAttribute('data-path') ?? '[]');
        const candidatePath = [...parentPath, value].filter(Boolean);
        return (
          candidatePath.length === targetPath.length &&
          candidatePath.every((segment, index) => segment === targetPath[index])
        );
      }) as HTMLElement | undefined;
    };

    const possiblePaths = Array.from({ length: path.length }, (_, index) =>
      path.slice(0, path.length - index)
    );

    const row = possiblePaths
      .map(candidatePath => findRow(candidatePath))
      .find(Boolean) as HTMLElement | undefined;

    if (!row) return;

    // Scroll the row into view with a margin to account for fixed header in CoMPAS
    row.style.scrollMarginTop = `${this.getHeaderOffset()}px`;
    row.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  private getHeaderOffset(): number {
    const value = getComputedStyle(this)
      .getPropertyValue('--app-bar-height')
      .trim();

    return parseFloat(value) || 0;
  }

  // eslint-disable-next-line class-methods-use-this
  private warningPathFromEntry(
    entry: MissingMandatoryField | EmptyReferencedElement
  ): string[] {
    if ('path' in entry) return entry.path;
    return entry.referencePath
      .split('.')
      .map(part => part.trim())
      .filter(Boolean);
  }

  private closeWarningDialog(): void {
    this.warningDialog?.close();
  }

  private closeChoiceDialog(): void {
    this.choiceDialog?.close();
  }

  // eslint-disable-next-line class-methods-use-this
  private applyDescriptionUpdate(
    newLNodeType: Element,
    desc: string,
    currentLNodeType: Element
  ): void {
    const currentDesc = currentLNodeType.getAttribute('desc') ?? '';
    if (desc !== currentDesc) {
      if (desc) {
        newLNodeType.setAttribute('desc', desc);
      } else {
        newLNodeType.removeAttribute('desc');
      }
    }
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
        this.showSuccessFeedback(lnID);
      }
      return;
    }

    const inserts = insertSelectedLNodeType(this.doc, this.nsdSelection, {
      class: lnClass,
      ...(!!desc && { desc }),
      data: this.treeUI.tree as LNodeDescription,
    });

    if (updateSetting === UpdateSetting.Update) {
      const allEdits = this.buildUpdateEdits(
        inserts,
        currentLNodeType,
        lnID,
        desc
      );

      if (allEdits.length > 0) {
        this.dispatchEvent(
          newEditEventV2(allEdits, {
            title: `Update ${lnID}`,
          })
        );
      }

      this.showSuccessFeedback(lnID, 'update');
    } else {
      // Swap mode: Insert new, then remove old LNodeType and orphaned types with squash
      const dataTypeTemplates =
        this.selectedLNodeType!.closest('DataTypeTemplates')!;
      const remove = computeOrphanedRemoves(
        dataTypeTemplates,
        this.selectedLNodeType!.getAttribute('id')!,
        inserts.map(i => (i as { node: Node }).node as Element)
      );

      this.dispatchEvent(newEditEventV2(inserts));
      await this.updateComplete;

      this.dispatchEvent(
        newEditEventV2(remove, { squash: true, title: `Update ${lnID}` })
      );

      const updatedLNodeType = inserts.find(
        insert => (insert.node as Element).tagName === 'LNodeType'
      )?.node as Element;

      const updatedID = updatedLNodeType?.getAttribute('id') ?? lnID;
      this.showSuccessFeedback(updatedID, 'swap');
    }

    await this.updateComplete;
    this.lNodeTypes = getLNodeTypes(this.doc);
  }

  private showSuccessFeedback(
    lnID: string,
    mode: 'update' | 'swap' = 'update'
  ): void {
    this.fabLabel = mode === 'swap' ? `${lnID} swapped!` : `${lnID} updated!`;
    setTimeout(() => {
      this.fabLabel = 'Update Logical Node Type';
    }, 5000);
  }

  private buildUpdateEdits(
    inserts: EditV2[],
    currentLNodeType: Element,
    lnID: string,
    desc: string
  ): EditV2[] {
    const lNodeTypeInsert = inserts.find(
      insert =>
        'node' in insert && (insert.node as Element).tagName === 'LNodeType'
    );

    if (
      lNodeTypeInsert &&
      'node' in lNodeTypeInsert &&
      'parent' in lNodeTypeInsert &&
      'reference' in lNodeTypeInsert
    ) {
      const newLNodeType = (lNodeTypeInsert.node as Element).cloneNode(
        true
      ) as Element;

      newLNodeType.setAttribute('id', lnID);
      this.applyDescriptionUpdate(newLNodeType, desc, currentLNodeType);

      const supportingTypes = inserts.filter(
        insert => insert !== lNodeTypeInsert
      );

      const dataTypeTemplates = currentLNodeType.closest('DataTypeTemplates')!;
      const removeOld = computeOrphanedRemoves(dataTypeTemplates, lnID, [
        newLNodeType,
        ...(supportingTypes as { node: Element }[]).map(i => i.node),
      ]);

      return [
        ...supportingTypes,
        {
          parent: lNodeTypeInsert.parent,
          node: newLNodeType,
          reference: lNodeTypeInsert.reference,
        },
        ...removeOld,
      ];
    }

    if (inserts.length === 0) {
      const newLNodeType = removeDOsNotInSelection(
        currentLNodeType,
        this.nsdSelection!
      );

      newLNodeType.setAttribute('id', lnID);
      this.applyDescriptionUpdate(newLNodeType, desc, currentLNodeType);

      return updateLNodeType(newLNodeType, this.doc!);
    }

    return inserts;
  }

  private updateLNodeTypeDescription(desc: string): void {
    this.lNodeTypeDescription = desc;
    this.dispatchEvent(
      newEditEventV2([
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

  private confirmDelete(): void {
    if (!this.doc || !this.selectedLNodeType) return;

    const lnID = this.selectedLNodeType.getAttribute('id');
    const remove = removeDataType(
      { node: this.selectedLNodeType },
      { force: true }
    );

    this.dispatchEvent(newEditEventV2(remove, { title: `Delete ${lnID}` }));

    this.resetUI(true);
    this.lNodeTypes = getLNodeTypes(this.doc);
  }

  private handleUpdateTemplate(): void {
    if (!this.doc || !this.selectedLNodeType) return;

    const newNsdSelection = filterSelection(
      this.treeUI.tree,
      this.treeUI.selection
    );

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

    const fileSelection = lNodeTypeToSelection(this.selectedLNodeType);
    this.lNodeTypeSelection = this.cloneSelection(fileSelection);
    this.missingMandatoryFields = getMissingMandatoryFields(
      tree,
      this.lNodeTypeSelection
    );
    this.emptyReferencedElements = getEmptyReferencedElements(
      this.selectedLNodeType,
      this.missingMandatoryFields
    );
    this.treeUI.tree = tree;
    this.treeUI.selection = this.cloneSelection(fileSelection);
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
    return html`<oscd-dialog id="dialog-warning">
      <div slot="headline">Warning</div>
      <form slot="content" id="form-id" method="dialog">
        ${this.warningMsg}
      </form>
      <div slot="actions">
        <oscd-outlined-button
          class="button close"
          form="form-id"
          @click="${this.closeWarningDialog}"
          >Close</oscd-outlined-button
        >
      </div>
    </oscd-dialog>`;
  }

  renderChoice(): TemplateResult {
    return html`<oscd-dialog id="dialog-choice">
      <div slot="headline">Warning: Data loss</div>
      <form slot="content" id="form-id" method="dialog">
        The logical node has additional data object not defined in the NSD.
        Updating will lead to loss of data! Do you still want to proceed?
      </form>
      <div slot="actions">
        <oscd-outlined-button
          class="button close"
          form="form-id"
          @click="${this.closeChoiceDialog}"
          >Cancel</oscd-outlined-button
        >
        <oscd-outlined-button
          class="button proceed"
          form="form-id"
          @click="${this.proceedWithDataLoss}"
          >Proceed</oscd-outlined-button
        >
      </div>
    </oscd-dialog>`;
  }

  renderFab(): TemplateResult {
    const disabled =
      !this.treeUI?.tree || Object.keys(this.treeUI?.tree).length === 0;
    return html`<div class="fab-container">
      <oscd-icon-button @click=${() => this.settingsDialog.show()}>
        <oscd-icon>settings</oscd-icon></oscd-icon-button
      ><oscd-fab
        data-testid="update-fab"
        label="${this.fabLabel}"
        class="update-lnode-type"
        ?disabled="${disabled}"
        @click=${this.handleUpdateTemplate}
      ></oscd-fab>
    </div>`;
  }

  renderLNodeTypeControls(): TemplateResult {
    return html` <div class="controls-row">
      <oscd-outlined-button
        ?disabled=${this.disableAddDataObjectButton}
        @click=${this.openAddDataObjectDialog}
      >
        <oscd-icon slot="icon">add</oscd-icon>
        Add Data Object
      </oscd-outlined-button>
      <oscd-outlined-button
        ?disabled=${!this.selectedLNodeType}
        @click=${() => this.deleteDialog.show()}
        class="button-delete"
      >
        <oscd-icon slot="icon">delete</oscd-icon>
        Delete LNode Type
      </oscd-outlined-button>
      <oscd-outlined-text-field
        id="lnodetype-desc"
        label="Description"
        ?disabled=${!this.selectedLNodeType}
        .value=${this.lNodeTypeDescription}
      ></oscd-outlined-text-field>
      ${this.loading
        ? html`<oscd-circular-progress indeterminate></oscd-circular-progress>`
        : ``}
    </div>`;
  }

  renderMissingMandatoryFields(): TemplateResult {
    const totalCount =
      this.missingMandatoryFields.length + this.emptyReferencedElements.length;

    if (totalCount === 0) return html``;

    return html`<div class="mandatory-fields" data-testid="mandatory-fields">
      <button
        class="mandatory-fields-header"
        type="button"
        @click=${this.toggleMissingFieldsPanel}
        aria-expanded=${!this.missingFieldsCollapsed}
      >
        <span>Missing mandatory or empty elements in file</span>
        <oscd-icon
          class="chevron ${this.missingFieldsCollapsed ? 'collapsed' : ''}"
          >expand_more</oscd-icon
        >
      </button>
      ${this.missingFieldsCollapsed
        ? ''
        : html`<div class="mandatory-fields-list">
            ${this.missingMandatoryFields.map(
              field => html`<div class="warning-row">
                <button
                  class="warning-row-main"
                  type="button"
                  @click=${() => this.focusTreePath(field.path)}
                >
                  <oscd-icon>error</oscd-icon>
                  <span class="warning-label">${field.path.join(' / ')}</span>
                </button>
                <span class="pill pill-success"
                  >Auto-fixed on LNodeType update</span
                >
              </div>`
            )}
            ${this.emptyReferencedElements.map(
              element => html`<div class="warning-row">
                <button
                  class="warning-row-main"
                  type="button"
                  title="Empty ${element.tagName}: ${element.id} used by ${element.referencePath}"
                  @click=${() =>
                    this.focusTreePath(this.warningPathFromEntry(element))}
                >
                  <oscd-icon>warning</oscd-icon>
                  <span class="warning-label"
                    >Empty ${element.tagName}: ${element.id} used by
                    ${element.referencePath}</span
                  >
                </button>
                <span class="pill pill-danger">Select a child element</span>
              </div>`
            )}
          </div> `}
    </div>`;
  }

  render() {
    if (!this.doc) return html`<h1>Load SCL document first!</h1>`;

    return html`<div class="container">
        <div class="main-content">
          ${this.renderLNodeTypeControls()}
          ${this.renderMissingMandatoryFields()}
          <tree-grid></tree-grid>
        </div>
        <lnodetype-sidebar
          .lNodeTypes=${this.lNodeTypes}
          .selectedId=${this.selectedLNodeType?.getAttribute('id') ?? ''}
          @lnodetype-select=${this.onLNodeTypeSelect}
        ></lnodetype-sidebar>
      </div>
      ${this.renderFab()} ${this.renderWarning()} ${this.renderChoice()}
      <delete-dialog
        .lnodeTypeId=${this.selectedLNodeType?.getAttribute('id')}
        .onConfirm=${() => this.confirmDelete()}
      ></delete-dialog>
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
      --md-fab-label-text-color: var(--oscd-base2);
      --md-fab-icon-color: var(--oscd-base2);
      font-family: var(--oscd-theme-text-font, 'Roboto');
    }

    h1 {
      color: var(--oscd-base00);
      font-family: var(--oscd-theme-text-font), sans-serif;
      font-weight: 300;
      white-space: nowrap;
      line-height: 48px;
    }

    oscd-outlined-button {
      text-transform: uppercase;
    }

    oscd-icon {
      font-family: var(--oscd-theme-icon-font, 'Material Symbols Outlined');
    }

    .button.close {
      --oscd-outlined-button-label-text-color: var(--oscd-accent-red);
      --oscd-outlined-button-hover-label-text-color: var(--oscd-accent-red);
    }

    .button-delete {
      --oscd-outlined-button-label-text-color: var(--oscd-accent-red);
      --oscd-outlined-button-hover-label-text-color: var(--oscd-accent-red);
      --oscd-outlined-button-focus-label-text-color: var(--oscd-accent-red);
      --oscd-outlined-button-active-label-text-color: var(--oscd-accent-red);
    }

    .button-delete oscd-icon {
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

    .mandatory-fields {
      border: 1px solid rgba(0, 0, 0, 0.12);
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 12px;
      background: var(--oscd-base2);
      color: var(--oscd-base00);
    }

    .mandatory-fields-title {
      font-weight: 600;
      margin-bottom: 8px;
    }

    .mandatory-fields-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      background: transparent;
      border: none;
      padding: 0;
      margin-bottom: 8px;
      cursor: pointer;
      font: inherit;
      font-weight: 600;
      color: var(--oscd-base00);
      text-align: left;
    }

    .mandatory-fields-header .chevron {
      transition: transform 0.15s ease;
    }

    .mandatory-fields-header .chevron.collapsed {
      transform: rotate(-90deg);
    }

    .mandatory-fields-list {
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 2px;
      border-top: 1px solid rgba(0, 0, 0, 0.12);
      padding-top: 4px;
    }

    .warning-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 6px 4px;
    }

    .warning-row-main {
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 0;
      appearance: none;
      border: none;
      background: transparent;
      color: inherit;
      font: inherit;
      text-align: left;
      padding: 0;
      cursor: pointer;
    }

    .warning-row-main:hover .warning-label,
    .warning-row-main:focus-visible .warning-label {
      color: var(--oscd-primary);
    }

    .warning-label {
      text-decoration: underline;
      text-underline-offset: 2px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .pill {
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 20px;
      white-space: nowrap;
      flex-shrink: 0;
    }

    .pill-success {
      background: rgba(42, 161, 152, 0.15);
      color: var(--oscd-accent-green, #2aa198);
    }

    .pill-danger {
      background: rgba(220, 50, 47, 0.15);
      color: var(--oscd-accent-red, #711210);
    }
  `;
}
