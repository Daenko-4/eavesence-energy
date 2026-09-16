# EAVESENCE Home mobile

Shared Expo/React Native application for iOS and Android. It is local-first:
onboarding, devices and monthly history are stored on the device. A RevenueCat
SDK key enables real store offerings only after Apple and Google products have
been configured.

## Local start

From the repository root:

```bash
npm run mobile:start
```

Use an Android device/emulator or an iPhone with Expo Go for UI testing. Native
purchase and notification behavior should also be tested in development builds.

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
