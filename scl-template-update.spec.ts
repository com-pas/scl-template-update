/* eslint-disable import/no-duplicates */
/* eslint-disable no-unused-expressions */
import { fixture, expect, html, waitUntil } from '@open-wc/testing';
import { restore, SinonSpy, spy } from 'sinon';

import '@openenergytools/open-scd-core/open-scd.js';
import { OpenSCD } from '@openenergytools/open-scd-core/open-scd.js';
import { Insert, newOpenEvent, Remove } from '@openenergytools/open-scd-core';

import {
  extension,
  lln0Selection,
  mmxuExceptSelection,
  mmxuSelection,
  nsdSpeced,
  customDataObjectInvalidCDC,
} from './scl-template-update.testfiles.js';
import './scl-template-update.js';
import NsdTemplateUpdated from './scl-template-update.js';

const plugins = {
  editor: [
    {
      name: 'Update Template',
      translations: {
        de: 'Update Template',
      },
      icon: 'edit',
      active: true,
      requireDoc: false,
      src: '/dist/scl-template-update.js',
    },
  ],
};

describe('NsdTemplateUpdater', () => {
  let openSCD: OpenSCD;
  let element: NsdTemplateUpdated;
  beforeEach(async () => {
    openSCD = await fixture(
      html`<open-scd plugins="${JSON.stringify(plugins)}"></open-scd>`
    );
    await new Promise(res => {
      setTimeout(res, 200);
    });
    element = openSCD.shadowRoot?.querySelector(
      'oscd-p837a28e71799d7bc'
    ) as NsdTemplateUpdated;
  });

  it('shows notification without loaded doc', () => {
    expect(element.shadowRoot?.querySelector('h1')).to.exist;
    expect(element.shadowRoot?.querySelector('tree-grid')).to.not.exist;
    expect(element.shadowRoot?.querySelector('md-fab')).to.not.exist;
  });

  describe('given a nsd specced document', () => {
    let listener: SinonSpy;
    afterEach(restore);
    beforeEach(async () => {
      listener = spy();
      openSCD.addEventListener('oscd-edit-v2', listener);
      const doc = new DOMParser().parseFromString(nsdSpeced, 'application/xml');
      openSCD.dispatchEvent(newOpenEvent(doc, 'SomeDoc'));
      await new Promise(res => {
        setTimeout(res, 200);
      });
    });

    it('displays an action button', () =>
      expect(element.shadowRoot?.querySelector('md-fab')).to.exist);

    it('updates MMXU on action button click', async () => {
      // Test the default 'update' behavior
      localStorage.removeItem('template-update-setting');

      const event = {
        detail: { id: 'MMXU$oscd$_c53e78191fabefa3' },
      } as CustomEvent;
      element.onLNodeTypeSelect(event);
      await new Promise(res => {
        setTimeout(res, 0);
      });

      element.treeUI.selection = mmxuSelection;
      await element.updateComplete;

      (element.shadowRoot?.querySelector('md-fab') as HTMLElement).click();
      await element.updateComplete;

      expect(listener).to.have.been.calledOnce;
      const updateEdits = listener.args[0][0].detail.edit;
      expect(updateEdits).to.have.length.greaterThan(0);

      expect(listener.args[0][0].detail.title).to.equal(
        'Update MMXU$oscd$_c53e78191fabefa3'
      );
    }).timeout(5000);

    it('swaps MMXU when swap mode is configured', async () => {
      localStorage.setItem('template-update-setting', 'swap');

      const event = {
        detail: { id: 'MMXU$oscd$_c53e78191fabefa3' },
      } as CustomEvent;
      element.onLNodeTypeSelect(event);
      await new Promise(res => {
        setTimeout(res, 0);
      });

      element.treeUI.selection = mmxuSelection;
      await element.updateComplete;

      (element.shadowRoot?.querySelector('md-fab') as HTMLElement).click();
      await element.updateComplete;

      const inserts = listener.args[0][0].detail.edit;
      const removes = listener.args[1][0].detail.edit;
      expect(inserts).to.have.lengthOf(5);
      expect(removes).to.have.lengthOf(2);

      expect(
        ((inserts[0] as Insert).node as Element).getAttribute('id')
      ).to.equal('MMXU$oscd$_b96484e663b92760');
      expect(
        ((inserts[1] as Insert).node as Element).getAttribute('id')
      ).to.equal('Beh$oscd$_954939784529ca3d');
      expect(
        ((inserts[2] as Insert).node as Element).getAttribute('id')
      ).to.equal('phsB$oscd$_65ee65af9248ae5d');
      expect(
        ((inserts[3] as Insert).node as Element).getAttribute('id')
      ).to.equal('A$oscd$_ad714f2a7845e863');
      expect(
        ((inserts[4] as Insert).node as Element).getAttribute('id')
      ).to.equal('stVal$oscd$_2ff6286b1710bcc1');

      expect(
        ((removes[0] as Remove).node as Element).getAttribute('id')
      ).to.equal('MMXU$oscd$_c53e78191fabefa3');
      expect(
        ((removes[1] as Remove).node as Element).getAttribute('id')
      ).to.equal('A$oscd$_41824603f63b26ac');
    }).timeout(5000);

    it('updates LLN0 on action button click', async () => {
      localStorage.removeItem('template-update-setting');

      const event = {
        detail: { id: 'LLN0$oscd$_85c7ffbe25d80e63' },
      } as CustomEvent;
      element.onLNodeTypeSelect(event);
      await new Promise(res => {
        setTimeout(res, 0);
      });

      element.treeUI.selection = lln0Selection; // change selection
      await element.updateComplete;

      (element.shadowRoot?.querySelector('md-fab') as HTMLElement).click();
      await new Promise(res => {
        setTimeout(res, 200);
      });

      expect(listener).to.have.been.calledOnce;
      const updateEdits = listener.args[0][0].detail.edit;
      expect(updateEdits).to.have.length.greaterThan(0);

      // Verify the edit has the correct title
      expect(listener.args[0][0].detail.title).to.equal(
        'Update LLN0$oscd$_85c7ffbe25d80e63'
      );
    }).timeout(5000);

    it('does not update with same selection', async () => {
      const event = {
        detail: { id: 'LLN0$oscd$_85c7ffbe25d80e63' },
      } as CustomEvent;
      element.onLNodeTypeSelect(event);
      await element.updateComplete;

      (element.shadowRoot?.querySelector('md-fab') as HTMLElement).click();
      await new Promise(res => {
        setTimeout(res, 200);
      });

      expect(listener).to.not.have.been.called;
    });

    it('shows the data loss dialog if (part of) selection is not in tree', async () => {
      element.selectedLNodeType = element.doc?.querySelector('LNodeType')!;
      element.treeUI.tree = { foo: {} };
      element.treeUI.selection = { foo: {}, bar: {} };
      element.treeUI.requestUpdate = () => {};
      element.nsdSelection = { foo: {} };

      (element as any).handleUpdateTemplate();
      await waitUntil(() => element.choiceDialog?.open);
      expect(element.choiceDialog?.open).to.be.true;
      expect(element.choiceDialog).shadowDom.to.equalSnapshot();
    });
  });

  describe('given a non nsd specced document', () => {
    let listener: SinonSpy;
    afterEach(restore);
    beforeEach(async () => {
      listener = spy();
      openSCD.addEventListener('oscd-edit-v2', listener);
      const doc = new DOMParser().parseFromString(extension, 'application/xml');
      openSCD.dispatchEvent(newOpenEvent(doc, 'SomeDoc'));
      await new Promise(res => {
        setTimeout(res, 200);
      });
    });

    it('does not load non NSD ln classes', async () => {
      const event = { detail: { id: 'invalidLnClass' } } as CustomEvent;
      element.onLNodeTypeSelect(event);
      await new Promise(res => {
        setTimeout(res, 50);
      });

      expect(JSON.stringify(element.treeUI.tree)).to.equal('{}');
      expect(element.warningDialog?.getAttribute('open')).to.not.be.null;
    });

    it('notifies with LNodeType is referenced', async () => {
      const event = {
        detail: { id: 'LLN0$oscd$_85c7ffbe25d80e63' },
      } as CustomEvent;
      element.onLNodeTypeSelect(event);
      await new Promise(res => {
        setTimeout(res, 200);
      });

      expect(element.warningDialog?.getAttribute('open')).to.not.be.null;
      expect(
        element.warningDialog?.querySelector('form')?.textContent
      ).to.include(
        `The selected logical node type is referenced. This plugin should be used during specification only.`
      );
    });

    it('updates MMXU on action button click', async () => {
      localStorage.removeItem('template-update-setting');

      const event = {
        detail: { id: 'MMXU$oscd$_c53e78191fabefa3' },
      } as CustomEvent;
      element.onLNodeTypeSelect(event);
      await new Promise(res => {
        setTimeout(res, 0);
      });

      element.treeUI.selection = mmxuExceptSelection;
      await element.updateComplete;

      (element.shadowRoot?.querySelector('md-fab') as HTMLElement).click();
      await element.updateComplete;

      (
        element.choiceDialog?.querySelector('.button.proceed') as HTMLElement
      ).click();
      await element.updateComplete;

      expect(listener).to.have.been.called;
      const firstCall = listener.args[0][0].detail;
      expect(firstCall.edit).to.have.length.greaterThan(0);
      expect(firstCall.title).to.equal('Update MMXU$oscd$_c53e78191fabefa3');
    }).timeout(5000);

    it('updates the selected LNodeType when the description is changed', async () => {
      const event = {
        detail: { id: 'LLN0$oscd$_85c7ffbe25d80e63' },
      } as CustomEvent;
      element.onLNodeTypeSelect(event);
      await new Promise(res => {
        setTimeout(res, 0);
      });

      element.lnodeTypeDesc.value = 'New Description';
      await element.updateComplete;

      (element.shadowRoot?.querySelector('md-fab') as HTMLElement).click();
      await element.updateComplete;
      expect(listener).to.have.been.called;
    });

    it('does not delete LNodeType when clicking update twice with same selection', async () => {
      localStorage.removeItem('template-update-setting');

      const event = {
        detail: { id: 'MMXU$oscd$_c53e78191fabefa3' },
      } as CustomEvent;
      element.onLNodeTypeSelect(event);
      await new Promise(res => {
        setTimeout(res, 0);
      });

      element.treeUI.selection = mmxuSelection;
      await element.updateComplete;

      // First update
      (element.shadowRoot?.querySelector('md-fab') as HTMLElement).click();
      await element.updateComplete;
      expect(listener).to.have.been.calledOnce;

      // Second update with same selection should not delete the LNodeType
      listener.resetHistory();
      (element.shadowRoot?.querySelector('md-fab') as HTMLElement).click();
      await element.updateComplete;

      // Verify LNodeType still exists in document
      const lNodeType = element.doc?.querySelector(
        'LNodeType[id="MMXU$oscd$_c53e78191fabefa3"]'
      );
      expect(lNodeType).to.exist;
    }).timeout(5000);

    it('successfully removes data objects from LNodeType', async () => {
      localStorage.removeItem('template-update-setting');

      const event = {
        detail: { id: 'MMXU$oscd$_c53e78191fabefa3' },
      } as CustomEvent;
      element.onLNodeTypeSelect(event);
      await new Promise(res => {
        setTimeout(res, 0);
      });

      // Remove the 'A' data object by not including it in selection
      const selectionWithoutA = {
        Beh: {
          q: {},
          stVal: {
            blocked: {},
            on: {},
            'test/blocked': {},
          },
          t: {},
        },
      };

      element.treeUI.selection = selectionWithoutA;
      await element.updateComplete;

      (element.shadowRoot?.querySelector('md-fab') as HTMLElement).click();
      await element.updateComplete;

      expect(listener).to.have.been.called;
      const updateEdits = listener.args[0][0].detail.edit;
      expect(updateEdits).to.have.length.greaterThan(0);

      // Verify the LNodeType was updated (not deleted)
      const lNodeType = element.doc?.querySelector(
        'LNodeType[id="MMXU$oscd$_c53e78191fabefa3"]'
      );
      expect(lNodeType).to.exist;

      // Verify 'A' DO was removed
      const doA = lNodeType?.querySelector('DO[name="A"]');
      expect(doA).to.not.exist;

      // Verify 'Beh' DO still exists
      const doBeh = lNodeType?.querySelector('DO[name="Beh"]');
      expect(doBeh).to.exist;
    }).timeout(5000);

    it('updates description when making selection changes', async () => {
      localStorage.removeItem('template-update-setting');

      const event = {
        detail: { id: 'MMXU$oscd$_c53e78191fabefa3' },
      } as CustomEvent;
      element.onLNodeTypeSelect(event);
      await new Promise(res => {
        setTimeout(res, 0);
      });

      // Change both selection and description
      element.treeUI.selection = mmxuSelection;
      element.lnodeTypeDesc.value = 'Updated with new DOs';
      await element.updateComplete;

      (element.shadowRoot?.querySelector('md-fab') as HTMLElement).click();
      await element.updateComplete;

      expect(listener).to.have.been.called;

      // Verify the description was updated
      const lNodeType = element.doc?.querySelector(
        'LNodeType[id="MMXU$oscd$_c53e78191fabefa3"]'
      );
      expect(lNodeType?.getAttribute('desc')).to.equal('Updated with new DOs');
    }).timeout(5000);

    it('clears description when set to empty string', async () => {
      localStorage.removeItem('template-update-setting');

      const event = {
        detail: { id: 'MMXU$oscd$_c53e78191fabefa3' },
      } as CustomEvent;
      element.onLNodeTypeSelect(event);
      await new Promise(res => {
        setTimeout(res, 0);
      });

      // First add a description
      element.lnodeTypeDesc.value = 'Test Description';
      await element.updateComplete;
      (element.shadowRoot?.querySelector('md-fab') as HTMLElement).click();
      await element.updateComplete;

      listener.resetHistory();

      // Now clear the description
      element.lnodeTypeDesc.value = '';
      await element.updateComplete;
      (element.shadowRoot?.querySelector('md-fab') as HTMLElement).click();
      await element.updateComplete;

      expect(listener).to.have.been.called;

      // Verify the description attribute was removed
      const lNodeType = element.doc?.querySelector(
        'LNodeType[id="MMXU$oscd$_c53e78191fabefa3"]'
      );
      expect(lNodeType?.hasAttribute('desc')).to.be.false;
    }).timeout(5000);
  });

  describe('given a document with unsupported CDC', () => {
    afterEach(restore);
    beforeEach(async () => {
      openSCD.addEventListener('oscd-edit-v2', () => {});
      const doc = new DOMParser().parseFromString(
        customDataObjectInvalidCDC,
        'application/xml'
      );
      openSCD.dispatchEvent(newOpenEvent(doc, 'SomeDoc'));
      await new Promise(res => {
        setTimeout(res, 200);
      });
      await element.updateComplete;
      const treeUI = element.shadowRoot?.querySelector('tree-grid') as any;
      if (treeUI) {
        treeUI.tree = {};
        treeUI.requestUpdate = () => {};
      }
    });

    it('shows a warning dialog when a lnode type has user defined DOs with unsupported CDC', async () => {
      const event = {
        detail: { id: 'MMXU$oscd$_c53e78191fabefa3' },
      } as CustomEvent;
      element.onLNodeTypeSelect(event);
      await new Promise(res => {
        setTimeout(res, 0);
      });

      element.treeUI.selection = mmxuSelection;
      await element.updateComplete;

      (element.shadowRoot?.querySelector('md-fab') as HTMLElement).click();
      await element.updateComplete;

      expect(element.warningDialog?.getAttribute('open')).to.not.be.null;
      expect(
        element.warningDialog?.querySelector('form')?.textContent
      ).to.include(
        'The selected logical node type contains user-defined data objects with unsupported CDCs.'
      );
    });

    it('adds a data object to the tree when form is valid', async () => {
      const dialog = element.shadowRoot?.querySelector(
        'add-data-object-dialog'
      ) as HTMLElement & { show: () => void };
      dialog.show();

      const cdcSelect = dialog.shadowRoot?.querySelector(
        '#cdc-type'
      ) as HTMLSelectElement;
      const doNameField = dialog.shadowRoot?.querySelector(
        '#do-name'
      ) as HTMLInputElement;
      const namespaceField = dialog.shadowRoot?.querySelector(
        '#namespace'
      ) as HTMLInputElement;

      cdcSelect.value = 'WYE';
      doNameField.value = 'TestDO';
      namespaceField.value = 'CustomNamespace';

      cdcSelect.dispatchEvent(new Event('input', { bubbles: true }));
      doNameField.dispatchEvent(new Event('input', { bubbles: true }));
      // Submit the form
      const form = dialog.shadowRoot?.querySelector('form')!;
      form.dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true })
      );
      await element.updateComplete;

      expect(element.treeUI.tree).to.have.property('TestDO');
      expect(element.treeUI.tree.TestDO).to.include({
        type: 'WYE',
        tagName: 'DataObject',
        descID: '',
        presCond: 'O',
      });
    });

    it('does not add a data object if form is invalid', async () => {
      const dialog = element.shadowRoot?.querySelector(
        'add-data-object-dialog'
      ) as HTMLElement & { show: () => void };
      dialog.show();
      await element.updateComplete;
      const form = dialog.shadowRoot?.querySelector('form')!;
      form.dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true })
      );
      await element.updateComplete;
      expect(element.treeUI.tree).to.not.have.property('TestDO');
    });
  });
});
