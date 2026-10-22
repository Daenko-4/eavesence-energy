import {PaymentAmountEditor} from "./MonthlyPayments";
import { ScrollTargetContext } from "./ScrollNavigation";
import { QuickCheck } from "./QuickCheck";
import { useContext, useRef, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { usePaymentChecklist } from "@eavesence/core/usePaymentChecklist";
import { paymentKey } from "@eavesence/core/paymentChecklist";
import { DisclosureIcon } from "./BrandMotion";
import { type CashInputField, useCashWindow } from "@eavesence/core/useCashWindow";
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
  embedded = false,
}: {
  embedded?: boolean;
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
  const bills = open ? p.previewBills : p.bills;
  const [billsOpen,setBillsOpen] = useState(false);
  const [reserveOpen,setReserveOpen] = useState(false);
  const [invalidFocus,setInvalidFocus] = useState<{field: CashInputField | null; request: number}>({field:null,request:0});
  function focusInvalid(field: CashInputField) {
    if (field === "protected") setReserveOpen(true);
    setInvalidFocus(previous => ({field,request:previous.request+1}));
  }
  const [calculationOpen,setCalculationOpen] = useState(false);
  const [focusBalance,setFocusBalance] = useState(false);
  const [balanceFocusRequest,setBalanceFocusRequest]=useState(0);
  const resultTarget=useRef<View>(null),formTarget=useRef<View>(null),billsTarget=useRef<View>(null),scrollTarget=useContext(ScrollTargetContext);
  const pendingBalanceScroll=useRef(false),pendingBillsScroll=useRef(false);
  function revealBalance(){if(pendingBalanceScroll.current&&formTarget.current){scrollTarget(formTarget.current);pendingBalanceScroll.current=false;}}
  function revealBills(){if(pendingBillsScroll.current&&billsTarget.current){scrollTarget(billsTarget.current);pendingBillsScroll.current=false;}}
  function reviewBalance(){pendingBalanceScroll.current=true;setOpen(true);setFocusBalance(true);setBalanceFocusRequest(n=>n+1);requestAnimationFrame(revealBalance);}
  function reviewPayments(){if(onPayments){onPayments();return;}pendingBillsScroll.current=true;setBillsOpen(true);requestAnimationFrame(revealBills);}
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
    [t(p.forecast.estimatedBills ? "− Offene Rechnungen (mit Schätzungen)" : "− Noch offene Rechnungen", p.forecast.estimatedBills ? "− Unpaid bills (includes estimates)" : "− Unpaid bills"), p.forecast.fixed],
    [p.forecast.estimated
      ? t("− Alltag (anteilig geschätzt)", "− Everyday spending (estimated share)")
      : t("− Alltag (deine Eingabe)", "− Everyday spending (your entry)"), p.forecast.everyday],
    [t("− Reserve", "− Money kept in reserve"), p.cash!.protected],
  ] : [];
  const expired = !!p.cash && p.cash.payday <= p.today;
  const missingDates = p.forecast?.missingDates ?? 0;
  const missingEveryday = p.forecast?.everyday === null;
  const state = !p.cash ? "empty" : expired ? "expired" : p.stale ? "stale" : missingDates > 0 ? "dates" : missingEveryday ? "everyday" : complete ? "ready" : "incomplete";
  const currentResult = complete && state === "ready";
  const statusText = state === "empty"
    ? t("Was bleibt nach Rechnungen und Alltag? Mit drei Angaben siehst du es.", "What is left after bills and everyday spending? Find out with three entries.")
    : state === "expired"
      ? t("Wähle den nächsten Gehaltstag und bestätige deinen Kontostand.", "Choose your next payday and confirm your account balance.")
      : state === "stale"
        ? p.cash?.needsRefresh
          ? t("Zahlungen wurden geändert. Bestätige den Kontostand aus deiner Banking-App erneut.", "Payments changed. Confirm the balance from your banking app again.")
          : t(`Kontostand vom ${day(p.cash!.asOf)}. Für heute bitte erneut bestätigen.`, `Balance from ${day(p.cash!.asOf)}. Please confirm it for today.`)
        : missingDates > 0
          ? t(`${missingDates} Kosten ohne Zahlungstermin. Ergänze sie für eine vollständige Rechnung.`, `${missingDates === 1 ? "1 cost has" : `${missingDates} costs have`} no payment date. Add ${missingDates === 1 ? "it" : "them"} for a complete calculation.`)
          : missingEveryday
            ? t("Wie viel brauchst du bis zum Gehalt noch für den Alltag? Auch 0 ist möglich.", "How much do you still need for everyday spending until payday? 0 is allowed.")
            : shortfall
              ? t("Prüfe offene Rechnungen und deine Alltagsschätzung.", "Review unpaid bills and your everyday estimate.")
              : t("Rechnungen, Alltag und Reserve sind bereits abgezogen.", "Bills, everyday spending and reserve are already deducted.");
  function editPlan() {
    setOpen(true);
    if (state === "expired") focusInvalid("payday");
    else if (state === "everyday") focusInvalid("everyday");
    else reviewBalance();
  }
  return (
    <View style={[styles.card, embedded && styles.embedded]}>
      <View ref={resultTarget} style={[styles.dark, embedded && styles.embeddedDark]}>
        <Text style={styles.eyebrow}>{!open && p.forecast ? t(`Bis ${day(p.cash!.payday)} · ${p.forecast.days} Tage`, `Until ${day(p.cash!.payday)} · ${p.forecast.days} days`) : t("Dein Geld bis zum Gehalt", "Your money until payday")}</Text>
        <Text accessibilityRole="header" style={styles.title}>{open ? t("Deine Angaben", "Your entries")
          : currentResult ? shortfall ? t("Voraussichtlich fehlen", "Estimated shortfall") : t("Zusätzlich verfügbar", "Extra money available")
          : state === "stale" ? t("Kontostand bestätigen", "Confirm account balance")
          : state === "expired" ? t("Neuen Zeitraum planen", "Plan your next pay period")
          : state === "dates" ? t("Zahlungstermine ergänzen", "Add payment dates")
          : state === "everyday" ? t("Alltag noch einplanen", "Add everyday spending")
          : t("Was bleibt bis zum Gehalt?", "What is left until payday?")}</Text>
        {currentResult && !open && <Text style={[styles.amount,shortfall ? styles.shortfallAmount : styles.positive]} accessibilityLiveRegion="polite">{money(Math.abs(p.forecast!.remaining!))}</Text>}
        {!open && <Text accessibilityLiveRegion="polite" style={[styles.light,(state === "stale" || state === "expired" || state === "dates") && styles.warning]}>{statusText}</Text>}
        {state === "empty" && !open && <View style={styles.steps}>{[t("Kontostand", "Account balance"),t("Gehaltstag", "Payday"),t("Alltag", "Everyday spending")].map((label,index) => <Text key={label} style={styles.light}>{index+1} · {label}</Text>)}</View>}
        {currentResult && !open && <View style={styles.deductions}>{[[t("Rechnungen", "Bills"),p.forecast!.fixed],[t("Alltag", "Everyday"),p.forecast!.everyday!],[t("Reserve", "Reserve"),p.cash!.protected]].map(([label,value]) => <View key={label} style={styles.deduction}><Text style={styles.light}>{label}</Text><Text style={styles.deductionAmount}>{money(Number(value))}</Text></View>)}</View>}
        <Pressable accessibilityRole="button" accessibilityState={{expanded:open}} disabled={p.busy} style={styles.mintButton} onPress={() => open ? setOpen(false) : editPlan()}>
          <Text style={styles.mintText}>{open ? t("Einklappen", "Collapse") : p.cash ? t("Kontostand aktualisieren", "Update account balance") : t("Verfügbares Geld berechnen", "Calculate available money")}</Text><DisclosureIcon open={open} color="#17211f"/>
        </Pressable>
        {currentResult && !open && (p.forecast!.overdue > 0 || p.forecast!.estimatedBills > 0) && <Pressable accessibilityRole="button" style={styles.reviewPayments} onPress={reviewPayments}><Text style={styles.warning}>{[p.forecast!.overdue > 0 ? t(`${p.forecast!.overdue} frühere Zahlungen offen`, `${p.forecast!.overdue} earlier payments unchecked`) : "",p.forecast!.estimatedBills > 0 ? t(`${p.forecast!.estimatedBills} Beträge geschätzt`, `${p.forecast!.estimatedBills} estimated amounts`) : ""].filter(Boolean).join(" · ")}</Text></Pressable>}
      </View>
      {!open && missingDates > 0 && <View style={styles.form}>{input.costs.filter(c=>!c.nextDueDate).map(c=><Pressable key={c.id} accessibilityRole="button" style={styles.button} onPress={()=>onReviewCost?.(c)}><Text style={styles.buttonText}>{c.name} · {t("Termin ergänzen", "Add date")}</Text></Pressable>)}</View>}
      {!open && p.forecast && !p.stale && <View style={styles.form}><Pressable accessibilityRole="button" accessibilityState={{expanded:calculationOpen}} onPress={()=>setCalculationOpen(!calculationOpen)} style={styles.disclosure}><Text style={styles.subTitle}>{t("So berechnen wir dein verfügbares Geld", "How your available money is calculated")}</Text><DisclosureIcon open={calculationOpen}/></Pressable>{calculationOpen&&<>{calculationRows.map(([label, value]) => <Text key={String(label)} style={styles.note}>{label}: {value === null ? "—" : money(Number(value))}</Text>)}<Text style={styles.subTitle}>{complete ? t("= Zusätzlich verfügbares Geld", "= Extra available") : t("= Angaben fehlen noch", "= Entries still missing")}: {complete ? money(p.forecast!.remaining!) : "—"}</Text><Text style={styles.note}>{complete&&p.forecast!.remaining!>=0?t(`Rechnerisch zusätzlich ${money(p.forecast!.remaining!/p.forecast!.days)} pro Tag. Alltag ist schon abgezogen.`,`Equivalent to ${money(p.forecast!.remaining!/p.forecast!.days)} extra per day. Everyday spending is already deducted.`):""}</Text></>}</View>}
      {currentResult && !open && onSavings && <View style={styles.form}><Text style={styles.subTitle}>{t("Mehr übrig behalten? Prüfe eine konkrete Ausgabe.", "Want more left over? Review one specific cost.")}</Text><Pressable accessibilityRole="button" style={styles.button} onPress={onSavings}><Text style={styles.buttonText}>{t("Nächster Schritt: Kosten senken", "Next step: lower a cost")}</Text></Pressable></View>}
      {open && (
        <View ref={formTarget} onLayout={revealBalance}><FormSection style={styles.form} onSave={async()=>{const saved=await p.save(focusInvalid);if(saved){setOpen(false);requestAnimationFrame(()=>scrollTarget(resultTarget.current));}return saved;}} keyboardSaveLabel={t("Anzeigen","Show result")} saveLabel={t("Verfügbares Geld anzeigen", "Show available money")}>
          <Text style={styles.subTitle}>{t("1 · Dein Geld heute", "1 · Your money today")}</Text>
          <Text style={styles.note}>{t("Wie in deiner Banking-App – noch nichts abziehen. Das nächste Gehalt zählt erst danach.", "Use today's balance from your banking app, before any deductions. Your next salary is not included.")}</Text>
          <FormInput
            autoFocus={focusBalance}
            focusRequest={invalidFocus.field === "balance" ? invalidFocus.request : balanceFocusRequest}
            label={t("Aktueller Kontostand", "Current account balance")}
            keyboardType="decimal-pad"
            signedAmount
            accessibilityHint={p.errorField === "balance" ? p.error : undefined}
            value={p.balance}
            onChangeText={p.setBalance}
          />
          <FormInput
            label={t(
              "Nächstes Gehalt am (TT.MM.JJJJ)",
              "Next payday (DD.MM.YYYY)",
            )}
            keyboardType="number-pad"
            maxLength={10}
            placeholder={p.today.split("-").reverse().join(".")}
            focusRequest={invalidFocus.field === "payday" ? invalidFocus.request : 0}
            accessibilityHint={p.errorField === "payday" ? p.error : undefined}
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
          <View style={styles.box}>
            <Text style={styles.subTitle}>{t("2 · Offene Rechnungen", "2 · Unpaid bills")}</Text>
            {p.preview ? <>
              <Text style={styles.subTitle}>{t(`${p.preview.payments.length} Zahlungen bis ${day(p.payday)}: ${money(p.preview.fixed)}`, `${p.preview.payments.length} payments before ${day(p.payday)}: ${money(p.preview.fixed)}`)}</Text>
              <Text style={styles.note}>{t("Diese Rechnungen aus My Home ziehen wir automatisch ab. Bereits bezahlt? Hake sie ab, damit sie nicht nochmals abgezogen werden.", "We deduct these My Home bills automatically. Already paid? Check them off so they are not deducted again.")}</Text>
              {p.preview.overdue > 0 && <Text style={styles.note}>{t(`${p.preview.overdue} frühere Zahlungen dieses Monats sind noch offen und enthalten.`, `${p.preview.overdue} earlier payments this month are still unchecked and included.`)}</Text>}
              {p.preview.estimatedBills > 0 && <Text style={styles.note}>{t(`${p.preview.estimatedBills} Beträge noch geschätzt.`, `${p.preview.estimatedBills} amounts are still estimates.`)}</Text>}
              {bills.length > 0 && <Pressable accessibilityRole="button" style={styles.button} onPress={reviewPayments}><Text style={styles.buttonText}>{t("Zahlungen prüfen", "Review payments")}</Text></Pressable>}
              {p.preview.missingDates > 0 && <Text style={styles.error}>{t(`${p.preview.missingDates} Kosten brauchen noch einen Zahlungstermin.`, `${p.preview.missingDates} costs still need a payment date.`)}</Text>}
              {input.costs.filter(c=>!c.nextDueDate).map(c=><Pressable key={c.id} accessibilityRole="button" style={styles.button} onPress={()=>onReviewCost?.(c)}><Text style={styles.buttonText}>{c.name} · {t("Termin ergänzen","Add date")}</Text></Pressable>)}
            </> : <Text style={styles.note}>{t("Wähle oben deinen nächsten Gehaltstag. Dann zeigen wir, welche gespeicherten Rechnungen bis dahin noch anstehen.", "Choose your next payday above to see which saved bills are still due before then.")}</Text>}
          </View>
          <Text style={styles.subTitle}>{t("3 · Dein Alltag bis dahin", "3 · Everyday spending until then")}</Text>
          <FormInput
            label={t(
              "Alltagsausgaben bis zum Gehalt",
              "Everyday spending until payday",
            )}
            focusRequest={invalidFocus.field === "everyday" ? invalidFocus.request : 0}
            accessibilityHint={p.errorField === "everyday" ? p.error : undefined}
            value={p.everyday}
            onChangeText={p.setEveryday}
            keyboardType="decimal-pad"
            placeholder={t("z. B. 200,00", "e.g. 200.00")}
          />
          <Text style={styles.note}>{t("Wie viel brauchst du bis dahin noch für Lebensmittel, Freizeit und andere Alltagsausgaben? Gespeicherte Rechnungen zählen hier nicht dazu. Auch 0 ist möglich.", "How much will you still need for groceries, leisure and other everyday spending? Do not include saved bills here. 0 is allowed.")}</Text>
          {p.suggestedEveryday !== null && <View style={styles.box}><Text style={styles.note}>{t(`Vorschlag für ${p.preview!.days} Tage: ${money(p.suggestedEveryday)} – aus deiner Monatsschätzung von ${money(input.variableMonthly!)}.`, `Suggestion for ${p.preview!.days} days: ${money(p.suggestedEveryday)} – based on your monthly estimate of ${money(input.variableMonthly!)}.`)}</Text>{button(t("Vorschlag übernehmen", "Use suggestion"),()=>p.setEveryday(de?String(p.suggestedEveryday).replace(".",","):String(p.suggestedEveryday)))}</View>}
          <Pressable accessibilityRole="button" accessibilityState={{expanded:reserveOpen}} onPress={()=>setReserveOpen(!reserveOpen)} style={styles.disclosure}><Text style={styles.note}>{t("Geld als Reserve behalten (optional)", "Keep some money in reserve (optional)")}{p.reserved>0?` · ${money(p.reserved)}`:""}</Text><DisclosureIcon open={reserveOpen}/></Pressable>
          {reserveOpen && <>
            <FormInput label={t("Reserve, die übrig bleiben soll (optional)", "Money to keep in reserve (optional)")} focusRequest={invalidFocus.field === "protected" ? invalidFocus.request : 0} accessibilityHint={p.errorField === "protected" ? p.error : undefined} keyboardType="decimal-pad" value={p.protectedAmount} onChangeText={p.setProtected}/>
            <Text style={styles.note}>{t("Dieser Teil deines Kontostands soll unangetastet bleiben. Rechnungen und Alltag sind bereits berücksichtigt. Sparziele werden nicht automatisch abgezogen.", "This part of your balance stays untouched. Bills and everyday spending are already accounted for. Savings goals are not deducted automatically.")}</Text>
          </>}
          <Text style={styles.note}>{t("Das nächste Gehalt ist hier noch nicht eingerechnet.", "Your next salary is not included yet.")}</Text>
          <FormSubmitButton label={t("Verfügbares Geld anzeigen", "Show available money")} style={styles.button} textStyle={styles.buttonText}/>
          {p.error && <Text accessibilityRole="alert" style={styles.error}>{p.error}</Text>}
        </FormSection></View>
      )}
      <QuickCheck input={input} data={data} onSave={onSave} onBalance={reviewBalance} onPayments={reviewPayments} onSavings={onSavings} onReview={onReviewCost}/>
      {bills.length > 0 && <View ref={billsTarget} onLayout={revealBills} style={styles.form}><Pressable accessibilityRole="button" accessibilityState={{expanded:billsOpen}} onPress={()=>setBillsOpen(!billsOpen)} style={styles.disclosure}><Text style={styles.note}>{t("Zahlungen bis zum Gehalt abhaken", "Check off payments until payday")} · {bills.filter(b=>!checklist.isPaid(b)).length} {t("offen", "unpaid")}</Text><DisclosureIcon open={billsOpen}/></Pressable>{billsOpen&&<><Text style={styles.note}>{t("Bereits abgebucht oder bezahlt? Hier abhaken. Das Häkchen erscheint auch in deiner Monatscheckliste. Danach den aktuellen Kontostand bestätigen.", "Already debited or paid? Check it off here. The same checkmark appears in your monthly checklist. Then confirm your current account balance.")}</Text>{bills.map(b=>{const paid=checklist.isPaid(b);return <Pressable key={paymentKey({costId:b.cost.id,month:b.month,date:b.date})} accessibilityRole="checkbox" accessibilityState={{checked:paid,disabled:checklist.busy||checklist.isClosed(b)}} accessibilityLabel={`${b.cost.name} · ${day(b.date)} · ${money(b.cost.amount)} · ${t("Bezahlt", "Paid")}`} disabled={checklist.busy||checklist.isClosed(b)} onPress={()=>void checklist.toggle(b)} style={styles.payment}><Text style={styles.check}>{paid?"✓":"○"}</Text><Text style={[styles.paymentName,paid&&styles.paid]}>{b.cost.name} · {day(b.date)}</Text><Text style={styles.note}>{b.estimated?t("ca. ","approx. "):""}{money(b.cost.amount)}</Text></Pressable>})}<PaymentAmountEditor c={checklist} locale={de?"de":"en"}/>{checklist.error&&<Text accessibilityRole="alert" style={styles.error}>{checklist.error}</Text>}</>}</View>}
    </View>
  );
}
const styles = StyleSheet.create({
  embedded: {marginVertical:0,borderWidth:0},
  embeddedDark: {borderRadius:14,alignItems:"flex-start"},
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
  dark: { padding: 18, gap: 12, alignItems: "center", backgroundColor: "#24272c" },
  steps: { gap: 5, alignSelf: "stretch", marginVertical: 4 },
  deductions: { flexDirection: "row", flexWrap: "wrap", gap: 12, alignSelf: "stretch", borderTopWidth: 1, borderColor: "#52605b", paddingTop: 14 },
  deduction: { flexGrow: 1, flexBasis: 65, gap: 4 },
  deductionAmount: { color: "#fff", fontSize: 13, fontWeight: "600" },
  reviewPayments: { minHeight: 44, justifyContent: "center" },
  eyebrow: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    color: "#72dca3",
  },
  title: { fontSize: 21, fontWeight: "700", color: "#fff", textAlign: "center" },
  amount: { fontSize: 28, fontWeight: "900", color: "#fff" },
  positive: {color:"#72dca3"},
  shortfallAmount: {color:"#ffd28c"},
  light: { fontSize: 13, lineHeight: 20, color: "#d1d7d4" },
  warning: { fontSize: 12, color: "#ffe1a8" },
  mintButton: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
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
