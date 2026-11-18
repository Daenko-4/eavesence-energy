export const VALUE_PRIVACY_KEY = "eavesence-hide-values";
export const VALUE_PRIVACY_EVENT = "eavesence:value-privacy";

// Apply the saved preference before the page paints, including on reload.
export const valuePrivacyScript = `try{if(localStorage.getItem(${JSON.stringify(VALUE_PRIVACY_KEY)})==="true")document.documentElement.dataset.privateValues="true"}catch{}`;
