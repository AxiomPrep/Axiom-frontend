export const TIMER_EVENT = "axiom-study-timer";

export function notifyTimerChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(TIMER_EVENT));
}
