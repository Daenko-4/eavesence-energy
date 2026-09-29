import * as Notifications from "expo-notifications";

const reminderTitle = "EAVESENCE Monats-Check";

async function scheduledReminders() {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  return scheduled.filter((request) => request.content.title === reminderTitle);
}

export async function monthlyReminderIsActive() {
  const requests = await scheduledReminders();
  return requests.some((request) => {
    const trigger = request.trigger;
    return request.content.data?.eavesenceMonthlyCheck === true && trigger !== null && "type" in trigger && trigger.type === "monthly";
  });
}

export async function disableMonthlyReminder() {
  const requests = await scheduledReminders();
  await Promise.all(requests.map((request) => Notifications.cancelScheduledNotificationAsync(request.identifier)));
}

export async function enableMonthlyReminder() {
  const permission = await Notifications.requestPermissionsAsync();
  if (!permission.granted) return false;

  // Replace the old one-off reminder as well as duplicate requests from previous taps.
  await disableMonthlyReminder();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: reminderTitle,
      body: "Aktualisiere Verbrauch und Kosten deines Zuhauses.",
      data: { eavesenceMonthlyCheck: true },
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.MONTHLY, day: 1, hour: 9, minute: 0 },
  });
  return true;
}
