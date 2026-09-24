export interface TimeRange {
  weekday: number;
  startTime: string;
  endTime: string;
}

export interface DayException {
  isClosed: boolean;
  startTime: string | null;
  endTime: string | null;
}

export function previewSlots(
  ranges: TimeRange[],
  weekday: number,
  exception: DayException | null,
  granularityMinutes: number,
): string[] {
  if (exception?.isClosed) return [];
  const windows = exception && !exception.isClosed && exception.startTime && exception.endTime
    ? [{ startTime: exception.startTime, endTime: exception.endTime }]
    : ranges.filter((range) => range.weekday === weekday);
  const slots: string[] = [];
  for (const window of windows) {
    let cursor = toMinutes(window.startTime);
    const end = toMinutes(window.endTime);
    while (cursor + granularityMinutes <= end) {
      slots.push(fromMinutes(cursor));
      cursor += granularityMinutes;
    }
  }
  return slots;
}

function toMinutes(value: string): number {
  const [hour, minute] = value.slice(0, 5).split(':').map(Number);
  return hour * 60 + minute;
}

function fromMinutes(value: number): string {
  const hour = Math.floor(value / 60);
  const minute = value % 60;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}
