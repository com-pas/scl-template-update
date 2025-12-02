/* eslint-disable no-unused-expressions */
import { expect } from '@open-wc/testing';
import { removeDOsNotInSelection } from './utils.js';

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
});
