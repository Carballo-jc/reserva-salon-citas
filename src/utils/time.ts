const MINUTES_PER_DAY = 24 * 60;

/** Adds minutes to an HH:mm time, e.g. ("16:00", 120) -> "18:00". Wraps around midnight. */
export function addMinutesToTime(time: string, minutes: number): string {
  const [hours, mins] = time.split(":").map(Number);
  const total = (hours * 60 + mins + minutes) % MINUTES_PER_DAY;
  const endHours = String(Math.floor(total / 60)).padStart(2, "0");
  const endMins = String(total % 60).padStart(2, "0");
  return `${endHours}:${endMins}`;
}
