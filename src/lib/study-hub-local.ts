const KEY = "axiom-study-hub";
export const TIMER_EVENT = "axiom-study-timer";

export function notifyTimerChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(TIMER_EVENT));
}

export type LocalTodo = { id: string; title: string; is_done: boolean; day: string };
export type LocalActivity = {
  id: string;
  activity_type: string;
  label: string;
  duration_sec: number;
  created_at: string;
};

type Hub = {
  focus: boolean;
  running: { slug: string; startedAt: string } | null;
  totals: Record<string, number>;
  activities: LocalActivity[];
  todos: LocalTodo[];
  reflections: Record<string, string>;
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

function yesterday() {
  return new Date(Date.now() - 86400000).toISOString().slice(0, 10);
}

function totalKey(day: string, slug: string) {
  return `${day}:${slug}`;
}

function blank(): Hub {
  return { focus: false, running: null, totals: {}, activities: [], todos: [], reflections: {} };
}

export function readHub(): Hub {
  if (typeof window === "undefined") return blank();
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? ({ ...blank(), ...JSON.parse(raw) } as Hub) : blank();
  } catch {
    return blank();
  }
}

function writeHub(hub: Hub) {
  localStorage.setItem(KEY, JSON.stringify(hub));
  notifyTimerChanged();
}

export function localTimerSnapshot(slugList: string[]) {
  const hub = readHub();
  const day = today();
  const totals: Record<string, number> = {};
  for (const slug of slugList) totals[slug] = hub.totals[totalKey(day, slug)] || 0;
  return {
    running: hub.running,
    focus: hub.focus,
    totals,
    activities: hub.activities.filter((a) => a.created_at.slice(0, 10) === day),
  };
}

export function localStart(slug: string) {
  const hub = readHub();
  if (hub.running) localStop();
  const next = readHub();
  next.running = { slug, startedAt: new Date().toISOString() };
  writeHub(next);
}

export function localStop() {
  const hub = readHub();
  if (!hub.running) return;
  const day = today();
  const dur = Math.max(0, Math.floor((Date.now() - new Date(hub.running.startedAt).getTime()) / 1000));
  const key = totalKey(day, hub.running.slug);
  hub.totals[key] = (hub.totals[key] || 0) + dur;
  hub.activities.unshift({
    id: `act-${Date.now()}`,
    activity_type: "other",
    label: `Focus session · ${hub.running.slug}`,
    duration_sec: dur,
    created_at: new Date().toISOString(),
  });
  hub.running = null;
  writeHub(hub);
}

export function localToggleFocus() {
  const hub = readHub();
  hub.focus = !hub.focus;
  writeHub(hub);
  return hub.focus;
}

export function localTodosSnapshot() {
  const hub = readHub();
  const day = today();
  const yday = yesterday();
  const todos = hub.todos.filter((t) => t.day === day);
  const incomplete = hub.todos.filter((t) => t.day === yday && !t.is_done);
  return {
    todos,
    reflection: hub.reflections[day] ? { incomplete_reason: hub.reflections[day] } : null,
    yesterday_carryover: {
      day: yday,
      incomplete,
      reason: hub.reflections[yday] || null,
    },
  };
}

export function localAddTodo(title: string) {
  const hub = readHub();
  hub.todos.push({ id: `todo-${Date.now()}`, title, is_done: false, day: today() });
  writeHub(hub);
}

export function localToggleTodo(id: string) {
  const hub = readHub();
  hub.todos = hub.todos.map((t) => (t.id === id ? { ...t, is_done: !t.is_done } : t));
  writeHub(hub);
}

export function localDeleteTodo(id: string) {
  const hub = readHub();
  hub.todos = hub.todos.filter((t) => t.id !== id);
  writeHub(hub);
}

export function localSaveReflection(reason: string) {
  const hub = readHub();
  hub.reflections[today()] = reason;
  writeHub(hub);
}
