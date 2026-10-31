type Listener = (pending: boolean) => void;

const listeners = new Set<Listener>();
let pending = false;
let hideTimer = 0;

export function subscribeNavProgress(listener: Listener) {
  listeners.add(listener);
  listener(pending);
  return () => {
    listeners.delete(listener);
  };
}

function emit(next: boolean) {
  if (pending === next) return;
  pending = next;
  listeners.forEach((listener) => listener(next));
}

export function markNavigating() {
  if (hideTimer) window.clearTimeout(hideTimer);
  emit(true);
}

export function markNavigationDone() {
  if (!pending) return;
  if (hideTimer) window.clearTimeout(hideTimer);
  hideTimer = window.setTimeout(() => emit(false), 60);
}
