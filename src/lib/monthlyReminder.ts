import type { Locale } from "@/i18n/config";

type MonthlyReminderCalendar = {
  content: string;
  fileName: string;
};

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function calendarDate(year: number, monthIndex: number, day: number) {
  return `${year}${pad(monthIndex + 1)}${pad(day)}`;
}

function nextReminderDate(now: Date, reminderDay: number) {
  const year = now.getFullYear();
  const monthIndex = now.getMonth();

  if (now.getDate() <= reminderDay) {
    return { year, monthIndex };
  }

  const nextMonth = new Date(year, monthIndex + 1, 1);
  return { year: nextMonth.getFullYear(), monthIndex: nextMonth.getMonth() };
}

export function createMonthlyReminderCalendar({
  locale,
  reminderDay = 5,
  now = new Date(),
}: {
  locale: Locale;
  reminderDay?: number;
  now?: Date;
}): MonthlyReminderCalendar {
  const safeDay = Math.min(28, Math.max(1, Math.round(reminderDay)));
  const start = nextReminderDate(now, safeDay);
  const startDate = `${calendarDate(start.year, start.monthIndex, safeDay)}T180000`;
  const createdAt = now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const summary =
    locale === "de"
      ? "EAVESENCE Monatswert eintragen"
      : "Add EAVESENCE monthly value";
  const description =
    locale === "de"
      ? "Verbrauch oder Rechnungsbetrag in Mein Zuhause ergänzen."
      : "Add consumption or the bill amount in My home.";

  return {
    fileName: "eavesence-monthly-reminder.ics",
    content: [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//EAVESENCE//Monthly Energy Reminder//EN",
      "CALSCALE:GREGORIAN",
      "BEGIN:VEVENT",
      "UID:monthly-check-in@eavesence.com",
      `DTSTAMP:${createdAt}`,
      `DTSTART:${startDate}`,
      "DURATION:PT15M",
      `RRULE:FREQ=MONTHLY;BYMONTHDAY=${safeDay}`,
      `SUMMARY:${summary}`,
      `DESCRIPTION:${description}`,
      "URL:https://eavesence.com/home",
      "END:VEVENT",
      "END:VCALENDAR",
      "",
    ].join("\r\n"),
  };
}
