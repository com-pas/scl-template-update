import { Tree, TreeSelection } from '@openenergytools/tree-grid';
import { EditV2 } from '@openscd/oscd-api';
export type MissingMandatoryField = {
    path: string[];
    kind: 'subfield';
};
export type EmptyReferencedElement = {
    tagName: 'DOType' | 'DAType' | 'EnumType';
    id: string;
    referencePath: string;
};
/**
 * Returns an array of the mandatory fields that are missing from the selection.
 * @param tree The tree structure representing the data model
 * @param selection The current selection in the tree
 * @returns An array of MissingMandatoryField objects
 */
export declare function getMissingMandatoryFields(tree: Tree, selection: TreeSelection): MissingMandatoryField[];
/**
 * Finds all referenced elements of an LNodeType that are empty (i.e., have no children).
 * @param lNodeType The LNodeType element to analyse
 * @param missingMandatoryFields An optional array of MissingMandatoryField objects to filter out empty elements that are part of mandatory fields
 * @returns An array of EmptyReferencedElement objects representing the empty referenced elements
 */
export declare function getEmptyReferencedElements(lNodeType: Element, missingMandatoryFields?: MissingMandatoryField[]): EmptyReferencedElement[];
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
/**
 * Builds the Remove edits needed when an LNodeType is replaced.
 * Clones the DataTypeTemplates once, adds the incoming new nodes, removes
 * the old LNodeType, then cascades to find which pre-existing sub-types are
 * now unreferenced. Returns the old LNodeType remove plus all orphan removes.
 * @param dataTypeTemplates The live DataTypeTemplates element to base the remove calculations on
 * @param oldLNodeTypeId The ID of the LNodeType being replaced
 * @param newNodes The new nodes being added (cloned before passing in)
 * @returns An array of EditV2 objects representing the nodes to remove
 */
export declare function computeOrphanedRemoves(dataTypeTemplates: Element, oldLNodeTypeId: string, newNodes: Element[]): EditV2[];
