import { type Ref, onBeforeUnmount } from 'vue';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

type FocusTrapContainer = Element | { $el?: Element | null } | null;

export function useFocusTrap(containerRef: Ref<FocusTrapContainer>) {
  let keydownHandler: ((e: KeyboardEvent) => void) | null = null;

  function resolveContainer(): HTMLElement | null {
    const el = containerRef.value;
    if (!el) return null;

    if (el instanceof HTMLElement) return el;

    if (typeof el === 'object' && '$el' in el && el.$el instanceof HTMLElement) {
      return el.$el;
    }

    return null;
  }

  function getFocusableElements(): HTMLElement[] {
    const el = resolveContainer();
    if (!el) return [];
    return Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
  }

  function activate() {
    const el = resolveContainer();
    if (!el) return;

    // Focus the first focusable element
    const focusable = getFocusableElements();
    if (focusable.length > 0) {
      focusable[0].focus();
    } else {
      // Fallback: focus the container itself if nothing is focusable
      el.setAttribute('tabindex', '-1');
      el.focus();
    }

    // Add keydown listener
    keydownHandler = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusable = getFocusableElements();
      if (focusable.length === 0) {
        e.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    el.addEventListener('keydown', keydownHandler);
  }

  function deactivate() {
    const el = resolveContainer();

    if (keydownHandler && el) {
      el.removeEventListener('keydown', keydownHandler);
      keydownHandler = null;
    }
  }

  // Clean up on unmount if still active
  onBeforeUnmount(deactivate);

  return { activate, deactivate };
}
