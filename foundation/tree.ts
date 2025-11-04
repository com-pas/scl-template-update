import { nsdToJson, LNodeDescription } from '@openscd/scl-lib';
import { cdClasses } from './constants.js';

function getCDCForDOType(doc: XMLDocument, doType: string): string | undefined {
  const doTypeElement = doc.querySelector(
    `:root > DataTypeTemplates > DOType[id="${doType}"]`
  );
  return doTypeElement?.getAttribute('cdc') ?? undefined;
}

function isSupportedCDC(cdc: string | undefined): boolean {
  return !!cdc && (cdClasses as ReadonlyArray<string>).includes(cdc);
}

function buildDataObject(doName: string, cdc: string) {
  const cdcChildren = nsdToJson(cdc);
  return {
    [doName]: {
      tagName: 'DataObject',
      type: cdc,
      descID: '',
      presCond: 'O',
      children: cdcChildren,
    },
  };
}

/**
 * Merges user-defined Data Objects in the NSD tree. This ensures that
 * any custom or extra DOs present in the user's SCL are preserved
 * in the tree, even if they are not part of the NSD definition.
 */
function mergeUserDOsIntoTree(
  tree: any,
  lNodeType: Element,
  doc: XMLDocument
): { tree: LNodeDescription; unsupportedDOs: string[] } {
  if (!lNodeType || !doc) return { tree, unsupportedDOs: [] };
  const result = { ...tree };
  const doElements = Array.from(lNodeType.querySelectorAll(':scope > DO'));
  const standardDONames = tree ? Object.keys(tree) : [];
  const unsupportedDOs: string[] = [];

  doElements.forEach(doEl => {
    const doName = doEl.getAttribute('name');
    const doType = doEl.getAttribute('type');
    if (!doName || !doType) return;
    if (!standardDONames.includes(doName)) {
      const cdc = getCDCForDOType(doc, doType);
      if (isSupportedCDC(cdc)) {
        Object.assign(result, buildDataObject(doName, cdc!));
      } else {
        unsupportedDOs.push(doName);
      }
    }
  });
  return { tree: result, unsupportedDOs };
}

export function buildLNodeTree(
  selectedLNodeTypeClass: string,
  lNodeType: Element,
  doc: XMLDocument
): { tree: any; unsupportedDOs: string[] } {
  const tree = nsdToJson(selectedLNodeTypeClass) as any;
  if (!tree) return { tree: undefined, unsupportedDOs: [] };
  return mergeUserDOsIntoTree(tree, lNodeType, doc);
}
