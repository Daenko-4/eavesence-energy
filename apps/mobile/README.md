# EAVESENCE Home mobile

This branch is a temporary **free iPhone preview** using Expo SDK 54, which
matches Expo Go from the iPhone App Store. It keeps household costs, income,
forecast, devices and history from the regular SDK 57 app. Purchases are
disabled in this preview; the Pro screen only records beta interest. Keep this
SDK downgrade separate from the regular release.

Shared Expo/React Native application for iOS and Android. It is local-first:
onboarding, recurring household costs, net income, devices and monthly history
are stored on the device. The home screen previews payments next month when
payment dates are entered. The cost calculations are shared with the website;
mobile data is currently separate from website data.

## Local start

From the repository root:

```bash
npm run mobile:start
```

Install Expo Go from the iPhone App Store. On a physical iPhone, sign in to the
same free Expo account in Expo Go and Expo CLI (`cd apps/mobile`,
`npx expo login`, `npx expo whoami`). Keep the phone and PC on the same Wi-Fi,
run `npm run mobile:start` from the repository root and scan the QR code with
the iPhone camera. If the connection fails, stop the server and run
`npx expo start --tunnel` from `apps/mobile`.

After switching from the regular SDK 57 app, run `npm ci` at the repository
root before starting Expo. The regular SDK 57 app is on `main`.

## Test on an iPhone with TestFlight

Switch back to `main` and run `npm ci` before using this section. The preview
branch has purchases disabled and is intended for Expo Go testing only.

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

This Expo Go preview deliberately shows beta interest instead of attempting a
purchase.
