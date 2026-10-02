import { createContext, useContext } from "react";

export const StoreSettingsContext = createContext(null);
export const defaultSettings = { currency: "USD", storeName: "KHAN E-Commerce", supportEmail: "support@khan.store", fulfillmentSla: "2-3 Business Days" };
export const normalizeSettings = (value = {}) => Object.fromEntries(Object.keys(defaultSettings).map((key) => [key, value[key] ?? defaultSettings[key]]));

export const useStoreSettings = () => useContext(StoreSettingsContext) || {
  settings: defaultSettings,
  applySettings: () => {},
  formatCurrency: (amount) => `$${(Number(amount) || 0).toFixed(2)}`
};