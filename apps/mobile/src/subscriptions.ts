import Purchases, {
  LOG_LEVEL,
  type PurchasesPackage,
} from "react-native-purchases";

let configured = false;

export function configureSubscriptions() {
  const apiKey = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY;
  if (!apiKey || configured) return false;

  Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.INFO);
  Purchases.configure({ apiKey });
  configured = true;
  return true;
}

export async function getAvailablePackages() {
  if (!configured) return [];
  const offerings = await Purchases.getOfferings();
  return offerings.current?.availablePackages ?? [];
}

export async function purchasePro(selectedPackage: PurchasesPackage) {
  const { customerInfo } = await Purchases.purchasePackage(selectedPackage);
  return Boolean(customerInfo.entitlements.active.pro);
}

export async function restorePro() {
  if (!configured) return false;
  const customerInfo = await Purchases.restorePurchases();
  return Boolean(customerInfo.entitlements.active.pro);
}
