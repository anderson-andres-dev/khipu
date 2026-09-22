export interface ContextMenuItem {
  label: string;
  action: () => void | Promise<void>;
  disabled?: boolean;
  separatorBefore?: boolean;
  shortcut?: string;
}
