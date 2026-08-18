import { expect, fixture, html } from '@open-wc/testing';
import { SettingsDialog } from './settings-dialog.js';
customElements.define('settings-dialog', SettingsDialog);
describe('SettingsDialog', () => {
    let element;
    const getRadio = (value) => element.shadowRoot.querySelector(`oscd-radio[value="${value}"]`);
    beforeEach(async () => {
        localStorage.clear();
        element = await fixture(html `<settings-dialog></settings-dialog>`);
        element.show();
        await element.updateComplete;
    });
    afterEach(() => {
        localStorage.clear();
        element.close();
    });
    it('should default to "update" setting', async () => {
        expect(element.updateSetting).to.equal('update');
        await element.updateComplete;
        expect(getRadio('update').checked).to.equal(true);
        expect(getRadio('swap').checked).to.equal(false);
    });
    it('should load settings from localStorage', async () => {
        localStorage.setItem('template-update-setting', 'swap');
        element.connectedCallback();
        expect(element.updateSetting).to.equal('swap');
        await element.updateComplete;
        expect(getRadio('update').checked).to.equal(false);
        expect(getRadio('swap').checked).to.equal(true);
    });
    it('should fallback to "update" for invalid localStorage values', () => {
        localStorage.setItem('template-update-setting', 'invalid');
        element.connectedCallback();
        expect(element.updateSetting).to.equal('update');
    });
    it('should save settings on confirm', async () => {
        const swapRadio = getRadio('swap');
        swapRadio.click();
        await element.updateComplete;
        const confirmButton = element.shadowRoot.querySelector('oscd-text-button:last-child');
        confirmButton.click();
        expect(localStorage.getItem('template-update-setting')).to.equal('swap');
    });
    it('should not save changes on cancel', async () => {
        localStorage.setItem('template-update-setting', 'update');
        const swapRadio = getRadio('swap');
        swapRadio.click();
        await element.updateComplete;
        const cancelButton = element.shadowRoot.querySelector('oscd-text-button:first-child');
        cancelButton.click();
        expect(localStorage.getItem('template-update-setting')).to.equal('update');
    });
    it('should update setting when radio button changes', async () => {
        const swapRadio = getRadio('swap');
        swapRadio.checked = true;
        swapRadio.dispatchEvent(new Event('change'));
        await element.updateComplete;
        expect(element.updateSetting).to.equal('swap');
        expect(getRadio('swap').checked).to.equal(true);
        expect(getRadio('update').checked).to.equal(false);
    });
    it('should reload settings when dialog is shown', async () => {
        localStorage.setItem('template-update-setting', 'swap');
        element.close();
        element.show();
        await element.updateComplete;
        expect(element.updateSetting).to.equal('swap');
        expect(getRadio('swap').checked).to.equal(true);
    });
});
//# sourceMappingURL=settings-dialog.spec.js.map