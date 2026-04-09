import { nsdToJson } from '@openscd/scl-lib';
import { cdClasses } from './constants.js';
function getCDCForDOType(doc, doType) {
    const doTypeElement = doc.querySelector(`:root > DataTypeTemplates > DOType[id="${doType}"]`);
    return doTypeElement?.getAttribute('cdc') ?? undefined;
}
function isSupportedCDC(cdc) {
    return !!cdc && cdClasses.includes(cdc);
}
function buildDataObject(doName, cdc) {
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
function mergeUserDOsIntoTree(tree, lNodeType, doc) {
    if (!lNodeType || !doc)
        return { tree, unsupportedDOs: [] };
    const result = { ...tree };
    const doElements = Array.from(lNodeType.querySelectorAll(':scope > DO'));
    const standardDONames = tree ? Object.keys(tree) : [];
    const unsupportedDOs = [];
    doElements.forEach(doEl => {
        const doName = doEl.getAttribute('name');
        const doType = doEl.getAttribute('type');
        if (!doName || !doType)
            return;
        if (!standardDONames.includes(doName)) {
            const cdc = getCDCForDOType(doc, doType);
            if (isSupportedCDC(cdc)) {
                Object.assign(result, buildDataObject(doName, cdc));
            }
            else {
                unsupportedDOs.push(doName);
            }
        }
    });
    return { tree: result, unsupportedDOs };
}
export function buildLNodeTree(selectedLNodeTypeClass, lNodeType, doc) {
    const tree = nsdToJson(selectedLNodeTypeClass);
    if (!tree)
        return { tree: undefined, unsupportedDOs: [] };
    return mergeUserDOsIntoTree(tree, lNodeType, doc);
}
//# sourceMappingURL=tree.js.map