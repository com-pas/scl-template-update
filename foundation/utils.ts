import { Tree, TreeSelection } from '@openenergytools/tree-grid';
import { EditV2 } from '@openscd/oscd-api';

export function getLNodeTypes(doc: XMLDocument | undefined): Element[] {
  return Array.from(
    doc?.querySelectorAll(':root > DataTypeTemplates > LNodeType') ?? []
  );
}

export function getSelectedLNodeType(
  doc: XMLDocument,
  selected: string
): Element | undefined {
  return (
    doc?.querySelector(
      `:root > DataTypeTemplates > LNodeType[id="${selected}"]`
    ) ?? undefined
  );
}

export function isLNodeTypeReferenced(
  doc: XMLDocument,
  selectedLNodeTypeID: string | null
): boolean {
  if (!doc || !selectedLNodeTypeID) return false;
  return !!doc.querySelector(
    `:root > Substation LNode[lnType="${selectedLNodeTypeID}"], :root > IED LN[lnType="${selectedLNodeTypeID}"], :root > IED LN0[lnType="${selectedLNodeTypeID}"]`
  );
}

export function filterSelection(
  tree: Tree,
  selection: TreeSelection
): TreeSelection {
  const filteredTree: TreeSelection = {};
  Object.keys(selection).forEach(key => {
    const isThere = !!tree[key];
    if (isThere) filteredTree[key] = selection[key];
  });

  return filteredTree;
}

/**
 * Creates a clone of an LNodeType with only the DOs that are present in the selection.
 * DOs not included in the selection are removed from the cloned element.
 * @param lNodeType - The LNodeType element to filter
 * @param selection - The tree selection containing the DO names to keep
 * @returns A cloned LNodeType element containing only the selected DOs
 */
export function removeDOsNotInSelection(
  lNodeType: Element,
  selection: TreeSelection
): Element {
  const clonedLNodeType = lNodeType.cloneNode(true) as Element;

  const dosToRemove: Element[] = [];
  Array.from(clonedLNodeType.querySelectorAll(':scope > DO')).forEach(
    doElement => {
      const doName = doElement.getAttribute('name');
      if (doName && !selection[doName]) {
        dosToRemove.push(doElement);
      }
    }
  );

  dosToRemove.forEach(doElement => {
    clonedLNodeType.removeChild(doElement);
  });

  return clonedLNodeType;
}

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
export function computeOrphanedRemoves(
  dataTypeTemplates: Element,
  oldLNodeTypeId: string,
  newNodes: Element[]
): EditV2[] {
  const subTypes = Array.from(
    dataTypeTemplates.querySelectorAll(
      ':scope > DOType, :scope > DAType, :scope > EnumType'
    )
  );
  const subTypeIds = subTypes
    .map(el => el.getAttribute('id'))
    .filter(id => id !== null);
  const preEditIds = new Set(subTypeIds);

  const dttClone = dataTypeTemplates.cloneNode(true) as Element;
  newNodes.forEach(n => dttClone.appendChild(n.cloneNode(true)));
  dttClone
    .querySelector(`:scope > LNodeType[id="${oldLNodeTypeId}"]`)
    ?.remove();

  const remainingIds = new Set(preEditIds);
  const orphanIds: string[] = [];
  let changed = true;

  while (changed) {
    changed = false;
    for (const id of remainingIds) {
      if (!dttClone.querySelector(`:scope *[type="${id}"]`)) {
        orphanIds.push(id);
        remainingIds.delete(id);
        dttClone.querySelector(`:scope > *[id="${id}"]`)?.remove();
        changed = true;
      }
    }
  }

  const results: EditV2[] = [];
  const oldLN = dataTypeTemplates.querySelector(
    `:scope > LNodeType[id="${oldLNodeTypeId}"]`
  );
  if (oldLN) results.push({ node: oldLN as Node });
  orphanIds.forEach(id => {
    const node = dataTypeTemplates.querySelector(
      `:scope > *[id="${id}"]`
    ) as Node | null;
    if (node) results.push({ node });
  });
  return results;
}
