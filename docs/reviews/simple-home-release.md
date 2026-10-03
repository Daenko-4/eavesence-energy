# Simple My Home release review

## User test
A fresh fictional household was created on the public website, income and a recurring internet bill saved, and persistence verified after reload. No bank account or competitor account was connected.

The initial dashboard exposed several planning systems simultaneously. Monthly averages, scheduled payments and savings estimates competed for attention. A cost list required opening a tile again after reload. The setup also incorrectly claimed electricity was already configured.

## Product boundary
The free core is income, recurring costs, monthly remainder, editing and local backup/import. The remainder is explicitly before everyday spending, not a bank balance or a savings figure. Missing due dates affect the dated payment preview, not the monthly average.

Planning has a separate opt-in workspace with three questions: spend until payday, realistic savings, and confirmed savings. It is labelled a free Pro preview; this change does not implement billing or secure subscription entitlements.

Goals, reserves, purchase decisions and detailed insights remain in source and stored data. `src/lib/homeRelease.ts` controls their visibility. Profile edits and backup exports must preserve advanced planning data.

## Comparison basis
Official public product descriptions, not signed-in competitor testing:
- https://www.ynab.com/why-ynab-is-different — assigning existing money to priorities.
- https://goodbudget.com/what-you-get/ — envelope budgeting.
- https://finanzguru.de/ — connected accounts, automatic categorization and contracts.

EAVESENCE currently requires manual cost maintenance and uses local storage. Its practical focus should be a quick household overview without requiring banking access, followed by an optional plan. Automation and cross-device continuity remain future product decisions.
