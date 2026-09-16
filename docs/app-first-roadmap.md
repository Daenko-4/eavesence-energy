# EAVESENCE app-first roadmap

## Product direction

EAVESENCE Home is the primary consumer product. The public Energy website
remains the acquisition surface and product demo. B2B is a backup monetisation
path that reuses the shared calculation package rather than a separate codebase.

## Implemented foundation

- Household onboarding in German and English
- Local-first profile, rooms, device assignments and savings goal
- Household totals recalculated in the household currency and electricity price
- Three-device activation milestone
- Monthly consumption and cost history
- Pro monthly/yearly price preview and beta-interest signal
- Activation, return, price-preview and beta analytics on the web
- Shared `@eavesence/core` calculation package
- Expo application for iOS and Android
- Local mobile onboarding, devices, history and reminder flow
- RevenueCat integration that activates only when an SDK key and offerings exist
- EAS build and submission configuration

## Validation gates

Do not scale paid acquisition until the sample is large enough and these ratios
are directionally healthy:

1. At least 50% of visitors who start onboarding complete it.
2. At least 40% of activated users save one device.
3. At least 20% save three devices.
4. At least 5% open or act on the Pro offer.
5. Returning use is visible at 7 and 30 days.

Native beta is ready for wider testing when critical crashes are absent, the
first useful result takes under two minutes and 50–100 suitable testers can be
recruited. Store marketing should only scale after repeat use and paid intent
are both visible.

## External prerequisites

These cannot be completed in source code alone:

- Apple Developer enrolment and App Store Connect app
- Google Play Console enrolment and app
- Monthly and yearly products in both stores
- RevenueCat project, `pro` entitlement and offering
- EAS owner/project linkage and signing credentials
- TestFlight and Google Play internal-testing approvals
- A real mobile analytics destination if web analytics cannot receive native events

## B2B activation triggers

Prepare the white-label/embed layer only when one of these conditions occurs:

- Users return but paid conversion remains below 2% after three offer tests.
- 10,000 active users produce less than EUR 1,000 monthly recurring revenue.
- Multiple companies request embedding or licensing.
- Paid acquisition remains above the expected first-year customer value.

The B2B offer should expose the shared core as an embeddable branded calculator,
PDF report and lead form. It must not introduce per-customer code forks.
