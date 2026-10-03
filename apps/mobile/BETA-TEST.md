# EAVESENCE 0.2.1 — iPhone beta

The free beta requires no login or bank connection. The TestFlight profile
explicitly disables purchases; all planning tools are a preview. Data stays on
the device. Website and app do not synchronize; JSON backups transfer the data.

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

1. Fresh start: choose English, Get started. Follow income → first cost →
   first overview. Settings and bottom navigation must stay hidden until
   completion. Enter 2,400/month and rent 800, then open the overview. Test
   force-close during the cost step: income and the current step persist.
   Test skip, back, invalid amounts and keyboard save. In a fresh second run,
   enter 28,800/year: the first overview must show 2,400/month.
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
5. Keyboard: name, decimal amount, date and last field on a small iPhone. The
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
