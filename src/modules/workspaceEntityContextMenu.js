import { showContextMenu } from "./interaction/contextMenuPresenter.js";
import { TEXT_CONTEXT_MENU_TARGET_SELECTOR } from "./textInputContextMenu.js";
import { t } from "../i18n/index.js";

const workspaceContextMenuText = (key) => t(`workspaceContextMenu.${key}`);

function isEditableContextTarget(target) {
  return Boolean(target?.closest?.(TEXT_CONTEXT_MENU_TARGET_SELECTOR));
}

function compactItems(items = []) {
  const compacted = [];

  for (const item of items) {
    if (!item) continue;

    const isSeparator = item === "sep" || item?.type === "separator";
    if (isSeparator && (!compacted.length || compacted.at(-1) === "sep"))
      continue;
    compacted.push(isSeparator ? "sep" : item);
  }

  if (compacted.at(-1) === "sep") compacted.pop();
  return compacted;
}

function actionItem(label, action, options = {}) {
  if (typeof action !== "function") return null;
  return { label, action, ...options };
}

export function createWorkspaceProjectContextMenuItems({
  archived = false,
  onOpen = null,
  onRename = null,
  onDuplicate = null,
  onCollect = null,
  onArchive = null,
  onDelete = null,
} = {}) {
  return compactItems([
    actionItem(workspaceContextMenuText("openProject"), onOpen, {
      icon: "folder-open",
      shortcutActionId: "context-workspace-open-project",
    }),
    "sep",
    actionItem(workspaceContextMenuText("renameProject"), onRename, {
      icon: "edit",
      shortcutActionId: "context-workspace-rename-project",
    }),
    actionItem(workspaceContextMenuText("duplicateProject"), onDuplicate, {
      icon: "duplicate",
      shortcutActionId: "context-workspace-duplicate-project",
    }),
    actionItem(workspaceContextMenuText("collectProject"), onCollect, {
      icon: "download",
      shortcutActionId: "context-workspace-collect-project",
    }),
    actionItem(
      workspaceContextMenuText(
        archived ? "unarchiveProject" : "archiveProject",
      ),
      onArchive,
      {
        icon: archived ? "unarchive" : "archive",
        shortcutActionId: archived
          ? "context-workspace-unarchive-project"
          : "context-workspace-archive-project",
      },
    ),
    "sep",
    actionItem(workspaceContextMenuText("deleteProject"), onDelete, {
      danger: true,
      icon: "delete",
      shortcutActionId: "context-workspace-delete-project",
    }),
  ]);
}

export function createWorkspaceEntityContextMenuItems({
  activateLabel = workspaceContextMenuText("view"),
  activateIcon = "enable",
  activateShortcutActionId = "",
  onActivate = null,
  deleteLabel = workspaceContextMenuText("delete"),
  deleteIcon = "delete",
  deleteShortcutActionId = "",
  onDelete = null,
  deleteDisabled = false,
  extraItems = [],
} = {}) {
  return compactItems([
    actionItem(activateLabel, onActivate, {
      icon: activateIcon,
      shortcutActionId: activateShortcutActionId,
    }),
    ...extraItems,
    onDelete ? "sep" : null,
    actionItem(deleteLabel, onDelete, {
      danger: true,
      disabled: deleteDisabled === true,
      icon: deleteIcon,
      shortcutActionId: deleteShortcutActionId,
    }),
  ]);
}

export function bindWorkspaceEntityContextMenu(
  root,
  {
    resolveItems = () => [],
    presentMenu = showContextMenu,
    beforeOpen = null,
  } = {},
) {
  if (!root?.addEventListener || typeof resolveItems !== "function")
    return () => {};

  let activeMenu = null;
  const closeMenu = () => {
    activeMenu?.close?.();
    activeMenu = null;
  };

  const handleContextMenu = (event) => {
    if (isEditableContextTarget(event?.target)) return;

    const defaultPrevented = event?.defaultPrevented === true;
    event?.preventDefault?.();
    event?.stopPropagation?.();

    if (defaultPrevented) {
      closeMenu();
      return;
    }

    const items = compactItems(resolveItems(event));
    closeMenu();
    if (!items.length) return;

    beforeOpen?.(event);
    activeMenu =
      presentMenu(
        Number(event?.clientX) || 0,
        Number(event?.clientY) || 0,
        items,
        {
          ensureItemIcons: true,
          ownerElement:
            event?.target?.isConnected === false ? root : event?.target,
          ownerRoot: root,
        },
      ) || null;
  };

  root.addEventListener("contextmenu", handleContextMenu);
  return () => {
    root.removeEventListener?.("contextmenu", handleContextMenu);
    closeMenu();
  };
}
