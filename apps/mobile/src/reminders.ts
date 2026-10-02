import * as Notifications from "expo-notifications";

const reminderTitle = "EAVESENCE Monats-Check";

async function scheduledReminders() {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  return scheduled.filter((request) => request.content.data?.eavesenceMonthlyCheck === true || request.content.title === reminderTitle);
}

export async function monthlyReminderIsActive() {
  const requests = await scheduledReminders();
  return requests.some((request) => {
    // iOS serializes MONTHLY as a repeating calendar trigger; Android keeps monthly.
    const trigger = request.trigger as unknown as { type?: string; repeats?: boolean; dateComponents?: { day?: number; hour?: number; minute?: number; month?: number; year?: number } } | null;
    const monthly = trigger?.type === "monthly";
    const calendar = trigger?.type === "calendar" && trigger.repeats === true && trigger.dateComponents?.day === 1 && trigger.dateComponents.hour === 9 && trigger.dateComponents.minute === 0 && trigger.dateComponents.month == null && trigger.dateComponents.year == null;
    return request.content.data?.eavesenceMonthlyCheck === true && (monthly || calendar);
  });
}

export async function disableMonthlyReminder() {
  const requests = await scheduledReminders();
  await Promise.all(requests.map((request) => Notifications.cancelScheduledNotificationAsync(request.identifier)));
}

export async function enableMonthlyReminder(locale: "de" | "en" = "de") {
  const permission = await Notifications.requestPermissionsAsync();
  if (!permission.granted) return false;

  // Replace the old one-off reminder as well as duplicate requests from previous taps.
  await disableMonthlyReminder();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: locale === "de" ? reminderTitle : "EAVESENCE monthly check",
      body: locale === "de" ? "Prüfe Einkommen, Fixkosten und Alltagsschätzung. Dein Monatscheck ist bereit." : "Review income, fixed costs and your everyday estimate. Your monthly check is ready.",
      data: { eavesenceMonthlyCheck: true },
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.MONTHLY, day: 1, hour: 9, minute: 0 },
  });
  return true;
}

export async function scheduleCostReview(cost: {id:string;name:string;cancellationDeadline?:string},de:boolean) {
 if(!cost.cancellationDeadline)return false;
 const date=new Date(`${cost.cancellationDeadline}T09:00:00`);date.setDate(date.getDate()-3);
 if(date<=new Date())date.setTime(Date.now()+60000);
 const permission=await Notifications.requestPermissionsAsync();if(!permission.granted)return false;
 const identifier=`eavesence-review-${cost.id}`;
 await Notifications.cancelScheduledNotificationAsync(identifier);
 await Notifications.scheduleNotificationAsync({identifier,content:{data:{eavesenceCostReview:true},title:de?'EAVESENCE · Kosten prüfen':'EAVESENCE · Review cost',body:`${cost.name} · ${de?'Frist':'Deadline'}: ${cost.cancellationDeadline}`},trigger:{type:Notifications.SchedulableTriggerInputTypes.DATE,date}});
 return true;
}

export async function cancelCostReview(id: string) {
  await Notifications.cancelScheduledNotificationAsync(`eavesence-review-${id}`);
}

/** Remove only this app's scheduled reminders, including legacy review IDs. */
export async function disableAllReminders() {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const owned = scheduled.filter(request => request.content.data?.eavesenceMonthlyCheck === true || request.content.data?.eavesenceCostReview === true || request.content.title === reminderTitle || request.identifier.startsWith("eavesence-review-"));
  await Promise.all(owned.map(request => Notifications.cancelScheduledNotificationAsync(request.identifier)));
}

export async function disableCostReminders() {
  const requests = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(requests.filter(request => request.content.data?.eavesenceCostReview === true || request.identifier.startsWith("eavesence-review-")).map(request => Notifications.cancelScheduledNotificationAsync(request.identifier)));
}
