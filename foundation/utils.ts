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

type ReferencedType = {
  typeId: string;
  referencePath: string;
};

type EmptyReferenceAnalysis = {
  emptyTagName?: EmptyReferencedElement['tagName'];
  childReferences: ReferencedType[];
};

type TreeNodeWithMetadata = {
  children?: Tree;
  mandatory?: boolean;
  presCond?: string;
};

function hasSelectionPath(selection: TreeSelection, path: string[]): boolean {
  let current: TreeSelection | undefined = selection;
  for (const segment of path) {
    if (!current || !Object.hasOwn(current, segment)) return false;
    current = current[segment];
  }
  return true;
}

function collectMissingMandatorySubfields(
  tree: Tree,
  selection: TreeSelection,
  parentPath: string[] = []
): MissingMandatoryField[] {
  const missing: MissingMandatoryField[] = [];

  Object.entries(tree).forEach(([name, rawNode]) => {
    const node = (rawNode ?? {}) as TreeNodeWithMetadata;
    const path = [...parentPath, name];
    const presentInSelection = hasSelectionPath(selection, path);

    if (node.mandatory && !presentInSelection) {
      missing.push({ path, kind: 'subfield' });
      return;
    }

    if (presentInSelection && node.children) {
      missing.push(
        ...collectMissingMandatorySubfields(node.children, selection, path)
      );
    }
  });

  return missing;
}

/**
 * Returns an array of the mandatory fields that are missing from the selection.
 * @param tree The tree structure representing the data model
 * @param selection The current selection in the tree
 * @returns An array of MissingMandatoryField objects
 */
export function getMissingMandatoryFields(
  tree: Tree,
  selection: TreeSelection
): MissingMandatoryField[] {
  const missing: MissingMandatoryField[] = [];

  Object.entries(tree).forEach(([doName, rawNode]) => {
    const node = (rawNode ?? {}) as TreeNodeWithMetadata;
    const doPath = [doName];
    const doPresentInSelection = hasSelectionPath(selection, doPath);
    if (doPresentInSelection && node.children) {
      missing.push(
        ...collectMissingMandatorySubfields(node.children, selection, doPath)
      );
    }
  });

  return missing.sort((a, b) =>
    a.path.join('/').localeCompare(b.path.join('/'))
  );
}

function findTypeElementById(
  dataTypeTemplates: Element,
  id: string
): Element | undefined {
  return Array.from(dataTypeTemplates.children).find(child => {
    const isKnownTypeTag =
      child.tagName === 'DOType' ||
      child.tagName === 'DAType' ||
      child.tagName === 'EnumType';

    return isKnownTypeTag && child.getAttribute('id') === id;
  });
}

function getInitialReferencedTypes(lNodeType: Element): ReferencedType[] {
  return Array.from(lNodeType.querySelectorAll(':scope > DO'))
    .map(doElement => {
      const typeId = doElement.getAttribute('type');
      if (!typeId) return undefined;

      return {
        typeId,
        referencePath: doElement.getAttribute('name'),
      };
    })
    .filter((entry): entry is ReferencedType => !!entry);
}

function toChildReference(
  element: Element,
  parentReferencePath: string
): ReferencedType | undefined {
  const typeId = element.getAttribute('type');
  const name = element.getAttribute('name');
  if (!typeId || !name) return undefined;

  return {
    typeId,
    referencePath: `${parentReferencePath}.${name}`,
  };
}

function getChildReferences(
  children: Element[],
  parentReferencePath: string
): ReferencedType[] {
  return children
    .map(child => toChildReference(child, parentReferencePath))
    .filter((entry): entry is ReferencedType => !!entry);
}

function analyseReferencedType(
  typeElement: Element,
  referencePath: string
): EmptyReferenceAnalysis {
  if (typeElement.tagName === 'DOType') {
    const directChildren = Array.from(
      typeElement.querySelectorAll(':scope > DA, :scope > SDO')
    );

    return {
      emptyTagName: directChildren.length === 0 ? 'DOType' : undefined,
      childReferences: getChildReferences(directChildren, referencePath),
    };
  }

  if (typeElement.tagName === 'DAType') {
    const directChildren = Array.from(
      typeElement.querySelectorAll(':scope > BDA')
    );

    return {
      emptyTagName: directChildren.length === 0 ? 'DAType' : undefined,
      childReferences: getChildReferences(directChildren, referencePath),
    };
  }

  if (typeElement.tagName === 'EnumType') {
    const enumValues = Array.from(
      typeElement.querySelectorAll(':scope > EnumVal')
    );

    return {
      emptyTagName: enumValues.length === 0 ? 'EnumType' : undefined,
      childReferences: [],
    };
  }

  return { childReferences: [] };
}

function hasMandatoryOverlap(
  referencePath: string,
  missingMandatoryFields: MissingMandatoryField[]
): boolean {
  const referencePathParts = referencePath
    .split('.')
    .map(part => part.trim())
    .filter(Boolean);

  return missingMandatoryFields.some(missing => {
    if (missing.path.length < referencePathParts.length) return false;
    return referencePathParts.every(
      (segment, index) => segment === missing.path[index]
    );
  });
}

/**
 * Finds all referenced elements of an LNodeType that are empty (i.e., have no children).
 * @param lNodeType The LNodeType element to analyse
 * @param missingMandatoryFields An optional array of MissingMandatoryField objects to filter out empty elements that are part of mandatory fields
 * @returns An array of EmptyReferencedElement objects representing the empty referenced elements
 */
export function getEmptyReferencedElements(
  lNodeType: Element,
  missingMandatoryFields: MissingMandatoryField[] = []
): EmptyReferencedElement[] {
  const dataTypeTemplates = lNodeType.closest('DataTypeTemplates');
  if (!dataTypeTemplates) return [];

  const referenceQueue: ReferencedType[] = getInitialReferencedTypes(lNodeType);

  const processedReferences = new Set<string>();
  const emptyElements: EmptyReferencedElement[] = [];

  while (referenceQueue.length > 0) {
    const currentReference = referenceQueue.shift();
    if (!currentReference) break;

    const { typeId, referencePath } = currentReference;
    const referenceKey = `${typeId}:${referencePath}`;

    if (!processedReferences.has(referenceKey)) {
      processedReferences.add(referenceKey);

      const typeElement = findTypeElementById(dataTypeTemplates, typeId);
      if (typeElement) {
        const analysis = analyseReferencedType(typeElement, referencePath);
        if (analysis.emptyTagName) {
          emptyElements.push({
            tagName: analysis.emptyTagName,
            id: typeId,
            referencePath,
          });
        }

        referenceQueue.push(...analysis.childReferences);
      }
    }
  }

  return emptyElements
    .filter(
      element =>
        !hasMandatoryOverlap(element.referencePath, missingMandatoryFields)
    )
    .sort((a, b) => {
      const tagOrder = a.tagName.localeCompare(b.tagName);
      if (tagOrder !== 0) return tagOrder;

      const idOrder = a.id.localeCompare(b.id);
      if (idOrder !== 0) return idOrder;

      return a.referencePath.localeCompare(b.referencePath);
    });
}

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
