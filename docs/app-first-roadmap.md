# EAVESENCE app-first roadmap

## Product direction

EAVESENCE Home is the primary consumer product. The public Energy website
remains the acquisition surface and product demo. B2B is a backup monetisation
path that reuses the shared calculation package rather than a separate codebase.

The core habit is deliberately monthly, not daily:

1. Calculate and save the household's relevant consumers.
2. Record one monthly consumption or bill value.
3. Understand the change and the largest cost driver.
4. Take one action and compare again next month.

Rooms are not part of the primary experience. They added setup work without
improving the main decision: which household consumer should I review first?

## Implemented foundation

- Household onboarding in German and English
- Local-first profile, household-wide device list and savings goal
- Household totals recalculated in the household currency and electricity price
- Monthly overview with one clear next action, baseline and trend
- Monthly consumption and cost history
- Pro monthly/yearly price preview and beta-interest signal
- Activation, return, price-preview and beta analytics on the web
- Shared `@eavesence/core` calculation package
- Expo application for iOS and Android
- Local mobile onboarding, devices, history and reminder flow
- Mobile monthly entry by consumption or bill amount with automatic conversion
- RevenueCat integration that activates only when an SDK key and offerings exist
- EAS build and submission configuration

## Validation gates

Do not scale paid acquisition until the sample is large enough and these ratios
are directionally healthy:

1. At least 50% of visitors who start onboarding complete it.
2. At least 40% of activated users save one device.
3. At least 20% record a first monthly value.
4. At least 30% of users with a first monthly value return for a second one.
5. At least 5% open or act on the Pro offer after experiencing a trend or insight.

Native beta is ready for wider testing when critical crashes are absent, the
first useful result takes under two minutes and 50–100 suitable testers can be
recruited. Store marketing should only scale after repeat use and paid intent
are both visible.

## Free and Pro boundary

Free must deliver the complete manual loop: calculator, household device list,
monthly check-in, current totals, basic trend and one actionable insight. Pro
should remove work or reduce risk rather than hide the basic result:

- automatic unusual-consumption alerts;
- longer history and richer comparisons;
- sync, backup and multiple households;
- automated meter, bill and energy-label capture;
- later, smart-meter and device integrations.

This boundary follows the strongest current pattern in the category. HomeWizard
keeps basic monitoring free and sells standby detection, unusual-use alerts,
longer storage and export in Energy+. Google Home similarly reserves advanced
automation for Premium. EAVESENCE should not charge merely for adding a fourth
device while the data is still entered manually.

## Product research snapshot (September 2026)

- [Tibber](https://apps.apple.com/no/app/tibber-smarter-power/id1127805969)
  validates demand for a polished energy companion (4.7 from roughly 9,700
  Norwegian App Store ratings) and centres consumption and smart control.
- [HomeWizard Energy+](https://www.homewizard.com/shop/energy-plus/?default=true)
  monetises automation and deeper insight: standby detection, unusual-use
  notifications, multi-year storage and export.
- [Home Assistant's energy dashboard](https://www.home-assistant.io/dashboards/energy/)
  makes period comparison and a usage-sorted device view central. Its breadth is
  useful for power users, but EAVESENCE should expose only the next relevant
  insight by default.
- [Oura](https://apps.apple.com/us/app/oura/id1043837948) is outside the energy
  category but demonstrates the retention pattern well: a small number of clear
  scores followed by actionable guidance, instead of raw data alone.
- [Google Home](https://home.google.com/welcome/) reinforces the value of one
  whole-home surface and positions paid value around smarter automation.

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
