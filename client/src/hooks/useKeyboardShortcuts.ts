import { useEffect } from "react";

type ShortcutMap = {
  [key: string]: (e: KeyboardEvent) => void;
};

/**
 * A custom hook to listen for global keyboard shortcuts.
 * It automatically ignores keypresses when the user is typing in an input, textarea, or contenteditable element.
 * 
 * @param shortcuts Object where keys are `KeyboardEvent.key` values (e.g., 'Escape', 'Delete', 'Enter') 
 *                  and values are the callback functions to execute.
 */
export const useKeyboardShortcuts = (shortcuts: ShortcutMap) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore shortcuts if the user is typing inside an input field, textarea, or content editable
      const activeElement = document.activeElement;
      if (activeElement) {
        const tagName = activeElement.tagName.toLowerCase();
        const isEditable = activeElement.getAttribute("contenteditable") === "true";
        if (tagName === "input" || tagName === "textarea" || isEditable) {
          return;
        }
      }

      // Check if the pressed key matches any of our registered shortcuts
      if (shortcuts[e.key] || shortcuts[e.code]) {
        // Find the matched callback
        const callback = shortcuts[e.key] || shortcuts[e.code];
        if (callback) {
          callback(e);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [shortcuts]);
};
