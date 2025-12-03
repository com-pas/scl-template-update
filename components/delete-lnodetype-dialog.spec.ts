/* eslint-disable no-unused-expressions */
import { fixture, expect, html } from '@open-wc/testing';
import { SinonSpy, spy } from 'sinon';
import { DeleteDialog } from './delete-lnodetype-dialog.js';

customElements.define('delete-dialog', DeleteDialog);

describe('DeleteDialog', () => {
  let deleteDialog: DeleteDialog;
  let confirmSpy: SinonSpy;

  beforeEach(async () => {
    confirmSpy = spy();

    deleteDialog = await fixture(
      html`<delete-dialog
        .lnodeTypeId=${'MMXU$oscd$_c53e78191fabefa3'}
        .onConfirm=${confirmSpy}
      ></delete-dialog>`
    );
  });

  afterEach(async () => {
    deleteDialog.remove();
  });

  it('displays the correct LNodeType ID in the message', () => {
    deleteDialog.show();
    expect(deleteDialog.shadowRoot?.textContent).to.include(
      'MMXU$oscd$_c53e78191fabefa3'
    );
    expect(deleteDialog.shadowRoot?.textContent).to.include('Confirm delete');
    expect(deleteDialog.shadowRoot?.textContent).to.include(
      'This action may have severe consequences'
    );
  });

  it('should call onConfirm and close when Delete button is clicked', async () => {
    deleteDialog.show();
    await deleteDialog.updateComplete;
    await deleteDialog.dialog.updateComplete;

    const buttons =
      deleteDialog.shadowRoot?.querySelectorAll('md-outlined-button');
    const deleteButton = Array.from(buttons || []).find(
      btn => btn.textContent?.trim() === 'Delete'
    ) as HTMLElement;

    expect(deleteButton).to.exist;
    deleteButton.click();
    await deleteDialog.updateComplete;
    await deleteDialog.dialog.updateComplete;

    expect(confirmSpy.callCount).to.equal(1);
  });

  it('should update displayed ID when lnodeTypeId property changes', async () => {
    deleteDialog.show();
    await deleteDialog.updateComplete;
    expect(deleteDialog.shadowRoot?.textContent).to.include(
      'MMXU$oscd$_c53e78191fabefa3'
    );

    deleteDialog.lnodeTypeId = 'LLN0$oscd$_85c7ffbe25d80e63';
    await deleteDialog.updateComplete;
    expect(deleteDialog.shadowRoot?.textContent).to.include(
      'LLN0$oscd$_85c7ffbe25d80e63'
    );
    expect(deleteDialog.shadowRoot?.textContent).to.not.include(
      'MMXU$oscd$_c53e78191fabefa3'
    );
  });

  it('should not call onConfirm when dialog is cancelled', async () => {
    deleteDialog.show();
    await deleteDialog.updateComplete;

    const buttons =
      deleteDialog.shadowRoot?.querySelectorAll('md-outlined-button');
    const cancelButton = Array.from(buttons || []).find(
      btn => btn.textContent?.trim() === 'Cancel'
    ) as HTMLElement;

    cancelButton.click();
    await deleteDialog.updateComplete;

    expect(confirmSpy.callCount).to.equal(0);
  });
});
