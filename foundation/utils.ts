import { Tree, TreeSelection } from '@openenergytools/tree-grid';

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
 * Finds and returns elements from candidateIds that are no longer referenced in
 * the given document after edits, including those affected by cascading removals.
 * Always provide all type IDs that existed before the edit as candidateIds, so that
 * any new types added during the edit are not mistakenly removed.
 */
export function getOrphanedTypes(
  doc: XMLDocument,
  candidateIds: Set<string>
): Element[] {
  const dtt = doc.querySelector(':root > DataTypeTemplates');
  if (!dtt) return [];

  const dttClone = dtt.cloneNode(true) as Element;
  const toRemove: string[] = [];

  let changed = true;
  while (changed) {
    changed = false;
    for (const id of candidateIds) {
      if (!toRemove.includes(id)) {
        if (!dttClone.querySelector(`:scope *[type="${id}"]`)) {
          const el = dttClone.querySelector(`:scope > *[id="${id}"]`);
          if (el) {
            toRemove.push(id);
            el.remove();
            changed = true;
          }
        }
      }
    }
  }

  return toRemove
    .map(id => dtt.querySelector(`:scope > *[id="${id}"]`))
    .filter((el): el is Element => el !== null);
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
