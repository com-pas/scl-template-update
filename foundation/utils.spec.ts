/* eslint-disable no-unused-expressions */
import { expect } from '@open-wc/testing';
import {
  removeDOsNotInSelection,
  computeOrphanedRemoves,
  getMissingMandatoryFields,
  getEmptyReferencedElements,
} from './utils.js';
import { nsdSpeced } from '../scl-template-update.testfiles.js';

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

  describe('computeOrphanedRemoves', () => {
    const mmxuId = 'MMXU$oscd$_c53e78191fabefa3';
    let dataTypeTemplates: Element;

    beforeEach(() => {
      dataTypeTemplates = new DOMParser()
        .parseFromString(nsdSpeced, 'application/xml')
        .querySelector('DataTypeTemplates')!;
    });

    function makeNewMmxu(doNames: string[]): Element {
      const doElements = doNames
        .map(name => {
          const existing = dataTypeTemplates.querySelector(
            `LNodeType[id="${mmxuId}"] > DO[name="${name}"]`
          );
          return existing ? existing.outerHTML : '';
        })
        .join('');
      return new DOMParser().parseFromString(
        `<LNodeType xmlns="http://www.iec.ch/61850/2003/SCL" lnClass="MMXU" id="${mmxuId}">${doElements}</LNodeType>`,
        'application/xml'
      ).documentElement;
    }

    it('returns the old LNodeType as the first remove', () => {
      const result = computeOrphanedRemoves(dataTypeTemplates, mmxuId, [
        makeNewMmxu(['Beh']),
      ]);

      expect(result).to.have.length.greaterThan(0);
      expect((result[0] as any).node as Element).to.equal(
        dataTypeTemplates.querySelector(`LNodeType[id="${mmxuId}"]`)
      );
    });

    it('cascades orphans when A DO is removed: removes A DOType and all its exclusive descendants', () => {
      const result = computeOrphanedRemoves(dataTypeTemplates, mmxuId, [
        makeNewMmxu(['Beh']),
      ]);

      const orphanedIds = result
        .slice(1) // skip old LNodeType remove
        .map((edit: any) => edit.node.getAttribute('id'))
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
        .map((edit: any) => edit.node.getAttribute('id'))
        .filter(id => id !== null);

      expect(orphanedIds).to.not.include('Beh$oscd$_c6ed035c8137b35a');
      expect(orphanedIds).to.not.include('stVal$oscd$_48ba16345b8e7f5b');
    });

    it('returns only the old LNodeType when the new version keeps all DOs', () => {
      const result = computeOrphanedRemoves(dataTypeTemplates, mmxuId, [
        makeNewMmxu(['Beh', 'A']),
      ]);

      expect(result).to.have.lengthOf(1);
      expect((result[0] as any).node as Element).to.equal(
        dataTypeTemplates.querySelector(`LNodeType[id="${mmxuId}"]`)
      );
    });
  });

  describe('getMissingMandatoryFields', () => {
    const tree: any = {
      ReqDO: {
        presCond: 'M',
        children: {
          stVal: {
            mandatory: true,
            children: {
              q: {
                mandatory: true,
              },
            },
          },
          optionalField: {
            mandatory: false,
          },
        },
      },
      OptDO: {
        presCond: 'O',
        children: {
          requiredUnderOptionalDo: {
            mandatory: true,
          },
        },
      },
    };

    it('returns missing mandatory subfields for present DOs', () => {
      const selection = {
        ReqDO: {},
      };

      const missing = getMissingMandatoryFields(tree, selection);

      expect(missing).to.deep.equal([
        {
          path: ['ReqDO', 'stVal'],
          kind: 'subfield',
        },
      ]);
    });

    it('returns no missing mandatory subfields for optional DOs missing in file', () => {
      const selection = {
        ReqDO: {
          stVal: {
            q: {},
          },
        },
      };

      const missing = getMissingMandatoryFields(tree, selection);

      expect(missing).to.deep.equal([]);
    });

    it('returns deeper missing mandatory subfields for present branches', () => {
      const selection = {
        ReqDO: {
          stVal: {},
        },
      };

      const missing = getMissingMandatoryFields(tree, selection);

      expect(missing).to.deep.equal([
        {
          path: ['ReqDO', 'stVal', 'q'],
          kind: 'subfield',
        },
      ]);
    });

    it('returns missing fields sorted alphabetically by path', () => {
      const unorderedTree: any = {
        ReqDO: {
          children: {
            zField: { mandatory: true },
            aField: { mandatory: true },
          },
        },
      };

      const selection = {
        ReqDO: {},
      };

      const missing = getMissingMandatoryFields(unorderedTree, selection);

      expect(missing.map(field => field.path.join('/'))).to.deep.equal([
        'ReqDO/aField',
        'ReqDO/zField',
      ]);
    });
  });

  describe('getEmptyReferencedElements', () => {
    it('returns empty referenced DAType elements', () => {
      const doc = new DOMParser().parseFromString(
        `<SCL xmlns="http://www.iec.ch/61850/2003/SCL"><DataTypeTemplates>
          <LNodeType id="RBRF1" lnClass="RBRF">
            <DO name="DetValA" type="DetValAType" />
          </LNodeType>
          <DOType id="DetValAType" cdc="ASG">
            <DA name="setMag" bType="Struct" fc="SE" type="setMagType" />
          </DOType>
          <DAType id="setMagType" />
        </DataTypeTemplates></SCL>`,
        'application/xml'
      );

      const lNodeType = doc.querySelector('LNodeType')!;

      expect(getEmptyReferencedElements(lNodeType)).to.deep.equal([
        {
          tagName: 'DAType',
          id: 'setMagType',
          referencePath: 'DetValA.setMag',
        },
      ]);
    });

    it('does not return non-empty DAType elements', () => {
      const doc = new DOMParser().parseFromString(
        `<SCL xmlns="http://www.iec.ch/61850/2003/SCL"><DataTypeTemplates>
          <LNodeType id="RBRF1" lnClass="RBRF">
            <DO name="DetValA" type="DetValAType" />
          </LNodeType>
          <DOType id="DetValAType" cdc="ASG">
            <DA name="setMag" bType="Struct" fc="SE" type="setMagType" />
          </DOType>
          <DAType id="setMagType">
            <BDA name="f" bType="FLOAT32" />
          </DAType>
        </DataTypeTemplates></SCL>`,
        'application/xml'
      );

      const lNodeType = doc.querySelector('LNodeType')!;

      expect(getEmptyReferencedElements(lNodeType)).to.deep.equal([]);
    });

    it('reports empty referenced DOType elements', () => {
      const doc = new DOMParser().parseFromString(
        `<SCL xmlns="http://www.iec.ch/61850/2003/SCL"><DataTypeTemplates>
          <LNodeType id="RBRF1" lnClass="RBRF">
            <DO name="EmptyDo" type="EmptyDoType" />
          </LNodeType>
          <DOType id="EmptyDoType" cdc="ASG" />
        </DataTypeTemplates></SCL>`,
        'application/xml'
      );

      const lNodeType = doc.querySelector('LNodeType')!;

      expect(getEmptyReferencedElements(lNodeType)).to.deep.equal([
        {
          tagName: 'DOType',
          id: 'EmptyDoType',
          referencePath: 'EmptyDo',
        },
      ]);
    });

    it('returns empty referenced EnumType elements', () => {
      const doc = new DOMParser().parseFromString(
        `<SCL xmlns="http://www.iec.ch/61850/2003/SCL"><DataTypeTemplates>
          <LNodeType id="RBRF1" lnClass="RBRF">
            <DO name="Mod" type="ModType" />
          </LNodeType>
          <DOType id="ModType" cdc="ENS">
            <DA name="stVal" bType="Enum" fc="ST" type="EmptyEnumType" />
          </DOType>
          <EnumType id="EmptyEnumType" />
        </DataTypeTemplates></SCL>`,
        'application/xml'
      );

      const lNodeType = doc.querySelector('LNodeType')!;

      expect(getEmptyReferencedElements(lNodeType)).to.deep.equal([
        {
          tagName: 'EnumType',
          id: 'EmptyEnumType',
          referencePath: 'Mod.stVal',
        },
      ]);
    });

    it('returns one empty element warning per usage path', () => {
      const doc = new DOMParser().parseFromString(
        `<SCL xmlns="http://www.iec.ch/61850/2003/SCL"><DataTypeTemplates>
          <LNodeType id="YPTR1" lnClass="YPTR">
            <DO name="HiVRtg" type="SharedDoType" />
            <DO name="LoVRtg" type="SharedDoType" />
          </LNodeType>
          <DOType id="SharedDoType" cdc="ASG">
            <DA name="setMag" bType="Struct" fc="SE" type="setMagType" />
          </DOType>
          <DAType id="setMagType" />
        </DataTypeTemplates></SCL>`,
        'application/xml'
      );

      const lNodeType = doc.querySelector('LNodeType')!;

      expect(getEmptyReferencedElements(lNodeType)).to.deep.equal([
        {
          tagName: 'DAType',
          id: 'setMagType',
          referencePath: 'HiVRtg.setMag',
        },
        {
          tagName: 'DAType',
          id: 'setMagType',
          referencePath: 'LoVRtg.setMag',
        },
      ]);
    });

    it('does not return empty warnings for paths already flagged as missing mandatory fields', () => {
      const doc = new DOMParser().parseFromString(
        `<SCL xmlns="http://www.iec.ch/61850/2003/SCL"><DataTypeTemplates>
          <LNodeType id="RBRF1" lnClass="RBRF">
            <DO name="Blk" type="BlkType" />
          </LNodeType>
          <DOType id="BlkType" cdc="SPS" />
        </DataTypeTemplates></SCL>`,
        'application/xml'
      );

      const lNodeType = doc.querySelector('LNodeType')!;
      const missingMandatoryFields: Array<{
        path: string[];
        kind: 'subfield';
      }> = [{ path: ['Blk', 'stVal'], kind: 'subfield' }];

      expect(
        getEmptyReferencedElements(lNodeType, missingMandatoryFields)
      ).to.deep.equal([]);
    });
  });
});
