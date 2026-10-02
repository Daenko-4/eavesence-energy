# EAVESENCE Home mobile

Shared Expo/React Native application for iOS and Android. It is local-first:
onboarding, recurring household costs, net income, devices and monthly history
are stored on the device. The home screen previews payments next month when
payment dates are entered. The cost calculations are shared with the website;
mobile data is currently separate from website data. A RevenueCat
SDK key enables real store offerings only after Apple and Google products have
been configured.

## Local start

From the repository root:

```bash
npm run mobile:start
```

For the current SDK 57, use a compatible Expo Go version on iPhone or Android.
Expo Go can exercise the household flows but native subscriptions and some
notification behavior require a development or TestFlight build. Native
purchases need store products and a separate sandbox test.

Settings are available from the top-right header on every screen. Language changes
are saved immediately. New homes start with household costs only; the Energy tab
contains the optional device calculator and history. Users can add its device
breakdown to My Home as an energy tile without counting estimates twice in the budget.
On iOS, forms with a save action show that action directly above the keyboard.

The app offers German and English, EUR and CHF, a searchable device list,
recurring cost entry with date shortcuts, monthly history and an experimental
12-month savings plan. Settings can import a complete EAVESENCE website backup
in EUR or CHF after a replacement confirmation. Website and app remain separate;
there is no automatic synchronization. Export an app backup before replacing data.
The savings plan needs an everyday spending estimate for a fuller projection;
undated recurring costs are averaged and marked as incomplete. Its Pro preview
is free to try while the subscription offering is being prepared.

## Free iPhone beta

Version 0.2 groups planning around spending until payday, realistic changes and
confirmed savings. TestFlight purchases are explicitly disabled. Run
`npm run mobile:beta:check` from the repository root. The account/signing handoff,
iPhone test protocol and external beta release gates are in [BETA-TEST.md](BETA-TEST.md).

## Test on an iPhone with TestFlight

A paid Apple Developer Program membership, access to App Store Connect, and a
free Expo account are required. These steps work from Windows; no Mac is needed.
The `testflight` profile creates a store-signed beta build, **not** an App Store
release. It runs independently of Expo Go and the local development server.

1. Install the EAS CLI with `npm install --global eas-cli`. Sign in to the Expo
   account that owns this project with `eas login` (or check `eas whoami`).
2. In PowerShell, from the repository root, run `npm ci` and `cd apps/mobile`.
3. Run `eas init` to link this app to your Expo account. If EAS offers to create
   a project, use the existing `eavesence-home` slug. This writes the Expo
   project ID to `app.json`; keep that change for subsequent builds.
4. Run `eas build --platform ios --profile testflight`. Select the correct
   Apple Developer team and let EAS manage the signing certificate and
   provisioning profile when prompted. The iOS bundle ID is
   `com.eavesence.home`; confirm it belongs to your team before creating it.
5. Once the build succeeds, run `eas submit --platform ios --profile testflight`
   and select the build you just created. Authenticate with App Store Connect
   when prompted. This uploads to TestFlight, not to App Review.
6. In App Store Connect, add your Apple ID as an internal tester for EAVESENCE
   Home, assign the processed build to the internal group, then accept the
   invitation in the TestFlight app on your iPhone. External testers require
   Apple's beta review.

No RevenueCat key is required to try onboarding, household costs, income,
payment forecasts, devices and history. Data stays on that phone and is not
shared with the website. To test a later revision, create and submit a new
TestFlight build; the build number increments on EAS.

For a directly installable iOS build instead of TestFlight, register the phone
with `eas device:create` and run `eas build --platform ios --profile preview`.
That path uses Apple ad hoc signing and only registered devices can install it.

## Store preparation

1. Enrol in Apple Developer and Google Play Console.
2. Create the app identifiers `com.eavesence.home`.
3. Create matching monthly and yearly subscription products.
4. Create a `pro` entitlement and offering in RevenueCat.
5. Copy `.env.example` to `.env.local` and set the platform SDK key for the
   active build environment.
6. Configure EAS credentials with `eas build:configure`.
7. Run preview builds, internal testing and TestFlight before production.

The app deliberately shows beta interest instead of attempting a purchase when
no RevenueCat key or store offering is configured.
