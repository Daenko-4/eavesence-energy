# EAVESENCE Home mobile

This branch is a temporary **free iPhone preview** using Expo SDK 54, which
matches Expo Go from the iPhone App Store. It keeps the household cost, income,
forecast, device and history flows from the SDK 57 app. Purchases are disabled
in this preview; the Pro screen can only record beta interest. Do not merge the
SDK downgrade into the regular app without a separate product decision.

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

If switching to this branch from the SDK 57 app, run `npm ci` at the repository
root before starting Expo. The regular SDK 57 app and TestFlight build remain
on their own branches.

## Store preparation

1. Enrol in Apple Developer and Google Play Console.
2. Create the app identifiers `com.eavesence.home`.
3. Create matching monthly and yearly subscription products.
4. Create a `pro` entitlement and offering in RevenueCat.
5. Copy `.env.example` to `.env.local` and set the platform SDK key for the
   active build environment.
6. Configure EAS credentials with `eas build:configure`.
7. Run preview builds, internal testing and TestFlight before production.

This preview deliberately shows beta interest instead of attempting a purchase.
