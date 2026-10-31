const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function meetingWindow(weekday: number, startTime: string, durationMinutes: number, now = new Date()) {
  const [hour, minute] = startTime.split(":").map(Number);
  const start = new Date(now);
  start.setHours(hour || 0, minute || 0, 0, 0);
  start.setDate(now.getDate() + ((weekday - now.getDay() + 7) % 7));
  let end = new Date(start.getTime() + durationMinutes * 60_000);
  if (now.getTime() > end.getTime()) {
    start.setDate(start.getDate() + 7);
    end = new Date(start.getTime() + durationMinutes * 60_000);
  }
  const label = start.toLocaleString("en-IN", { weekday: "long", hour: "numeric", minute: "2-digit" });
  return {
    open: now.getTime() >= start.getTime() && now.getTime() <= end.getTime(),
    start,
    label: label || `${DAYS[weekday] || "Weekly"} ${startTime}`,
  };
}

export function parseMeetingMessage(content: string | null) {
  if (!content) return null;
  const match = content.match(/^\[\[meet:([0-9a-f-]{36})\]\]([\s\S]*)$/i);
  if (!match) return null;
  return { id: match[1], text: match[2].trim() };
}
