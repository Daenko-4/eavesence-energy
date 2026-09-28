// Expo Go does not include the native store modules. The free iPhone preview
// keeps beta interest available while real purchases use the SDK 57 build.
export type PurchasesPackage = {
  identifier: string;
  product: { title: string; priceString: string };
};

export function configureSubscriptions() {
  return false;
}

export async function getAvailablePackages(): Promise<PurchasesPackage[]> {
  return [];
}

export async function purchasePro(_selectedPackage: PurchasesPackage) {
  return false;
}

export async function restorePro() {
  return false;
}
