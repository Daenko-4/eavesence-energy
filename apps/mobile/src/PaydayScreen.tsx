import { ScrollTargetContext } from "./ScrollNavigation";
import { QuickCheck } from "./QuickCheck";
import { useContext, useRef, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { usePaymentChecklist } from "@eavesence/core/usePaymentChecklist";
import { paymentKey } from "@eavesence/core/paymentChecklist";
import { DisclosureIcon } from "./BrandMotion";
import { useCashWindow } from "@eavesence/core/useCashWindow";
import type { PlanningData } from "@eavesence/core/planning";
import {
  type SavingsPlanInput,
} from "@eavesence/core/savingsPlan";
import { FormSection, FormSubmitButton } from "./FormSection";
import { FormInput } from "./FormInput";
import { LocalizedText as Text, useMobileLocale } from "./i18n";
export function PaydayScreen({
  input,
  data,
  onSave,
  currency,
  onReviewCost,
  onSavings,
  onPayments,
}: {
  input: SavingsPlanInput;
  data?: PlanningData;
  onSave: (p: PlanningData) => Promise<void>;
  onSavings?: () => void;
  onPayments?: () => void;
  onReviewCost?: (cost: SavingsPlanInput["costs"][number]) => void;
  currency: string;
}) {
  const de = useMobileLocale() === "de",
    t = (a: string, b: string) => (de ? a : b),
    p = useCashWindow(input, data, onSave, de),
    [open, setOpen] = useState(false);
  const checklist = usePaymentChecklist(input.costs,data,onSave,de);
  const [billsOpen,setBillsOpen] = useState(false);
  const [calculationOpen,setCalculationOpen] = useState(false);
  const [focusBalance,setFocusBalance] = useState(false);
  const [balanceFocusRequest,setBalanceFocusRequest]=useState(0);
  const formTarget=useRef<View>(null),billsTarget=useRef<View>(null),scrollTarget=useContext(ScrollTargetContext);
  function reviewBalance(){setOpen(true);setFocusBalance(true);setBalanceFocusRequest(n=>n+1);requestAnimationFrame(()=>scrollTarget(formTarget.current));}
  function reviewPayments(){if(onPayments){onPayments();return;}setBillsOpen(true);requestAnimationFrame(()=>scrollTarget(billsTarget.current));}
  const money = (n: number) =>
      new Intl.NumberFormat(de ? "de-AT" : "en-GB", {
        style: "currency",
        currency,
      }).format(n),
    complete =
      !!p.forecast &&
      p.forecast.remaining !== null &&
      p.forecast.missingDates === 0;
  const day = (s: string) =>
    new Intl.DateTimeFormat(de ? "de-AT" : "en-GB", {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    }).format(new Date(`${s}T00:00:00Z`));
  const dateInput = (value: string) => {
    const d = value.replace(/\D/g, "").slice(0, 8);
    return d.length === 8
      ? `${d.slice(4)}-${d.slice(2, 4)}-${d.slice(0, 2)}`
      : [d.slice(0,2),d.slice(2,4),d.slice(4)].filter(Boolean).join(".");
  };
  const display = p.payday.match(/^\d{4}-\d{2}-\d{2}$/)
    ? p.payday.split("-").reverse().join(".")
    : p.payday;
  const button = (label: string, action: () => void) => (
    <Pressable
      accessibilityRole="button"
      disabled={p.busy}
      style={styles.button}
      onPress={action}
    >
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );
  const shortfall = complete && p.forecast!.remaining! < 0;
  const calculationRows = p.forecast ? [
    [t("Aktueller Kontostand", "Current account balance"), p.cash!.balance],
    [t("− Noch offene Rechnungen", "− Unpaid bills"), p.forecast.fixed],
    [p.forecast.estimated
      ? t("− Alltag (anteilig geschätzt)", "− Everyday spending (estimated share)")
      : t("− Alltag (deine Eingabe)", "− Everyday spending (your entry)"), p.forecast.everyday],
    [t("− Reserve", "− Money kept in reserve"), p.cash!.protected],
  ] : [];
  return (
    <View style={styles.card}>
      <View style={styles.dark}>
        <Text style={styles.eyebrow}>
          {complete
            ? t("Bis zum nächsten Gehalt", "Until your next payday")
            : t("Bis zum nächsten Gehalt", "Until your next payday")}
        </Text>
        <Text style={styles.title}>
          {complete
            ? t(
                shortfall ? `Bis ${day(p.cash!.payday)} fehlen dir voraussichtlich` : `Bis ${day(p.cash!.payday)} kannst du zusätzlich ausgeben`,
                shortfall ? `Estimated shortfall until ${day(p.cash!.payday)}` : `You can spend this extra until ${day(p.cash!.payday)}`,
              )
            : t("Was kann ich bis zum nächsten Gehalt ausgeben?", "What can I spend until my next payday?")}
        </Text>
        <Text style={[styles.amount, shortfall ? styles.shortfallAmount : styles.positive]} accessibilityLiveRegion="polite">
          {complete
            ? money(Math.abs(p.forecast!.remaining!))
            : "—"}
        </Text>
        <Text style={styles.light}>
          {complete
            ? t(
                shortfall ? "Dein Kontostand reicht für die offenen Rechnungen, geplanten Alltagsausgaben und deine Reserve noch nicht aus." : "Offene Rechnungen, dein geplanter Alltag und die Reserve sind schon abgezogen. Dieser Betrag bleibt darüber hinaus übrig.",
                shortfall ? "Your balance does not cover unpaid bills, planned everyday spending and your reserve yet." : "Unpaid bills, planned everyday spending and your reserve are already deducted. This amount is left on top.",
              )
            : t(
                p.cash && p.cash.payday <= p.today ? "Dein Gehaltstermin ist erreicht. Trage den aktuellen Kontostand und den nächsten Gehaltstag ein." : p.forecast ? `Dein Kontostand ist erfasst. Noch offen: ${[p.forecast.missingDates > 0 ? "Zahlungstermine" : "", p.forecast.everyday === null ? "Alltagsschätzung" : ""].filter(Boolean).join(" und ")}. Ergänze diese Angaben für einen vollständigen Spielraum.` : "Kontostand eintragen, nächsten Gehaltstag wählen und Alltag bis dahin schätzen. Offene Rechnungen aus My Home berücksichtigen wir automatisch.",
                p.cash && p.cash.payday <= p.today ? "Your payday has arrived. Enter your current balance and your next payday." : p.forecast ? `Your balance is recorded. Still missing: ${[p.forecast.missingDates > 0 ? "payment dates" : "", p.forecast.everyday === null ? "everyday-spending estimate" : ""].filter(Boolean).join(" and ")}. Add these to see a complete available budget.` : "Enter your account balance, choose your next payday and estimate everyday spending until then. We include unpaid bills from My Home automatically.",
              )}
        </Text>

        {complete && p.forecast!.remaining! < 0 && <Text style={styles.warning}>{t(`Es fehlen voraussichtlich ${money(-p.forecast!.remaining!)}. Prüfe offene Zahlungen und deine Alltagsschätzung.`, `Estimated shortfall: ${money(-p.forecast!.remaining!)}. Review pending payments and your everyday estimate.`)}</Text>}
        {p.forecast && p.forecast.overdue > 0 && <Text style={styles.warning}>{t(`${p.forecast.overdue} frühere Zahlungen dieses Monats sind noch nicht abgehakt und deshalb enthalten. Bereits bezahlt? In der Monatscheckliste abhaken und Guthaben erneut bestätigen.`, `${p.forecast.overdue} earlier payments this month are still unchecked and included. Already paid? Check them off in the monthly checklist, then confirm your balance again.`)}</Text>}
        {p.forecast && input.costs.filter(c => !c.nextDueDate).map(c => <Pressable key={c.id} accessibilityRole="button" style={styles.mintButton} onPress={() => onReviewCost?.(c)}><Text style={styles.mintText}>{c.name} · {t("Termin ergänzen", "Add date")}</Text></Pressable>)}
        {p.forecast?.everyday === null && <Text style={styles.warning}>{t("Noch offen: Alltag bis zum Gehalt. Öffne die Rechnung und ergänze den Betrag; 0 ist möglich.", "Still missing: everyday spending until payday. Open the calculation and add an amount; 0 is allowed.")}</Text>}
        {p.stale && (
          <Text style={styles.warning}>
            {t(
              "Bitte aktualisiere deinen Kontostand. Seit dem letzten Tag oder einer abgehakten Zahlung kann er sich geändert haben.",
              "Please update your account balance. It may have changed since the last day or a payment was checked off.",
            )}
          </Text>
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: open }}
          style={styles.mintButton}
          onPress={() => {setFocusBalance(!open);setOpen(!open);}}
        >
          <Text style={styles.mintText}>
            {open
              ? t("Einklappen", "Collapse")
              : p.cash
                ? t(
                    "Kontostand aktualisieren",
                    "Update account balance",
                  )
                : t("Verfügbares Geld berechnen", "Calculate available money")}
          </Text>
        </Pressable>
      </View>
      {!open && p.forecast && <View style={styles.form}><Pressable accessibilityRole="button" accessibilityState={{expanded:calculationOpen}} onPress={()=>setCalculationOpen(!calculationOpen)} style={styles.disclosure}><Text style={styles.subTitle}>{t("So berechnen wir dein verfügbares Geld", "How your available money is calculated")}</Text><DisclosureIcon open={calculationOpen}/></Pressable>{calculationOpen&&<>{calculationRows.map(([label, value]) => <Text key={String(label)} style={styles.note}>{label}: {value === null ? "—" : money(Number(value))}</Text>)}<Text style={styles.subTitle}>{complete ? t("= Zusätzlich verfügbares Geld", "= Extra available") : t("= Angaben fehlen noch", "= Entries still missing")}: {complete ? money(p.forecast!.remaining!) : "—"}</Text><Text style={styles.note}>{complete&&p.forecast!.remaining!>=0?t(`Rechnerisch zusätzlich ${money(p.forecast!.remaining!/p.forecast!.days)} pro Tag. Alltag ist schon abgezogen.`,`Equivalent to ${money(p.forecast!.remaining!/p.forecast!.days)} extra per day. Everyday spending is already deducted.`):""}</Text></>}</View>}
      {open && (
        <View ref={formTarget} onLayout={()=>{if(focusBalance)scrollTarget(formTarget.current);}}><FormSection style={styles.form} onSave={p.save} saveLabel={t("Verfügbares Geld berechnen", "Calculate available money")}>
          <Text style={styles.note}>
            {t(
              "Kontostand → offene Rechnungen abziehen → Alltag und Reserve abziehen → zusätzlicher Spielraum. Bereits bezahlte Rechnungen in der Monatscheckliste abhaken, damit sie nicht doppelt abgezogen werden. Das nächste Gehalt zählt noch nicht dazu.",
              "Account balance → subtract unpaid bills → subtract everyday spending and reserve → extra money available. Check off bills already paid in the monthly checklist so they are not deducted twice. Your next salary is not added yet.",
            )}
          </Text>
          <FormInput
            autoFocus={focusBalance}
            focusRequest={balanceFocusRequest}
            label={t("Aktueller Kontostand", "Current account balance")}
            keyboardType="numbers-and-punctuation"
            value={p.balance}
            onChangeText={p.setBalance}
          />
          <Text style={styles.note}>
            {t(
              "So wie heute in deiner Banking-App. Offene Rechnungen noch nicht abziehen – das machen wir. Bei mehreren verwendeten Konten die Kontostände addieren; ein Minus ist möglich.",
              "Use the balance shown in your banking app today. Do not subtract unpaid bills – we do that. If you use several accounts, add their balances; negative balances are allowed.",
            )}
          </Text>
          <FormInput
            label={t(
              "Nächstes Gehalt am (TT.MM.JJJJ)",
              "Next payday (DD.MM.YYYY)",
            )}
            keyboardType="number-pad"
            maxLength={10}
            placeholder={p.today.split("-").reverse().join(".")}
            value={display}
            onChangeText={(v) => p.setPayday(dateInput(v))}
          />
          <View style={styles.row}>
            {[7, 14, 28].map((n) =>
              button(t(`In ${n} Tagen`, `In ${n} days`), () =>
                p.setPayday(
                  new Date(Date.parse(p.today) + n * 86400000)
                    .toISOString()
                    .slice(0, 10),
                ),
              ),
            )}
          </View>
          <FormInput
            label={t(
              "Reserve, die übrig bleiben soll (optional)",
              "Money to keep in reserve (optional)",
            )}
            keyboardType="decimal-pad"
            value={p.protectedAmount}
            onChangeText={p.setProtected}
          />
          <Text style={styles.note}>
            {t(
              "Ein Teil dieses Kontostands, den du behalten möchtest. Rechnungen und Alltagsausgaben hier nicht nochmals eintragen. 0 ist möglich. Gespeicherte Sparziele werden nicht automatisch abgezogen.",
              "Part of this account balance you want to keep. Do not include bills or everyday spending again. 0 is allowed. Saved goals are not automatically deducted.",
            )}
          </Text>
          <FormInput
            label={t(
              "Alltagsausgaben bis zum Gehalt",
              "Everyday spending until payday",
            )}
            value={p.everyday}
            onChangeText={p.setEveryday}
            keyboardType="decimal-pad"
            placeholder={t(
              "Leer = aus Monatsschätzung",
              "Blank = use monthly estimate",
            )}
          />
          <Text style={styles.note}>{t("Für Lebensmittel, Freizeit und andere Ausgaben bis zum Gehalt. Gespeicherte Rechnungen nicht nochmals eintragen. Leer = vorhandene Monatsschätzung verwenden; ohne Schätzung ist ein Betrag nötig, auch 0.", "For groceries, leisure and other spending until payday. Do not include saved bills again. Blank = use your existing monthly estimate; without one, enter an amount, including 0.")}</Text>
          <FormSubmitButton label={t("Verfügbares Geld berechnen", "Calculate available money")} style={styles.button} textStyle={styles.buttonText}/>
          {p.error && (
            <Text accessibilityRole="alert" style={styles.error}>
              {p.error}
            </Text>
          )}
          {p.forecast && (
            <View style={styles.box}>
              {calculationRows.map(([label, n]) => (
                <Text key={String(label)} style={styles.note}>
                  {label}: {n === null ? "—" : money(Number(n))}
                </Text>
              ))}
              {p.forecast.missingDates > 0 && (
                <Text style={styles.error}>
                  {t(
                    `${p.forecast.missingDates} Kosten ohne Zahlungstermin fehlen. Noch kein vollständiger Spielraum.`,
                    `${p.forecast.missingDates} undated costs are missing. Available budget is incomplete.`,
                  )}
                </Text>
              )}
              {p.forecast.everyday === null && (
                <Text style={styles.note}>
                  {t("Alltagsschätzung fehlt.", "Everyday estimate missing.")}
                </Text>
              )}

            </View>
          )}
        </FormSection></View>
      )}
      <QuickCheck input={input} data={data} onSave={onSave} onBalance={reviewBalance} onPayments={reviewPayments} onSavings={onSavings} onReview={onReviewCost}/>
      {p.bills.length > 0 && <View ref={billsTarget} onLayout={()=>{if(billsOpen)scrollTarget(billsTarget.current);}} style={styles.form}><Pressable accessibilityRole="button" accessibilityState={{expanded:billsOpen}} onPress={()=>setBillsOpen(!billsOpen)} style={styles.disclosure}><Text style={styles.note}>{t("Zahlungen bis zum Gehalt abhaken", "Check off payments until payday")} · {p.bills.filter(b=>!checklist.isPaid(b)).length} {t("offen", "unpaid")}</Text><DisclosureIcon open={billsOpen}/></Pressable>{billsOpen&&<><Text style={styles.note}>{t("Bereits abgebucht oder bezahlt? Hier abhaken. Das Häkchen erscheint auch in deiner Monatscheckliste. Danach den aktuellen Kontostand bestätigen.", "Already debited or paid? Check it off here. The same checkmark appears in your monthly checklist. Then confirm your current account balance.")}</Text>{p.bills.map(b=>{const paid=checklist.isPaid(b);return <Pressable key={paymentKey({costId:b.cost.id,month:b.month,date:b.date})} accessibilityRole="checkbox" accessibilityState={{checked:paid,disabled:checklist.busy}} accessibilityLabel={`${b.cost.name} · ${day(b.date)} · ${money(b.cost.amount)} · ${t("Bezahlt", "Paid")}`} disabled={checklist.busy} onPress={()=>void checklist.toggle(b)} style={styles.payment}><Text style={styles.check}>{paid?"✓":"○"}</Text><Text style={[styles.paymentName,paid&&styles.paid]}>{b.cost.name} · {day(b.date)}</Text><Text style={styles.note}>{money(b.cost.amount)}</Text></Pressable>})}{checklist.error&&<Text accessibilityRole="alert" style={styles.error}>{checklist.error}</Text>}</>}</View>}
    </View>
  );
}
const styles = StyleSheet.create({
  disclosure: {minHeight:44,flexDirection:"row",alignItems:"center",justifyContent:"space-between",gap:10},
  payment: {minHeight:48,flexDirection:"row",alignItems:"center",gap:10},
  paymentName: {fontSize:12,color:"#24272c",flex:1},
  paid: {textDecorationLine:"line-through",color:"#65716d"},
  check: {fontSize:22,color:"#28734d"},
  card: {
    marginVertical: 14,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#32363b",
  },
  dark: { padding: 18, gap: 9, backgroundColor: "#24272c" },
  eyebrow: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    color: "#72dca3",
  },
  title: { fontSize: 20, fontWeight: "800", color: "#fff" },
  amount: { fontSize: 28, fontWeight: "900", color: "#fff" },
  positive: {color:"#72dca3"},
  shortfallAmount: {color:"#ffd28c"},
  light: { fontSize: 13, lineHeight: 20, color: "#d1d7d4" },
  warning: { fontSize: 12, color: "#ffe1a8" },
  mintButton: {
    alignSelf: "flex-start",
    backgroundColor: "#72dca3",
    padding: 12,
    borderRadius: 22,
  },
  mintText: { fontSize: 12, fontWeight: "800", color: "#17211f" },
  form: { padding: 14, gap: 12, backgroundColor: "#fff" },
  note: { fontSize: 13, lineHeight: 20, color: "#52605b" },
  subTitle: { fontSize: 14, fontWeight: "800", color: "#24272c" },
  button: {
    minHeight: 44,
    borderRadius: 20,
    padding: 10,
    alignSelf: "flex-start",
    backgroundColor: "#fff", borderWidth: 1, borderColor: "#dfe5dd",
  },
  buttonText: { fontSize: 12, fontWeight: "700", color: "#087a45" },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  error: { fontSize: 13, lineHeight: 20, color: "#b91c1c" },
  box: { padding: 12, gap: 8, borderRadius: 12, backgroundColor: "#f4f6f2" },
});
