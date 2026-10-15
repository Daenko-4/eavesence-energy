# EAVESENCE 0.2.1 — iPhone beta

The free beta requires no login or bank connection. The TestFlight profile
explicitly disables purchases; all planning tools are a preview. Data stays on
the device. Website and app do not synchronize. Website backups can be imported into the
app; app backups restore app data. App-to-website import is not supported.

## Prepare from Windows PowerShell

From the repository root:

```powershell
npm ci
npm run check
npm run mobile:beta:check
Set-Location .\apps\mobile
npx expo install --check
npx expo export --platform ios --output-dir ..\..\ios-beta-export
npx eas-cli login
npx eas-cli init
node ..\..\scripts\mobile-beta-preflight.mjs --require-linked
npx eas-cli build --platform ios --profile testflight
```

Link the correct Expo owner with `eas init`, then commit `extra.eas.projectId`
in app.json. Apple signing requires the correct Developer team and access to
App Store Connect. Bundle ID: `com.eavesence.home`. No account identifiers or
credentials are invented here. Once built, submit the exact build ID:

```powershell
npx eas-cli submit --platform ios --profile testflight --id YOUR_BUILD_ID
```

This uploads to TestFlight; it does not release to the Store. Test internally
first, then create an external group of 5–8 people and submit for beta review.
A paid Apple Developer membership is required. See
[Expo TestFlight](https://docs.expo.dev/submit/testflight/) and
[Apple external testing](https://developer.apple.com/help/app-store-connect/test-a-beta-version/invite-external-testers).

## Internal iPhone acceptance test — 20 minutes

Export real data first. Use invented amounts for destructive tests.

1. Fresh start: choose English, Get started. Follow home name/currency → income →
   first cost → first overview. Settings and bottom navigation stay hidden until
   completion. Enter 2,400/month and rent 800, then open the overview. Test
   force-close during the cost step: income and the current step persist.
   Before adding a cost, go back to income and correct it. Invalid amounts retain
   the draft. In a fresh second run, enter 0 income and internet 40: the overview
   shows 0 income and a 40 shortfall without requesting income again. Annual-net
   input is available later via Edit income, not in the initial monthly setup.
   Afterwards open Settings, switch DE/EN, relaunch: language persists.
2. Income 2,400/month; rent 800, internet 40, insurance 240/year. Fixed costs:
   860/month. Remainder: 1,540 before everyday spending. Missing payment dates
   must produce an explicitly incomplete payment forecast.
3. Extra income: edit income, expand the optional section. Add 13th salary
   2,400 in June, 14th salary 2,000 in November, one-off bonus 600 in December
   this year. Save and relaunch: regular income stays 2,400; annual overview
   includes extras. Next year's average excludes the one-off bonus. Hide the
   section and change regular salary: extras remain. Remove/edit an extra,
   save and restore a backup. Invalid amount/month/year retains the draft.
   Annual-net entries remain clearly labelled averages; switching to monthly
   requires the actual monthly amount and never guesses it from annual net.
   Test DE/EN, month picker with the keyboard open, and keyboard save.
4. Open Edit income from Overview, save a changed amount: return to Overview,
   with the remainder updated. Change internet to 35: costs 855, remainder 1,545. Expand Organize cost areas. Create, move and rename a
   custom Insurance tile; entries must not duplicate or disappear.
5. Search at least five saved costs by name/category; clear the search and check
   totals stay unchanged. Open one cost to edit. Cancel changed cost/income/settings:
   keep editing or discard must be a deliberate choice. Settings opens from Costs
   and saving/back returns there. Calculator/reminders/backup/help are collapsed.
   Keyboard: name, decimal amount, date and last field on a small iPhone. The
   focused field and save action remain visible. Test keyboard save and form
   save, invalid entries and repeated taps. Invalid inputs retain the draft.
6. Force-close, airplane mode, reopen: values persist. Calculate a router in
   Energy, optionally add its tile. Estimates must not raise fixed costs.
7. Export to Files, change a cost, import the backup. Cancel first, then confirm.
   Check income, costs, tiles, devices. Invalid JSON or cancelled picker changes
   nothing. Before reinstalling or changing devices, export a backup.
8. Open Plan: only the selected question is shown. Switch between To payday,
   Save and Saved, preserving entries. Under Save, expand the optional monthly
   budget. Estimate everyday spending 500: monthly room 1,045. Keep that average separate
   from today's balance until payday. Enter balance, future payday, remaining
   spending and protected money. Next salary is excluded; missing dates and
   stale balances are labelled. Test across a month boundary.
9. Plan internet at 30; it stays 35 until implementation is confirmed. Afterwards
   costs update and question 03 contains only confirmed changes. The savings
   total is calculated from entries, not verified through bank transactions.
10. Notifications: allow/deny, activate/deactivate monthly reminder, reopen. Add
   a cost-review reminder and delete its cost. Reset removes EAVESENCE reminders
   and returns to simple onboarding.
11. Visual: small + large iPhone, large system text, both languages. Check bottom
    navigation, long tile names, currencies, safe areas, keyboard opening/closing
    and expanded forms. No clipped or unreachable controls.

## External test — 7 days

Give tasks without explaining the UI: add income and three costs, find what is
left, back up your home, identify a realistic change, explain what can be spent
until payday. Observe the first session without guidance.

Record device/iOS/build, DE/EN, task, expected/actual result, reproduction steps
and optional screenshot. Do not request real salary, complete backups or bank
data. Ask what was unclear, how long updates took and which benefit they would
pay for. Do not promise automatic sync or bank-verified savings.

## Release gate

- No unresolved data-loss, crash, blocked keyboard or calculation defects.
- Real-iPhone acceptance tests and backup restoration pass.
- At least five external testers finish core tasks without guidance.
- Severe findings fixed and retested; smaller issues documented.
- Store metadata, screenshots, support contact and privacy disclosures match the
  shipping build. Purchases stay disabled for free launch. Paid Pro requires
  separate entitlement/paywall and purchase/restoration tests.

Automated logic, storage-failure and web-flow checks do not replace native
keyboard, signing or physical-device testing.

## Native parity and free-core regression (October 2026)

The native Month screen now groups the home name and Settings above separate
Add cost / Edit income actions. The payment checklist starts collapsed; the
payment link from payday planning opens it. Calculator preferences and the
always-visible electricity target are in Energy. Target changes save directly;
price changes have their own save action and do not change household bills.
The compact payday result uses the same empty/incomplete/stale/ready states as
the website. Older balances never display an apparently current result.

Restore a backup is available on the welcome screen, including after reset.
Malformed backups reject the complete replacement, including damaged planning
rows, unknown currency/language and invalid timestamps. Loading damaged saved
app data blocks setup and offers retry/import instead of creating an empty home.
Website multi-key cost saves, imports and resets now keep a recovery journal;
startup finishes a pending rollback before displaying the household.

Automated regression uses production components and shared calculations, with
native storage/file/notification boundaries substituted for browser testing:

- Guided setup resumes at the first-cost step after a new app process.
- 2,400 monthly income plus optional 13th/14th salary and a dated bonus keep the
  regular monthly budget separate from annual averages.
- Rent 800, internet 40, variable electricity plan 80 and annual insurance 240
  give 940 monthly costs and 1,460 before everyday spending. An actual 76.40
  invoice affects that occurrence only; its paid status survives restoration.
- Export, invalid-file rejection, cancelled replacement, reset and restore from
  the welcome screen preserve the full app profile, costs, notes and payments.
- Storage failure preserves the entered draft and the previous persisted price;
  price and target changes save independently, including a legacy 42% target.
- Website cancellation/write-failure rollback and later successful import.

Still required on a physical iPhone: keyboard/accessory clearance, native date
picker, VoiceOver/large text, airplane-mode relaunch, Files share/import, and
notification permissions. Browser component tests do not simulate these APIs.
