/* eslint-disable no-unused-expressions */
import { expect } from '@open-wc/testing';
import { removeDOsNotInSelection, getOrphanedTypes } from './utils.js';

describe('foundation/utils', () => {
  describe('removeDOsNotInSelection', () => {
    let lNodeType: Element;

    beforeEach(() => {
      const doc = new DOMParser().parseFromString(
        `<LNodeType id="TestLNodeType" lnClass="MMXU">
          <DO name="Beh" type="ENS_1"/>
          <DO name="A" type="WYE_1"/>
          <DO name="PhV" type="WYE_2"/>
        </LNodeType>`,
        'application/xml'
      );
      lNodeType = doc.documentElement;
    });

    it('removes DOs not in selection', () => {
      const selection = {
        Beh: {},
        PhV: {},
      };

      const result = removeDOsNotInSelection(lNodeType, selection);

      const remainingDOs = Array.from(result.querySelectorAll('DO')).map(
        doElement => doElement.getAttribute('name')
      );

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
      expect(lNodeType.querySelectorAll('DO')).to.have.lengthOf(
        originalDOCount
      );

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

  describe('getOrphanedTypes', () => {
    it('returns candidates that are unreferenced in the document', () => {
      // Post-edit doc: LNodeType only has Beh — A and its chain are orphaned
      const doc = new DOMParser().parseFromString(
        `<SCL xmlns="http://www.iec.ch/61850/2003/SCL">
          <DataTypeTemplates>
            <LNodeType id="TestLN" lnClass="MMXU">
              <DO name="Beh" type="DOType_Beh"/>
            </LNodeType>
            <DOType id="DOType_Beh" cdc="ENS"/>
            <DOType id="DOType_A" cdc="WYE">
              <SDO name="sub" type="DOType_Sub"/>
            </DOType>
            <DOType id="DOType_Sub" cdc="CMV"/>
          </DataTypeTemplates>
        </SCL>`,
        'application/xml'
      );
      const candidates = new Set(['DOType_A', 'DOType_Sub', 'DOType_Beh']);
      const orphaned = getOrphanedTypes(doc, candidates);
      const orphanedIds = orphaned.map(el => el.getAttribute('id'));

      // DOType_A is unreferenced → orphaned
      expect(orphanedIds).to.include('DOType_A');
      // DOType_Sub was only referenced by DOType_A → cascade orphan
      expect(orphanedIds).to.include('DOType_Sub');
      // DOType_Beh is still referenced by the LNodeType → NOT orphaned
      expect(orphanedIds).to.not.include('DOType_Beh');
    });

    it('does not return types still referenced by other LNodeTypes', () => {
      // Two LNodeTypes share DOType_Shared; one is removed but the other remains
      const doc = new DOMParser().parseFromString(
        `<SCL xmlns="http://www.iec.ch/61850/2003/SCL">
          <DataTypeTemplates>
            <LNodeType id="LN_Kept" lnClass="MMXU">
              <DO name="X" type="DOType_Shared"/>
            </LNodeType>
            <DOType id="DOType_Removed" cdc="ENS"/>
            <DOType id="DOType_Shared" cdc="SPS"/>
          </DataTypeTemplates>
        </SCL>`,
        'application/xml'
      );
      const candidates = new Set(['DOType_Removed', 'DOType_Shared']);
      const orphaned = getOrphanedTypes(doc, candidates);
      const orphanedIds = orphaned.map(el => el.getAttribute('id'));

      expect(orphanedIds).to.include('DOType_Removed');
      expect(orphanedIds).to.not.include('DOType_Shared');
    });

    it('returns empty array when all candidates are still referenced', () => {
      const doc = new DOMParser().parseFromString(
        `<SCL xmlns="http://www.iec.ch/61850/2003/SCL">
          <DataTypeTemplates>
            <LNodeType id="TestLN" lnClass="MMXU">
              <DO name="A" type="DOType_A"/>
            </LNodeType>
            <DOType id="DOType_A" cdc="WYE"/>
          </DataTypeTemplates>
        </SCL>`,
        'application/xml'
      );
      const candidates = new Set(['DOType_A']);
      const orphaned = getOrphanedTypes(doc, candidates);

      expect(orphaned).to.have.lengthOf(0);
    });
  });
});
