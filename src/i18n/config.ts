export type Locale = "de" | "en";

export const defaultLocale: Locale = "en";

export const locales: Locale[] = ["de", "en"];

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export function getHomeHref(locale: Locale) {
  return locale === "de" ? "/de" : "/";
}

export function getDevicesHref(locale: Locale) {
  return locale === "de" ? "/geraete" : "/en/devices";
}

export function getCalculatorHref(locale: Locale) {
  return getHomeHref(locale);
}

export function getHowItWorksHref(locale: Locale) {
  return `${getHomeHref(locale)}#so-funktionierts`;
}

export function getFaqHref(locale: Locale) {
  return `${getHomeHref(locale)}#faq`;
}
