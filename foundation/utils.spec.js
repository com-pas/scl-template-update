/* eslint-disable no-unused-expressions */
import { expect } from '@open-wc/testing';
import { removeDOsNotInSelection, computeOrphanedRemoves } from './utils.js';
import { nsdSpeced } from '../scl-template-update.testfiles.js';
describe('foundation/utils', () => {
    describe('removeDOsNotInSelection', () => {
        let lNodeType;
        beforeEach(() => {
            const doc = new DOMParser().parseFromString(`<LNodeType id="TestLNodeType" lnClass="MMXU">
          <DO name="Beh" type="ENS_1"/>
          <DO name="A" type="WYE_1"/>
          <DO name="PhV" type="WYE_2"/>
        </LNodeType>`, 'application/xml');
            lNodeType = doc.documentElement;
        });
        it('removes DOs not in selection', () => {
            const selection = {
                Beh: {},
                PhV: {},
            };
            const result = removeDOsNotInSelection(lNodeType, selection);
            const remainingDOs = Array.from(result.querySelectorAll('DO')).map(doElement => doElement.getAttribute('name'));
            expect(remainingDOs).to.have.lengthOf(2);
            expect(remainingDOs).to.include('Beh');
            expect(remainingDOs).to.include('PhV');
            expect(remainingDOs).to.not.include('A');
        });
        it('returns a clone without modifying the original', () => {
            const selection = {
                Beh: {},
            };
            const originalDOCount = lNodeType.querySelectorAll('DO').length;
            const result = removeDOsNotInSelection(lNodeType, selection);
            // Original should be unchanged
            expect(lNodeType.querySelectorAll('DO')).to.have.lengthOf(originalDOCount);
            // Result should have fewer DOs
            expect(result.querySelectorAll('DO')).to.have.lengthOf(1);
        });
        it('removes all DOs when selection is empty', () => {
            const selection = {};
            const result = removeDOsNotInSelection(lNodeType, selection);
            expect(result.querySelectorAll('DO')).to.have.lengthOf(0);
        });
        it('keeps all DOs when all are in selection', () => {
            const selection = {
                Beh: {},
                A: {},
                PhV: {},
            };
            const result = removeDOsNotInSelection(lNodeType, selection);
            expect(result.querySelectorAll('DO')).to.have.lengthOf(3);
        });
        it('preserves LNodeType attributes', () => {
            const selection = {
                Beh: {},
            };
            const result = removeDOsNotInSelection(lNodeType, selection);
            expect(result.getAttribute('id')).to.equal('TestLNodeType');
            expect(result.getAttribute('lnClass')).to.equal('MMXU');
            expect(result.tagName).to.equal('LNodeType');
        });
    });
    describe('computeOrphanedRemoves', () => {
        const mmxuId = 'MMXU$oscd$_c53e78191fabefa3';
        let dataTypeTemplates;
        beforeEach(() => {
            dataTypeTemplates = new DOMParser()
                .parseFromString(nsdSpeced, 'application/xml')
                .querySelector('DataTypeTemplates');
        });
        function makeNewMmxu(doNames) {
            const doElements = doNames
                .map(name => {
                const existing = dataTypeTemplates.querySelector(`LNodeType[id="${mmxuId}"] > DO[name="${name}"]`);
                return existing ? existing.outerHTML : '';
            })
                .join('');
            return new DOMParser().parseFromString(`<LNodeType xmlns="http://www.iec.ch/61850/2003/SCL" lnClass="MMXU" id="${mmxuId}">${doElements}</LNodeType>`, 'application/xml').documentElement;
        }
        it('returns the old LNodeType as the first remove', () => {
            const result = computeOrphanedRemoves(dataTypeTemplates, mmxuId, [
                makeNewMmxu(['Beh']),
            ]);
            expect(result).to.have.length.greaterThan(0);
            expect(result[0].node).to.equal(dataTypeTemplates.querySelector(`LNodeType[id="${mmxuId}"]`));
        });
        it('cascades orphans when A DO is removed: removes A DOType and all its exclusive descendants', () => {
            const result = computeOrphanedRemoves(dataTypeTemplates, mmxuId, [
                makeNewMmxu(['Beh']),
            ]);
            const orphanedIds = result
                .slice(1) // skip old LNodeType remove
                .map((edit) => edit.node.getAttribute('id'))
                .filter(id => id !== null);
            expect(orphanedIds).to.include('A$oscd$_41824603f63b26ac');
            expect(orphanedIds).to.include('phsA$oscd$_995aad120f12c815');
            expect(orphanedIds).to.include('cVal$oscd$_80272042468595d1');
            expect(orphanedIds).to.include('units$oscd$_3f2e10def85bfeac');
            expect(orphanedIds).to.include('mag$oscd$_ed49c2f7a55ad05a');
            expect(orphanedIds).to.include('SIUnit$oscd$_39f6ca400c633081');
        });
        it('does not orphan the Beh DOType which is shared with LLN0', () => {
            const result = computeOrphanedRemoves(dataTypeTemplates, mmxuId, [
                makeNewMmxu(['Beh']),
            ]);
            const orphanedIds = result
                .slice(1) // skip old LNodeType remove
                .map((edit) => edit.node.getAttribute('id'))
                .filter(id => id !== null);
            expect(orphanedIds).to.not.include('Beh$oscd$_c6ed035c8137b35a');
            expect(orphanedIds).to.not.include('stVal$oscd$_48ba16345b8e7f5b');
        });
        it('returns only the old LNodeType when the new version keeps all DOs', () => {
            const result = computeOrphanedRemoves(dataTypeTemplates, mmxuId, [
                makeNewMmxu(['Beh', 'A']),
            ]);
            expect(result).to.have.lengthOf(1);
            expect(result[0].node).to.equal(dataTypeTemplates.querySelector(`LNodeType[id="${mmxuId}"]`));
        });
    });
});
//# sourceMappingURL=utils.spec.js.map