import assert from "node:assert/strict";
import test from "node:test";

import { createMonthlyReminderCalendar } from "../src/lib/monthlyReminder.ts";

test("creates a recurring monthly reminder in the current month", () => {
  const reminder = createMonthlyReminderCalendar({
    locale: "de",
    reminderDay: 5,
    now: new Date("2026-09-02T12:00:00.000Z"),
  });

  assert.equal(reminder.fileName, "eavesence-monthly-reminder.ics");
  assert.match(reminder.content, /DTSTART:20260905T180000/);
  assert.match(reminder.content, /RRULE:FREQ=MONTHLY;BYMONTHDAY=5/);
  assert.match(reminder.content, /SUMMARY:EAVESENCE Monatswert eintragen/);
  assert.match(reminder.content, /URL:https:\/\/eavesence\.com\/home/);
});

test("moves the first reminder to next month and clamps unsafe days", () => {
  const reminder = createMonthlyReminderCalendar({
    locale: "en",
    reminderDay: 31,
    now: new Date("2026-12-29T12:00:00.000Z"),
  });

  assert.match(reminder.content, /DTSTART:20270128T180000/);
  assert.match(reminder.content, /RRULE:FREQ=MONTHLY;BYMONTHDAY=28/);
  assert.match(reminder.content, /SUMMARY:Add EAVESENCE monthly value/);
});
