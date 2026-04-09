/* eslint-disable no-unused-expressions */
import { fixture, expect, html } from '@open-wc/testing';
import { SinonSpy, spy } from 'sinon';
import { AddDataObjectDialog } from './add-data-object-dialog.js';

const cdClasses = ['WYE', 'DEL', 'SAV', 'ORG'];
const tree = {
  TestDO1: {
    presCond: 'Omulti',
    type: 'WYE',
  },
  Beh: {
    presCond: '0',
    type: 'ORG',
  },
  AnotherDO1: {
    presCond: 'Omulti',
    type: 'DEL',
  },
};

customElements.define('add-data-object-dialog', AddDataObjectDialog);

describe('AddDataObjectDialog', () => {
  let dialog: AddDataObjectDialog;
  let confirmSpy: SinonSpy;

  beforeEach(async () => {
    confirmSpy = spy();

    dialog = await fixture(
      html`<add-data-object-dialog
        .cdClasses=${cdClasses}
        .tree=${tree}
        .onConfirm=${confirmSpy}
      ></add-data-object-dialog>`
    );
  });

  afterEach(async () => {
    dialog.remove();
  });

  it('renders dialog', () => {
    expect(dialog.createDOdialog.open).to.be.false;
    dialog.show();
    expect(dialog.shadowRoot?.querySelector('oscd-dialog')).to.exist;
    expect(dialog.shadowRoot?.querySelector('oscd-filled-select')).to.exist;
    expect(dialog.shadowRoot?.querySelector('oscd-outlined-text-field')).to
      .exist;
    cdClasses.forEach(cdClass => {
      expect(dialog.shadowRoot?.textContent).to.include(cdClass);
    });
  });

  it('should call onConfirm for valid form', async () => {
    dialog.show();
    await dialog.updateComplete;

    const type = 'WYE';
    const doName = 'TestDO2';

    dialog.cdcType.value = type;
    dialog.doName.value = doName;
    await dialog.updateComplete;

    const form = dialog.shadowRoot?.querySelector('form') as HTMLFormElement;
    const submitEvent = new Event('submit', {
      bubbles: true,
      cancelable: true,
    });
    form.dispatchEvent(submitEvent);

    await dialog.updateComplete;

    expect(confirmSpy.callCount).to.equal(1);
    expect(confirmSpy.calledWith(type, doName, null)).to.be.true;
  });

  it('clears form fields on close', async () => {
    dialog.show();
    const [firstCdClass] = cdClasses;
    dialog.cdcType.value = firstCdClass;
    dialog.doName.value = 'TestDO';
    dialog.namespace.value = 'CustomNamespace';
    await dialog.updateComplete;
    dialog.close();
    expect(dialog.cdcType.value).to.equal('');
    expect(dialog.doName.value).to.equal('');
  });

  describe('input validation', () => {
    beforeEach(() => {
      dialog.show();
    });

    it('validates required fields when form is empty', async () => {
      expect(dialog.cdcType.error).to.be.false;
      expect(dialog.doName.error).to.be.false;

      const form = dialog.shadowRoot!.querySelector('form')!;
      form.dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true })
      );
      await dialog.updateComplete;

      expect(dialog.cdcType.error).to.be.true;
      expect(dialog.cdcType.errorText).to.equal(
        'Please select a common data class.'
      );
      expect(dialog.doName.error).to.be.true;
      expect(dialog.doName.errorText).to.equal('Not a valid DO name.');
      expect(confirmSpy.callCount).to.equal(0);
    });

    it('validates DO name pattern (must start with uppercase letter)', async () => {
      dialog.cdcType.value = 'WYE';
      dialog.doName.value = 'testDO';

      const form = dialog.shadowRoot!.querySelector('form')!;
      form.dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true })
      );
      await dialog.updateComplete;

      expect(dialog.doName.error).to.be.true;
      expect(dialog.doName.errorText).to.equal('Not a valid DO name.');
      expect(confirmSpy.callCount).to.equal(0);
    });

    it('validates DO name pattern (invalid characters)', async () => {
      dialog.cdcType.value = 'WYE';
      dialog.doName.value = 'Test-DO';

      const form = dialog.shadowRoot!.querySelector('form')!;
      form.dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true })
      );
      await dialog.updateComplete;

      expect(dialog.doName.error).to.be.true;
      expect(dialog.doName.errorText).to.equal('Not a valid DO name.');
      expect(confirmSpy.callCount).to.equal(0);
    });

    it('should set "DO name already in use" error', async () => {
      dialog.cdcType.value = 'ORG';
      dialog.doName.value = 'Beh';

      const form = dialog.shadowRoot!.querySelector('form')!;
      form.dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true })
      );
      await dialog.updateComplete;

      expect(confirmSpy.callCount).to.equal(0);
      expect(dialog.doName.error).to.be.true;
      expect(dialog.doName.errorText).to.equal('DO name already in use');
    });

    it('should set "CDC type invalid for this DO" error for existing multi DO with different type', async () => {
      dialog.cdcType.value = 'ORG';
      dialog.doName.value = 'TestDO2';

      dialog.cdcType.dispatchEvent(new Event('input', { bubbles: true }));
      dialog.doName.dispatchEvent(new Event('input', { bubbles: true }));

      await new Promise<void>(resolve => {
        setTimeout(resolve, 400);
      });

      const form = dialog.shadowRoot!.querySelector('form')!;
      form.dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true })
      );
      await dialog.updateComplete;

      expect(confirmSpy.callCount).to.equal(0);
      expect(dialog.cdcType.error).to.be.true;
      expect(dialog.cdcType.errorText).to.equal('CDC type invalid for this DO');
    });

    it('should require custom namespace for new DO names', async () => {
      dialog.cdcType.value = 'ORG';
      dialog.doName.value = 'NewDOName';

      dialog.cdcType.dispatchEvent(new Event('input', { bubbles: true }));
      dialog.doName.dispatchEvent(new Event('input', { bubbles: true }));

      await new Promise<void>(resolve => {
        setTimeout(resolve, 400);
      });

      expect(dialog.namespace.disabled).to.be.false;

      const form = dialog.shadowRoot!.querySelector('form')!;
      form.dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true })
      );
      await dialog.updateComplete;

      expect(confirmSpy.callCount).to.equal(0);
      expect(dialog.namespace.error).to.be.true;
      expect(dialog.namespace.errorText).to.equal('Custom namespace required.');
    });

    it('should pass validation with custom namespace', async () => {
      dialog.cdcType.value = 'ORG';
      dialog.doName.value = 'NewDOName';

      dialog.cdcType.dispatchEvent(new Event('input', { bubbles: true }));
      dialog.doName.dispatchEvent(new Event('input', { bubbles: true }));

      await new Promise<void>(resolve => {
        setTimeout(resolve, 400);
      });

      dialog.namespace.value = 'CustomNamespace';

      const form = dialog.shadowRoot!.querySelector('form')!;
      form.dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true })
      );
      await dialog.updateComplete;

      expect(confirmSpy.callCount).to.equal(1);
      expect(confirmSpy.calledWith('ORG', 'NewDOName', 'CustomNamespace')).to.be
        .true;
    });

    it('should pass validation for existing multi DO with correct type', async () => {
      dialog.cdcType.value = 'WYE';
      dialog.doName.value = 'TestDO2';

      const form = dialog.shadowRoot!.querySelector('form')!;
      form.dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true })
      );
      await dialog.updateComplete;

      expect(confirmSpy.callCount).to.equal(1);
      expect(confirmSpy.calledWith('WYE', 'TestDO2', null)).to.be.true;
    });

    it('should reset error states when valid input is provided', async () => {
      const form = dialog.shadowRoot!.querySelector('form')!;
      form.dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true })
      );
      await dialog.updateComplete;

      expect(dialog.cdcType.error).to.be.true;
      expect(dialog.doName.error).to.be.true;

      dialog.cdcType.value = 'WYE';
      dialog.cdcType.dispatchEvent(new Event('input', { bubbles: true }));

      dialog.doName.value = 'ValidDO';
      dialog.doName.dispatchEvent(new Event('input', { bubbles: true }));

      await dialog.updateComplete;

      expect(dialog.cdcType.error).to.be.false;
      expect(dialog.cdcType.errorText).to.equal('');
      expect(dialog.doName.error).to.be.false;
      expect(dialog.doName.errorText).to.equal('');
    });

    it('should disable namespace field initially and for existing DOs', async () => {
      expect(dialog.namespace.disabled).to.be.true;

      dialog.cdcType.value = 'WYE';
      dialog.doName.value = 'TestDO2';

      dialog.cdcType.dispatchEvent(new Event('input', { bubbles: true }));
      dialog.doName.dispatchEvent(new Event('input', { bubbles: true }));

      await new Promise<void>(resolve => {
        setTimeout(resolve, 400);
      });

      expect(dialog.namespace.disabled).to.be.true;
    });
  });
});
