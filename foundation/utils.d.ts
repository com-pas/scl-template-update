import { Tree, TreeSelection } from '@openenergytools/tree-grid';
export declare function getLNodeTypes(doc: XMLDocument | undefined): Element[];
export declare function getSelectedLNodeType(doc: XMLDocument, selected: string): Element | undefined;
export declare function isLNodeTypeReferenced(doc: XMLDocument, selectedLNodeTypeID: string | null): boolean;
export declare function filterSelection(tree: Tree, selection: TreeSelection): TreeSelection;
/**
 * Creates a clone of an LNodeType with only the DOs that are present in the selection.
 * DOs not included in the selection are removed from the cloned element.
 * @param lNodeType - The LNodeType element to filter
 * @param selection - The tree selection containing the DO names to keep
 * @returns A cloned LNodeType element containing only the selected DOs
 */
export declare function removeDOsNotInSelection(lNodeType: Element, selection: TreeSelection): Element;
