import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";

function escapeCalendar(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

export async function shareDeadline(name: string, date: string, locale: "de" | "en" = "de") {
  if (!(await Sharing.isAvailableAsync()) || !/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("Calendar unavailable");
  const start = date.replace(/-/g, "");
  const next = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(next.getTime()) || next.toISOString().slice(0, 10) !== date) throw new Error("Invalid date");
  next.setUTCDate(next.getUTCDate() + 1);
  const end = next.toISOString().slice(0, 10).replace(/-/g, "");
  const file = new File(Paths.cache, `eavesence-frist-${start}.ics`);
  file.create({ overwrite: true });
  file.write(`BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//EAVESENCE//Home//DE\r\nBEGIN:VEVENT\r\nUID:eavesence-${start}-${encodeURIComponent(name)}\r\nDTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")}\r\nDTSTART;VALUE=DATE:${start}\r\nDTEND;VALUE=DATE:${end}\r\nSUMMARY:${escapeCalendar(name)}\r\nEND:VEVENT\r\nEND:VCALENDAR\r\n`);
  await Sharing.shareAsync(file.uri, { mimeType: "text/calendar", dialogTitle: locale === "de" ? "Frist vormerken" : "Add deadline to calendar" });
}
