const STORAGE_KEY_PREFIX = "panel-unlocked:";

/** Whether the panel of this business was already unlocked in this browser tab. */
export function readPanelUnlocked(slug: string): boolean {
  try {
    return window.sessionStorage.getItem(STORAGE_KEY_PREFIX + slug) === "1";
  } catch {
    // Storage can be blocked (private mode): the PIN is asked again.
    return false;
  }
}

/** Remembers, until the tab is closed, that the panel was unlocked; `false` locks it again. */
export function savePanelUnlocked(slug: string, isUnlocked: boolean): void {
  try {
    if (isUnlocked) {
      window.sessionStorage.setItem(STORAGE_KEY_PREFIX + slug, "1");
    } else {
      window.sessionStorage.removeItem(STORAGE_KEY_PREFIX + slug);
    }
  } catch {
    // Without storage the panel simply asks for the PIN on every visit.
  }
}
